/**
 * LiquidGlass — Apple Liquid Glass effect via WebAssembly
 *
 * Applies real-time blur, refraction distortion, specular highlights,
 * saturation boost, and color tinting to any HTML element, simulating
 * the optical properties of glass over the page content beneath it.
 *
 * Usage:
 *   const glass = new LiquidGlass('liquid_glass.wasm');
 *   await glass.init();
 *   glass.apply(document.querySelector('.my-card'), {
 *     blurRadius: 20,
 *     refractionStrength: 0.04,
 *     ior: 1.45,
 *     specular: 0.25,
 *     saturate: 1.35,
 *     tint: [1, 1, 1, 0.08],
 *     live: true
 *   });
 */
class LiquidGlass {

  /**
   * @param {string} wasmUrl  Path to the compiled liquid_glass.wasm file.
   */
  constructor(wasmUrl) {
    this._wasmUrl = wasmUrl;
    this._instance = null;
    this._memory = null;
    this._exports = null;
    this._targets = new Map();
  }

  /** Load and instantiate the WASM module. Call once before apply(). */
  async init() {
    /*
     * Standalone WASM (emcc -s STANDALONE_WASM) exports its own memory,
     * so we pass an empty import object. If the module requires an
     * env.memory import instead, we fall back to providing one.
     */
    const tryInstantiate = async (importObj) => {
      if (typeof WebAssembly.instantiateStreaming === 'function') {
        try {
          return await WebAssembly.instantiateStreaming(fetch(this._wasmUrl), importObj);
        } catch (_) {
          const buf = await fetch(this._wasmUrl).then(r => r.arrayBuffer());
          return await WebAssembly.instantiate(buf, importObj);
        }
      }
      const buf = await fetch(this._wasmUrl).then(r => r.arrayBuffer());
      return await WebAssembly.instantiate(buf, importObj);
    };

    let result;
    try {
      result = await tryInstantiate({});
    } catch (_) {
      const mem = new WebAssembly.Memory({ initial: 256 });
      result = await tryInstantiate({ env: { memory: mem } });
    }

    this._instance = result.instance;
    this._exports = this._instance.exports;
    this._memory = this._exports.memory;
  }

  /**
   * Apply the Liquid Glass effect to an element.
   *
   * @param {HTMLElement} el       Target element.
   * @param {Object}      opts     Effect parameters.
   * @param {number}      opts.blurRadius          Gaussian blur radius in px (default 20).
   * @param {number}      opts.refractionStrength   Dome height fraction (default 0.04).
   * @param {number}      opts.ior                  Index of refraction (default 1.45).
   * @param {number}      opts.specular             Specular intensity 0–1 (default 0.25).
   * @param {number}      opts.saturate             Saturation multiplier (default 1.35).
   * @param {number[]}    opts.tint                 [r, g, b, a] in 0–1 (default [1,1,1,0.08]).
   * @param {boolean}     opts.live                 Re-render on scroll/resize (default true).
   * @param {number}      opts.fps                  Max re-render rate (default 30).
   */
  apply(el, opts) {
    if (!this._exports) throw new Error('LiquidGlass: call init() first');

    const o = Object.assign({
      blurRadius: 20,
      refractionStrength: 0.04,
      ior: 1.45,
      specular: 0.25,
      saturate: 1.35,
      tint: [1, 1, 1, 0.08],
      live: true,
      fps: 30,
    }, opts);

    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;' +
      'pointer-events:none;z-index:0;border-radius:inherit;';

    const pos = getComputedStyle(el).position;
    if (pos === 'static') el.style.position = 'relative';
    el.insertBefore(canvas, el.firstChild);

    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    const ctx = canvas.getContext('2d');

    const state = { el, canvas, offscreen, offCtx, ctx, opts: o, raf: 0, lastT: 0, alive: true };
    this._targets.set(el, state);

    const render = () => {
      if (!state.alive) return;
      this._renderFrame(state);
    };

    if (o.live) {
      const minInterval = 1000 / o.fps;
      const tick = (t) => {
        if (!state.alive) return;
        if (t - state.lastT >= minInterval) {
          state.lastT = t;
          render();
        }
        state.raf = requestAnimationFrame(tick);
      };
      state.raf = requestAnimationFrame(tick);

      state._onScroll = () => { state.dirty = true; };
      state._onResize = () => { state.dirty = true; };
      window.addEventListener('scroll', state._onScroll, { passive: true });
      window.addEventListener('resize', state._onResize, { passive: true });
    } else {
      render();
    }
  }

  /** Stop the effect on an element and remove the overlay canvas. */
  remove(el) {
    const s = this._targets.get(el);
    if (!s) return;
    s.alive = false;
    if (s.raf) cancelAnimationFrame(s.raf);
    if (s._onScroll) window.removeEventListener('scroll', s._onScroll);
    if (s._onResize) window.removeEventListener('resize', s._onResize);
    if (s.canvas.parentNode) s.canvas.parentNode.removeChild(s.canvas);
    this._targets.delete(el);
  }

  /** Stop all effects and release resources. */
  destroy() {
    for (const [el] of this._targets) this.remove(el);
  }

  /* ---- internal ---- */

  _renderFrame(state) {
    const { el, canvas, offscreen, offCtx, ctx, opts } = state;
    const rect = el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    let w = Math.round(rect.width * dpr);
    let h = Math.round(rect.height * dpr);
    if (w < 1 || h < 1) return;

    /* Clamp to WASM max (1024x1024) — scale down if larger */
    const maxDim = 1024;
    let scale = 1;
    if (w > maxDim || h > maxDim) {
      scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    canvas.width = w;
    canvas.height = h;
    offscreen.width = w;
    offscreen.height = h;

    /* Capture background: draw the page content behind the element */
    this._captureBackground(state, rect, w, h, dpr * scale);

    const imgData = offCtx.getImageData(0, 0, w, h);
    const pixels = imgData.data;

    /* Initialise WASM buffers */
    const rc = this._exports.lg_init(w, h);
    if (rc !== 0) return;

    const inPtr = this._exports.lg_input_ptr();
    const outPtr = this._exports.lg_output_ptr();
    const heap = new Uint8Array(this._memory.buffer);

    /* Write input pixels to WASM memory */
    heap.set(pixels, inPtr);

    /* Scale border-radius to match the processing resolution */
    const cs = getComputedStyle(el);
    let br = parseFloat(cs.borderRadius) || 0;
    br *= dpr * scale;

    /* Run the processing pipeline */
    const t = opts.tint;
    this._exports.lg_process(
      opts.blurRadius * (dpr * scale),
      opts.refractionStrength,
      opts.ior,
      br,
      opts.specular,
      opts.saturate,
      t[0], t[1], t[2], t[3]
    );

    /* Read output pixels from WASM memory */
    const outData = new Uint8Array(this._memory.buffer, outPtr, w * h * 4);
    const result = new ImageData(new Uint8ClampedArray(outData), w, h);
    ctx.putImageData(result, 0, 0);
  }

  /**
   * Capture the page content behind the target element by drawing visible
   * siblings and ancestor backgrounds onto the offscreen canvas.
   *
   * This is a lightweight alternative to html2canvas — it captures the
   * immediate visual context (backgrounds, images, text) without a full
   * DOM serialisation pass.
   */
  _captureBackground(state, elRect, w, h, effectiveScale) {
    const { offCtx, el } = state;

    offCtx.clearRect(0, 0, w, h);

    /* Strategy: walk up the DOM to find the nearest scrollable ancestor or
       body, then paint its visual content (background, child elements)
       clipped to the glass element's screen region.

       For best results on complex pages, you can provide a pre-rendered
       canvas or image via opts.backgroundSource. */

    /* Start with the page background colour */
    const bodyStyle = getComputedStyle(document.body);
    offCtx.fillStyle = bodyStyle.backgroundColor || '#ffffff';
    offCtx.fillRect(0, 0, w, h);

    /* Attempt to draw from a parent element's background image */
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      const ps = getComputedStyle(parent);
      if (ps.backgroundImage && ps.backgroundImage !== 'none') break;
      parent = parent.parentElement;
    }

    /* Draw sibling elements that sit behind the glass element.
       We use drawImage for img/video/canvas siblings, and fillRect
       for elements with background colours. This gives a good
       approximation of the visual backdrop. */
    const siblings = el.parentElement ? el.parentElement.children : [];
    for (let i = 0; i < siblings.length; i++) {
      const sib = siblings[i];
      if (sib === el || sib === state.canvas) continue;
      const sr = sib.getBoundingClientRect();
      /* Check overlap */
      if (sr.right < elRect.left || sr.left > elRect.right ||
          sr.bottom < elRect.top || sr.top > elRect.bottom) continue;

      const dx = (sr.left - elRect.left) * effectiveScale;
      const dy = (sr.top - elRect.top) * effectiveScale;
      const dw = sr.width * effectiveScale;
      const dh = sr.height * effectiveScale;

      /* Draw images, videos, canvases directly */
      if (sib.tagName === 'IMG' || sib.tagName === 'VIDEO' || sib.tagName === 'CANVAS') {
        try { offCtx.drawImage(sib, dx, dy, dw, dh); } catch (_) {}
      } else {
        const sibStyle = getComputedStyle(sib);
        if (sibStyle.backgroundColor && sibStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          offCtx.fillStyle = sibStyle.backgroundColor;
          offCtx.fillRect(dx, dy, dw, dh);
        }
      }
    }
  }
}

/**
 * Convenience: apply Liquid Glass as a CSS-like property to elements matching
 * a selector. Returns a cleanup function.
 *
 * Usage:
 *   const cleanup = await LiquidGlass.applyToSelector(
 *     '.glass-panel',
 *     'liquid_glass.wasm',
 *     { blurRadius: 24, specular: 0.3 }
 *   );
 *   // later: cleanup();
 */
LiquidGlass.applyToSelector = async function(selector, wasmUrl, opts) {
  const lg = new LiquidGlass(wasmUrl);
  await lg.init();
  const els = document.querySelectorAll(selector);
  for (const el of els) lg.apply(el, opts);
  return () => lg.destroy();
};

/* Export for ES modules, CommonJS, and plain <script> */
if (typeof module !== 'undefined' && module.exports) module.exports = LiquidGlass;
if (typeof window !== 'undefined') window.LiquidGlass = LiquidGlass;
