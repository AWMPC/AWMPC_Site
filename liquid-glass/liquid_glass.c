/*
 * liquid_glass.c — Apple Liquid Glass refraction + blur via WebAssembly
 *
 * Implements a physically-based glass material effect:
 *   1. Separable Gaussian blur (configurable radius)
 *   2. Refraction distortion (paraboloid dome + Snell's law)
 *   3. Specular highlight (Phong model + Fresnel)
 *   4. Saturation boost (simulates glass chromatic enrichment)
 *   5. Color tinting (semi-transparent overlay)
 *
 * Build (Emscripten — recommended):
 *   emcc liquid_glass.c -O3 --no-entry \
 *     -s EXPORTED_FUNCTIONS='["_lg_init","_lg_input_ptr","_lg_output_ptr","_lg_process"]' \
 *     -s INITIAL_MEMORY=16777216 -o liquid_glass.wasm
 *
 * Build (clang standalone — no runtime dependencies):
 *   clang --target=wasm32 -O3 -nostdlib -Wl,--no-entry \
 *     -Wl,--export=lg_init -Wl,--export=lg_input_ptr \
 *     -Wl,--export=lg_output_ptr -Wl,--export=lg_process \
 *     -Wl,--initial-memory=16777216 \
 *     -o liquid_glass.wasm liquid_glass.c
 */

#include <stdint.h>

/* ================================================================
 *  Standalone math (no libc required for clang --target=wasm32)
 * ================================================================ */

static float lg_fabsf(float x) { return x < 0.0f ? -x : x; }
static float lg_fmaxf(float a, float b) { return a > b ? a : b; }
static float lg_fminf(float a, float b) { return a < b ? a : b; }
static float lg_clamp(float v, float lo, float hi) {
    return lg_fminf(lg_fmaxf(v, lo), hi);
}

static float lg_sqrtf(float x) {
    if (x <= 0.0f) return 0.0f;
    float g = x * 0.5f;
    for (int i = 0; i < 8; i++) g = 0.5f * (g + x / g);
    return g;
}

static float lg_expf(float x) {
    if (x < -12.0f) return 0.0f;
    if (x > 12.0f) return 162754.79f;
    /* Range reduction: exp(x) = 2^k * exp(r), where r = x - k*ln(2) */
    float ln2 = 0.6931471805599453f;
    int k = (int)(x / ln2 + (x >= 0 ? 0.5f : -0.5f));
    float r = x - (float)k * ln2;
    /* Padé(4,0) for exp(r) near 0 */
    float r2 = r * r;
    float e = 1.0f + r + r2 * 0.5f + r2 * r * (1.0f / 6.0f) + r2 * r2 * (1.0f / 24.0f);
    /* 2^k via bit manipulation (IEEE 754) */
    union { float f; uint32_t u; } bits;
    bits.f = 1.0f;
    bits.u += (uint32_t)k << 23;
    return e * bits.f;
}

/* ================================================================
 *  Buffer management
 *
 *  Three static buffers in BSS (zero-cost in .wasm file size).
 *  Max element dimensions: 1024 x 1024 px.
 *  Total resident memory: 3 * 1024 * 1024 * 4 = 12 MB.
 * ================================================================ */

#define LG_MAX_W 1024
#define LG_MAX_H 1024
#define LG_MAX_PX (LG_MAX_W * LG_MAX_H)

static uint8_t g_input [LG_MAX_PX * 4];
static uint8_t g_output[LG_MAX_PX * 4];
static uint8_t g_temp  [LG_MAX_PX * 4];

static int g_w, g_h;

/* Exported: initialise dimensions, returns 0 on success */
__attribute__((export_name("lg_init")))
int lg_init(int w, int h) {
    if (w < 1 || h < 1 || w > LG_MAX_W || h > LG_MAX_H) return -1;
    g_w = w;
    g_h = h;
    return 0;
}

/* Exported: pointer to the input pixel buffer (write RGBA here from JS) */
__attribute__((export_name("lg_input_ptr")))
uint8_t *lg_input_ptr(void) { return g_input; }

/* Exported: pointer to the output pixel buffer (read RGBA from JS) */
__attribute__((export_name("lg_output_ptr")))
uint8_t *lg_output_ptr(void) { return g_output; }

/* ================================================================
 *  Gaussian blur — separable two-pass
 * ================================================================ */

#define MAX_KERNEL_RADIUS 32
#define MAX_KERNEL_SIZE (2 * MAX_KERNEL_RADIUS + 1)

static float g_kernel[MAX_KERNEL_SIZE];
static int   g_kr;  /* kernel half-radius */

static void build_kernel(float radius) {
    int r = (int)(radius + 0.5f);
    if (r < 1) r = 1;
    if (r > MAX_KERNEL_RADIUS) r = MAX_KERNEL_RADIUS;
    g_kr = r;
    float sigma = radius * 0.33333f;
    if (sigma < 0.6f) sigma = 0.6f;
    float inv2s2 = -0.5f / (sigma * sigma);
    float sum = 0.0f;
    int size = 2 * r + 1;
    for (int i = 0; i < size; i++) {
        float d = (float)(i - r);
        g_kernel[i] = lg_expf(d * d * inv2s2);
        sum += g_kernel[i];
    }
    float inv = 1.0f / sum;
    for (int i = 0; i < size; i++) g_kernel[i] *= inv;
}

static void blur_horizontal(const uint8_t *src, uint8_t *dst, int w, int h) {
    int r = g_kr;
    int ks = 2 * r + 1;
    for (int y = 0; y < h; y++) {
        int row = y * w;
        for (int x = 0; x < w; x++) {
            float sr = 0, sg = 0, sb = 0, sa = 0;
            for (int k = 0; k < ks; k++) {
                int sx = x + k - r;
                if (sx < 0) sx = 0; else if (sx >= w) sx = w - 1;
                int idx = (row + sx) << 2;
                float wt = g_kernel[k];
                sr += src[idx    ] * wt;
                sg += src[idx + 1] * wt;
                sb += src[idx + 2] * wt;
                sa += src[idx + 3] * wt;
            }
            int oidx = (row + x) << 2;
            dst[oidx    ] = (uint8_t)(sr + 0.5f);
            dst[oidx + 1] = (uint8_t)(sg + 0.5f);
            dst[oidx + 2] = (uint8_t)(sb + 0.5f);
            dst[oidx + 3] = (uint8_t)(sa + 0.5f);
        }
    }
}

static void blur_vertical(const uint8_t *src, uint8_t *dst, int w, int h) {
    int r = g_kr;
    int ks = 2 * r + 1;
    for (int x = 0; x < w; x++) {
        for (int y = 0; y < h; y++) {
            float sr = 0, sg = 0, sb = 0, sa = 0;
            for (int k = 0; k < ks; k++) {
                int sy = y + k - r;
                if (sy < 0) sy = 0; else if (sy >= h) sy = h - 1;
                int idx = (sy * w + x) << 2;
                float wt = g_kernel[k];
                sr += src[idx    ] * wt;
                sg += src[idx + 1] * wt;
                sb += src[idx + 2] * wt;
                sa += src[idx + 3] * wt;
            }
            int oidx = (y * w + x) << 2;
            dst[oidx    ] = (uint8_t)(sr + 0.5f);
            dst[oidx + 1] = (uint8_t)(sg + 0.5f);
            dst[oidx + 2] = (uint8_t)(sb + 0.5f);
            dst[oidx + 3] = (uint8_t)(sa + 0.5f);
        }
    }
}

/* ================================================================
 *  Geometry helpers
 * ================================================================ */

/*
 * Signed distance field for a rounded rectangle centered at origin.
 *   hw, hh = half-width, half-height of the rectangle
 *   r      = corner radius
 * Returns negative inside, zero on border, positive outside.
 */
static float sdf_rrect(float px, float py, float hw, float hh, float r) {
    float dx = lg_fmaxf(lg_fabsf(px) - hw + r, 0.0f);
    float dy = lg_fmaxf(lg_fabsf(py) - hh + r, 0.0f);
    return lg_sqrtf(dx * dx + dy * dy) - r;
}

/* Bilinear sample from a uint8 RGBA buffer, coords clamped to [0, w-1] x [0, h-1] */
static void sample_bilinear(const uint8_t *buf, int w, int h,
                             float fx, float fy, float out[4]) {
    fx = lg_clamp(fx, 0.0f, (float)(w - 1) - 0.001f);
    fy = lg_clamp(fy, 0.0f, (float)(h - 1) - 0.001f);
    int x0 = (int)fx, y0 = (int)fy;
    int x1 = x0 + 1 < w ? x0 + 1 : x0;
    int y1 = y0 + 1 < h ? y0 + 1 : y0;
    float dx = fx - (float)x0;
    float dy = fy - (float)y0;
    float w00 = (1.0f - dx) * (1.0f - dy);
    float w10 = dx * (1.0f - dy);
    float w01 = (1.0f - dx) * dy;
    float w11 = dx * dy;
    for (int c = 0; c < 4; c++) {
        out[c] = buf[(y0 * w + x0) * 4 + c] * w00
               + buf[(y0 * w + x1) * 4 + c] * w10
               + buf[(y1 * w + x0) * 4 + c] * w01
               + buf[(y1 * w + x1) * 4 + c] * w11;
    }
}

/* ================================================================
 *  Main processing pipeline
 *
 *  Call from JS after writing background RGBA pixels into the
 *  buffer at lg_input_ptr().
 *
 *  Parameters:
 *    blur_radius       Gaussian blur radius in px (0–32).
 *    refract_strength  Dome height as fraction of element size (0.0–0.15, typical 0.04).
 *    ior               Index of refraction (1.0 = no refraction, 1.5 = glass).
 *    border_radius     CSS border-radius of the element in px.
 *    specular          Specular highlight intensity (0.0–1.0, typical 0.25).
 *    saturate          Saturation multiplier (1.0 = no change, 1.4 = Apple-like boost).
 *    tint_r/g/b/a      Tint overlay colour in 0.0–1.0 range.
 * ================================================================ */
__attribute__((export_name("lg_process")))
void lg_process(
    float blur_radius,
    float refract_strength,
    float ior,
    float border_radius,
    float specular,
    float saturate,
    float tint_r, float tint_g, float tint_b, float tint_a
) {
    int w = g_w, h = g_h;
    if (w < 1 || h < 1) return;

    /* ---- Pass 1: Gaussian blur (input → temp → output) ---- */
    build_kernel(blur_radius);
    blur_horizontal(g_input, g_temp,   w, h);
    blur_vertical  (g_temp,  g_output, w, h);

    /* Copy blurred result to temp for sampling during refraction */
    for (int i = 0, n = w * h * 4; i < n; i++) g_temp[i] = g_output[i];

    /* ---- Precompute geometry ---- */
    float hw = (float)w * 0.5f;
    float hh = (float)h * 0.5f;
    float br = border_radius;
    if (br > hw) br = hw;
    if (br > hh) br = hh;

    float diag = lg_sqrtf(hw * hw + hh * hh);
    float min_dim = (float)(w < h ? w : h);

    /*
     * Dome model: a paraboloid z = dome_h * (1 - (r/diag)^2)
     * Surface normal = normalize(-dz/dx, -dz/dy, 1)
     * Refraction offset via Snell's law thin-plate approx:
     *   offset = thickness * (n_xy / n_z) * (1 - 1/ior)
     */
    float dome_h = refract_strength * diag;
    float inv_diag2 = 1.0f / (diag * diag);
    float thickness = refract_strength * min_dim * 0.5f;
    float snell = 1.0f - 1.0f / ior;

    /* Light direction for specular (upper-left, angled) */
    float lx = -0.45f, ly = -0.65f, lz = 0.60f;
    float ll = lg_sqrtf(lx * lx + ly * ly + lz * lz);
    lx /= ll; ly /= ll; lz /= ll;

    /* ---- Pass 2: refraction + specular + saturation + tint ---- */
    for (int y = 0; y < h; y++) {
        float py = (float)y - hh;
        for (int x = 0; x < w; x++) {
            float px = (float)x - hw;

            /* Signed distance to the rounded rect boundary */
            float d = sdf_rrect(px, py, hw, hh, br);

            /* Only process pixels inside the glass surface */
            if (d > 1.0f) {
                int idx = (y * w + x) << 2;
                g_output[idx] = g_output[idx + 1] = g_output[idx + 2] = 0;
                g_output[idx + 3] = 0;
                continue;
            }

            /* Soft edge falloff (anti-alias the border) */
            float alpha_edge = lg_clamp(1.0f - d, 0.0f, 1.0f);

            /* Dome surface normals from the paraboloid gradient */
            float dzdx = -2.0f * dome_h * px * inv_diag2;
            float dzdy = -2.0f * dome_h * py * inv_diag2;
            float nx = -dzdx, ny = -dzdy, nz = 1.0f;
            float nlen = lg_sqrtf(nx * nx + ny * ny + nz * nz);
            nx /= nlen; ny /= nlen; nz /= nlen;

            /* Refraction displacement */
            float off_x = thickness * (nx / nz) * snell;
            float off_y = thickness * (ny / nz) * snell;

            /* Fade refraction smoothly to zero at the rounded-rect edge */
            float edge_fade = lg_clamp(-d / (br > 1.0f ? br * 0.5f : 4.0f), 0.0f, 1.0f);
            off_x *= edge_fade;
            off_y *= edge_fade;

            /* Sample blurred image at refracted coordinates */
            float sx = (float)x + off_x;
            float sy = (float)y + off_y;
            float pixel[4];
            sample_bilinear(g_temp, w, h, sx, sy, pixel);

            /* Specular highlight (Phong + Fresnel) */
            float ndotl = nx * lx + ny * ly + nz * lz;
            float spec_raw = lg_fmaxf(ndotl, 0.0f);
            /* pow ~8 for tighter highlight */
            spec_raw *= spec_raw; spec_raw *= spec_raw; spec_raw *= spec_raw;
            float fresnel = 1.0f - nz;
            fresnel = fresnel * fresnel * fresnel;
            float spec_val = spec_raw * (0.25f + 0.75f * fresnel) * specular * 255.0f;

            /* Saturation boost */
            float luma = pixel[0] * 0.2126f + pixel[1] * 0.7152f + pixel[2] * 0.0722f;
            float pr = luma + (pixel[0] - luma) * saturate;
            float pg = luma + (pixel[1] - luma) * saturate;
            float pb = luma + (pixel[2] - luma) * saturate;

            /* Tint overlay (standard alpha composite) */
            float tr = pr * (1.0f - tint_a) + tint_r * 255.0f * tint_a;
            float tg = pg * (1.0f - tint_a) + tint_g * 255.0f * tint_a;
            float tb = pb * (1.0f - tint_a) + tint_b * 255.0f * tint_a;

            /* Add specular on top */
            tr += spec_val;
            tg += spec_val;
            tb += spec_val;

            /* Write output with edge anti-aliasing */
            int oidx = (y * w + x) << 2;
            g_output[oidx    ] = (uint8_t)lg_clamp(tr, 0.0f, 255.0f);
            g_output[oidx + 1] = (uint8_t)lg_clamp(tg, 0.0f, 255.0f);
            g_output[oidx + 2] = (uint8_t)lg_clamp(tb, 0.0f, 255.0f);
            g_output[oidx + 3] = (uint8_t)(lg_clamp(pixel[3], 0.0f, 255.0f) * alpha_edge);
        }
    }
}
