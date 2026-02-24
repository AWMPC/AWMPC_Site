/**
 * LiquidGlass — Apple Liquid Glass effect via WebAssembly
 *
 * Architecture:
 *   1. Screenshot the full page via html2canvas (loaded from CDN lazily)
 *   2. For each glass element, clip its backdrop region from the screenshot
 *   3. Process the clipped region through WASM (blur + refraction + specular)
 *   4. Render result on an overlay canvas positioned behind the element content
 *   5. Fade the overlay in smoothly
 *   6. Re-clip + re-process on scroll (fixed elements only)
 *   7. Re-capture full screenshot on resize (debounced)
 *
 * Usage:
 *   const glass = new LiquidGlass('liquid_glass.wasm');
 *   await glass.init();
 *   glass.register('.section-card');
 *   await glass.capture();          // screenshot + process all
 *   // later:
 *   glass.destroy();
 */
class LiquidGlass {

  constructor(wasmUrl) {
    this._wasmUrl = wasmUrl;
    this._exports = null;
    this._memory = null;
    this._elements = new Map();
    this._pageCanvas = null;
    this._pageScale = 1;
    this._alive = false;
    this._resizeTimer = 0;
    this._scrollTimer = 0;
    this._onResize = this._handleResize.bind(this);
    this._onScroll = this._handleScroll.bind(this);
    this._opts = {
      blurRadius: 20,
      refractionStrength: 0.04,
      ior: 1.45,
      specular: 0.25,
      saturate: 1.35,
      tint: [1, 1, 1, 0.08],
      captureScale: 0.5,
    };
  }

  /* ================================================================
   *  Initialisation
   * ================================================================ */

  async init(opts) {
    if (opts) Object.assign(this._opts, opts);
    await Promise.all([this._loadWasm(), LiquidGlass._loadH2C()]);
    this._alive = true;
    window.addEventListener('resize', this._onResize, { passive: true });
    window.addEventListener('scroll', this._onScroll, { passive: true });
  }

  async _loadWasm() {
    const tryLoad = async (imports) => {
      if (typeof WebAssembly.instantiateStreaming === 'function') {
        try {
          return await WebAssembly.instantiateStreaming(fetch(this._wasmUrl), imports);
        } catch (_) { /* fall through */ }
      }
      const buf = await fetch(this._wasmUrl).then(r => r.arrayBuffer());
      return await WebAssembly.instantiate(buf, imports);
    };
    let result;
    try { result = await tryLoad({}); }
    catch (_) {
      result = await tryLoad({ env: { memory: new WebAssembly.Memory({ initial: 256 }) } });
    }
    this._exports = result.instance.exports;
    this._memory = this._exports.memory;
  }

  static _h2cPromise = null;
  static _loadH2C() {
    if (typeof html2canvas !== 'undefined') return Promise.resolve();
    if (LiquidGlass._h2cPromise) return LiquidGlass._h2cPromise;
    LiquidGlass._h2cPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load html2canvas'));
      document.head.appendChild(s);
    });
    return LiquidGlass._h2cPromise;
  }

  /* ================================================================
   *  Element registration
   * ================================================================ */

  register(selectorOrEl, perElementOpts) {
    const els = typeof selectorOrEl === 'string'
      ? document.querySelectorAll(selectorOrEl)
      : [selectorOrEl];

    for (const el of els) {
      if (this._elements.has(el)) continue;

      const canvas = document.createElement('canvas');
      canvas.className = 'lg-overlay';
      canvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;' +
        'pointer-events:none;border-radius:inherit;opacity:0;' +
        'transition:opacity 0.4s ease;';

      const pos = getComputedStyle(el).position;
      if (pos === 'static') el.style.position = 'relative';
      el.insertBefore(canvas, el.firstChild);

      const state = {
        el,
        canvas,
        ctx: canvas.getContext('2d'),
        opts: Object.assign({}, this._opts, perElementOpts),
        isFixed: this._isFixed(el),
      };
      this._elements.set(el, state);
    }
  }

  unregister(el) {
    const s = this._elements.get(el);
    if (!s) return;
    if (s.canvas.parentNode) s.canvas.parentNode.removeChild(s.canvas);
    this._elements.delete(el);
  }

  /* ================================================================
   *  Page capture + processing
   * ================================================================ */

  async capture() {
    if (!this._alive) return;

    const overlays = [];
    for (const [, s] of this._elements) {
      overlays.push({ el: s.canvas, prev: s.canvas.style.display });
      s.canvas.style.display = 'none';
    }

    try {
      const scale = this._opts.captureScale;
      this._pageCanvas = await html2canvas(document.body, {
        scale: scale,
        useCORS: true,
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });
      this._pageScale = scale;
    } finally {
      for (const o of overlays) o.el.style.display = o.prev;
    }

    this._processAll();
  }

  _processAll() {
    for (const [, state] of this._elements) {
      this._processElement(state);
    }
  }

  _processElement(state) {
    if (!this._pageCanvas || !this._exports) return;
    const { el, canvas, ctx, opts } = state;

    const pageW = this._pageCanvas.width;
    const pageH = this._pageCanvas.height;
    const scale = this._pageScale;

    const rect = el.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let srcX = Math.round((rect.left + scrollX) * scale);
    let srcY = Math.round((rect.top + scrollY) * scale);
    let srcW = Math.round(rect.width * scale);
    let srcH = Math.round(rect.height * scale);

    if (srcW < 1 || srcH < 1) return;
    srcX = Math.max(0, Math.min(srcX, pageW - 1));
    srcY = Math.max(0, Math.min(srcY, pageH - 1));
    srcW = Math.min(srcW, pageW - srcX);
    srcH = Math.min(srcH, pageH - srcY);
    if (srcW < 1 || srcH < 1) return;

    let procW = srcW, procH = srcH;
    let procScale = 1;
    const maxDim = 1024;
    if (procW > maxDim || procH > maxDim) {
      procScale = maxDim / Math.max(procW, procH);
      procW = Math.round(procW * procScale);
      procH = Math.round(procH * procScale);
    }

    const clip = document.createElement('canvas');
    clip.width = procW;
    clip.height = procH;
    const clipCtx = clip.getContext('2d', { willReadFrequently: true });
    clipCtx.drawImage(this._pageCanvas, srcX, srcY, srcW, srcH, 0, 0, procW, procH);

    const imgData = clipCtx.getImageData(0, 0, procW, procH);

    const rc = this._exports.lg_init(procW, procH);
    if (rc !== 0) return;

    const inPtr = this._exports.lg_input_ptr();
    const outPtr = this._exports.lg_output_ptr();
    const heap = new Uint8Array(this._memory.buffer);
    heap.set(imgData.data, inPtr);

    const cs = getComputedStyle(el);
    let br = parseFloat(cs.borderRadius) || 0;
    br *= scale * procScale;

    const t = opts.tint;
    this._exports.lg_process(
      opts.blurRadius * scale * procScale,
      opts.refractionStrength,
      opts.ior,
      br,
      opts.specular,
      opts.saturate,
      t[0], t[1], t[2], t[3]
    );

    const outBytes = new Uint8Array(this._memory.buffer, outPtr, procW * procH * 4);
    const result = new ImageData(new Uint8ClampedArray(outBytes.slice()), procW, procH);

    canvas.width = procW;
    canvas.height = procH;
    ctx.putImageData(result, 0, 0);

    requestAnimationFrame(() => { canvas.style.opacity = '1'; });
  }

  /* ================================================================
   *  Public: refresh specific element(s) using the existing screenshot
   *  Useful for elements that appear dynamically (menus, popups).
   * ================================================================ */

  refresh(selectorOrEl) {
    if (!this._alive || !this._pageCanvas) return;
    const els = typeof selectorOrEl === 'string'
      ? document.querySelectorAll(selectorOrEl)
      : [selectorOrEl];
    for (const el of els) {
      const state = this._elements.get(el);
      if (state) this._processElement(state);
    }
  }

  /* ================================================================
   *  Scroll & resize handlers
   * ================================================================ */

  _handleScroll() {
    if (!this._alive || !this._pageCanvas) return;
    clearTimeout(this._scrollTimer);
    this._scrollTimer = setTimeout(() => {
      for (const [, state] of this._elements) {
        if (state.isFixed) this._processElement(state);
      }
    }, 80);
  }

  _handleResize() {
    if (!this._alive) return;
    clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => { this.capture(); }, 300);
  }

  _isFixed(el) {
    let node = el;
    while (node && node !== document.body) {
      const p = getComputedStyle(node).position;
      if (p === 'fixed' || p === 'sticky') return true;
      node = node.parentElement;
    }
    return false;
  }

  /* ================================================================
   *  Cleanup
   * ================================================================ */

  destroy() {
    this._alive = false;
    clearTimeout(this._resizeTimer);
    clearTimeout(this._scrollTimer);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('scroll', this._onScroll);
    for (const [el] of this._elements) this.unregister(el);
    this._pageCanvas = null;
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = LiquidGlass;
if (typeof window !== 'undefined') window.LiquidGlass = LiquidGlass;
