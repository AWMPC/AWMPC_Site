<!DOCTYPE html>
<html lang="en">

<head>
  <title>All World Mission Prayer Center - 信望愛禱告中心</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="keywords" content="awmpc,wmpc,awmpc.org,All World Mission Prayer Center,World Mission Prayer Center,prayer,mission" />
  <meta name="theme-color" content="#F5F7F8" id="metaThemeColor">
  <meta name="color-scheme" content="light dark">
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" media="print" onload="this.media='all'">
  <style>
    /* --- Design system tokens (default = Samsung One UI) --- */
    :root {
      /* Typography */
      --ds-font: Arial, "Helvetica Neue", Helvetica, sans-serif;
      /* Shape */
      --ds-radius-sm: 16px;
      --ds-radius-md: 26px;
      --ds-radius-pill: 50px;
      --ds-radius-card: 16px;
      --ds-radius-btn: 50%;
      /* Elevation */
      --ds-shadow-sm: 0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08);
      --ds-shadow-md: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.10);
      --ds-shadow-lg: 0 2px 8px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.18);
      --ds-shadow-btn: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.10);
      /* Material */
      --ds-blur: blur(24px) saturate(1.8);
      --ds-bar-bg: rgba(255,255,255,0.45);
      --ds-bar-border: 1px solid rgba(255,255,255,0.55);
      --ds-bar-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.10);
      /* Motion */
      --ds-transition: 0.35s cubic-bezier(0.22,0.61,0.36,1);
      --ds-motion: 0.3s cubic-bezier(0.22,0.61,0.36,1);
      /* Spacing */
      --ds-gap: 10px;
      --ds-padding-sm: 12px;
      --ds-padding-md: 20px;
      /* Colors — surfaces */
      --ds-bg: #F5F7F8;
      --ds-text: #212121;
      --ds-text-secondary: #666666;
      --ds-card-bg: #FFFFFF;
      --ds-label-color: #5C6B7A;
      --ds-border: 2px solid rgba(0,0,0,0.22);
      --ds-divider: #999999;
      --ds-link-bg: #E8ECF0;
      /* Colors — accent & info bar */
      --ds-accent: #CC0000;
      --ds-info-bg: #CC0000;
      --ds-info-text: #FFFFFF;
      /* Colors — buttons */
      --ds-btn-bg: #212121;
      --ds-btn-hover: #333333;
      --ds-btn-active: #444444;
      /* Colors — FAB */
      --ds-fab-bg: #FFFFFF;
      --ds-fab-cross: #CC0000;
      --ds-fab-open-ring: 0 0 0 2.5px rgba(204,0,0,0.3);
      /* Colors — menu */
      --ds-menu-text: #1a1a1a;
      --ds-menu-hover: #f2f2f2;
      --ds-menu-active-bg: rgba(204,0,0,0.08);
      --ds-menu-active-text: #CC0000;
      /* Colors — footer */
      --ds-footer-text: #212121;
      --ds-footer-link: #212121;
      /* Colors — loader */
      --ds-loader: #CC0000;
      /* Colors — scrim */
      --ds-scrim: rgba(0,0,0,0.42);
    }

    /* --- Reset & Base --- */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html {
      overflow-x: hidden;
    }
    body {
      background-color: var(--ds-bg);
      color: var(--ds-text);
      font-family: var(--ds-font);
      font-size: 16px;
      line-height: 1.5;
      overflow-x: hidden;
      overflow-wrap: break-word;
      word-break: break-word;
      transition: background-color 0.5s ease, color 0.5s ease;
    }
    img {                          /* global safety net for all images */
      max-width: 100%;
      height: auto;
    }
    table {                        /* force tables to respect viewport */
      max-width: 100%;
      width: 100%;
      table-layout: fixed;
    }
    td, th {
      overflow-wrap: break-word;
      word-break: break-word;
    }

    /* --- Site shell: centered, fluid with max --- */
    .site-wrap {
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      padding: 0 12px;
      padding-bottom: calc(66px + env(safe-area-inset-bottom, 0px));
    }

    /* --- Top banner (focus block) --- */
    .site-banner {
      display: block;
      text-align: center;
      padding: 12px 0;
      background-color: #BDA58B;
      border-radius: var(--ds-radius-md);
      margin: 12px 0;
      box-shadow: var(--ds-shadow-md);
      overflow: hidden;
    }
    .site-banner img {
      max-width: 88%;
      height: auto;
    }

    /* --- Bottom bar: floating pill with glazed glass --- */
    .site-bottom-bar {
      position: fixed;
      bottom: calc(8px + env(safe-area-inset-bottom, 0px));
      left: 12px;
      right: 12px;
      max-width: 1100px;
      margin: 0 auto;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px;
      border-radius: var(--ds-radius-pill);
      background: var(--ds-bar-bg);
      backdrop-filter: var(--ds-blur);
      -webkit-backdrop-filter: var(--ds-blur);
      border: var(--ds-bar-border);
      box-shadow: var(--ds-bar-shadow);
      transition: background-color 0.5s ease, box-shadow 0.5s ease, border-color 0.5s ease, border-radius 0.4s ease;
    }

    /* --- Info bar (service times) --- */
    .site-info-bar {
      display: flex;
      align-items: stretch;
      flex: 1;
      min-width: 0;
    }
    .info-bar-text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      background: var(--ds-info-bg);
      color: var(--ds-info-text);
      text-align: center;
      padding: 8px 16px;
      font-size: 13px;
      border-radius: var(--ds-radius-md);
      box-shadow: var(--ds-shadow-md);
      transition: background-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease, border-radius 0.4s ease;
    }
    .info-bar-scroll {
      display: inline-block;
      white-space: nowrap;
    }

    /* --- Bottom bar icon buttons --- */
    .site-top-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 42px;
      height: 42px;
      border-radius: var(--ds-radius-btn);
      border: none;
      background: var(--ds-btn-bg);
      color: #fff;
      cursor: pointer;
      text-decoration: none;
      box-shadow: var(--ds-shadow-btn);
      transition: background-color 0.15s, box-shadow 0.5s ease, border-radius 0.4s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .site-top-btn:hover { background: var(--ds-btn-hover); }
    .site-top-btn:active { background: var(--ds-btn-active); }
    .site-top-btn img {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      box-shadow: none;
      margin: 0;
    }
    .site-top-btn svg {
      display: block;
    }
    /* Theme toggle — 3D card-flip between sun and moon */
    #themeToggle { perspective: 300px; }
    .theme-icon-flip {
      width: 22px;
      height: 22px;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
    }
    body.dark-mode .theme-icon-flip {
      transform: rotateY(180deg);
    }
    .icon-sun, .icon-moon {
      position: absolute;
      top: 0;
      left: 0;
      backface-visibility: hidden;
    }
    .icon-moon {
      transform: rotateY(180deg);
    }

    /* --- Main banner GIF (card) --- */
    .site-main-banner {
      display: block;
      text-align: center;
      overflow: hidden;
      border-radius: var(--ds-radius-sm);
      margin: 16px 0;
      box-shadow: var(--ds-shadow-md);
    }
    .site-main-banner img {
      width: 100%;
      height: auto;
      display: block;
    }

    /* --- Media defaults inside content --- */
    .site-main img {
      border-radius: var(--ds-radius-sm);
      box-shadow: var(--ds-shadow-sm);
      margin-bottom: 16px;
    }
    .site-main video {
      border-radius: var(--ds-radius-sm);
      box-shadow: var(--ds-shadow-sm);
      margin-bottom: 16px;
    }

    /* --- Quick link image grid (One UI cards) --- */
    .quick-links {
      display: flex;
      gap: var(--ds-gap);
      padding: var(--ds-padding-sm) 0;
      height: 120px;
    }
    .quick-links a {
      display: block;
      flex: 1 1 0;
      min-width: 0;
      height: 100%;
      position: relative;
      border-radius: var(--ds-radius-sm);
      overflow: hidden;
      background: var(--ds-link-bg);
      border: var(--ds-border);
      box-shadow: var(--ds-shadow-sm);
      transition: box-shadow 0.3s, transform 0.2s, background-color 0.5s ease, border-color 0.5s ease, border-radius 0.4s ease;
    }
    .quick-links a:hover {
      box-shadow:
        0 2px 4px rgba(0,0,0,0.10),
        0 8px 20px rgba(0,0,0,0.14);
      transform: translateY(-2px);
    }
    .quick-links img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      border-radius: 0;
      box-shadow: none;
      margin-bottom: 0;
      background: inherit;
    }
    .quick-links a::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%);
      background-size: 250% 100%;
      animation: skeleton-shimmer 1.8s ease-in-out infinite;
      pointer-events: none;
      z-index: 1;
      opacity: 1;
      transition: opacity 0.3s ease;
    }
    .quick-links a.loaded::after {
      opacity: 0;
    }
    @keyframes skeleton-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -50% 0; }
    }
    .webex-card {
      display: flex;
      align-items: stretch;
      width: 100%;
      height: 100%;
      background:
        linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(0,0,0,0.22) 100%),
        #D0D8E4;
      transition: background 0.5s ease;
    }
    .webex-card-left {
      flex: 0 0 35%;
      position: relative;
      overflow: hidden;
    }
    .webex-card-logo {
      position: absolute !important;
      top: 50%;
      left: 6px;
      transform: translateY(-50%);
      width: auto !important;
      height: 92% !important;
      max-width: none !important;
      object-fit: contain !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      margin: 0 !important;
      z-index: 0;
      transition: left 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
    }
    .webex-card-link:hover .webex-card-logo,
    .webex-card-link:active .webex-card-logo {
      left: 0px;
    }
    .webex-card-divider {
      flex-shrink: 0;
      width: 2px;
      align-self: center;
      height: 92%;
      background: rgba(0,0,0,0.45);
      border-radius: 2px;
      position: relative;
      z-index: 1;
      mask-image: radial-gradient(ellipse 2px 50% at center, black 0%, transparent 100%);
      -webkit-mask-image: radial-gradient(ellipse 2px 50% at center, black 0%, transparent 100%);
    }
    .webex-card-right {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 10px 0 2px;
      min-width: 0;
      position: relative;
      z-index: 1;
    }
    .webex-card-line1 {
      font-size: 1.05em;
      font-weight: 600;
      color: #1A1A1A;
      line-height: 1.15;
      transition: color 0.5s ease;
      white-space: nowrap;
    }
    .webex-card-line2 {
      font-size: 1.35em;
      font-weight: 700;
      color: #1A1A1A;
      line-height: 1.15;
      transition: color 0.5s ease;
      white-space: nowrap;
    }
    body.dark-mode .webex-card {
      background:
        linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%, rgba(0,0,0,0.35) 100%),
        #1E3450;
    }
    body.dark-mode .webex-card-divider {
      background: rgba(255,255,255,0.50);
    }
    body.dark-mode .webex-card-line1 {
      color: #E0E8F0;
    }
    body.dark-mode .webex-card-line2 {
      color: #E0E8F0;
    }

    @media (max-width: 768px) {
      .quick-links {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr 1fr;
        gap: 8px;
        height: auto;
      }
      .quick-links a {
        aspect-ratio: 16 / 9;
      }
    }

    /* --- Section Cards --- */
    .section-card {
      background: var(--ds-card-bg);
      border-radius: var(--ds-radius-card);
      margin: 12px 0;
      box-shadow: var(--ds-shadow-sm);
      overflow: hidden;
      transition: background-color 0.5s ease, box-shadow 0.5s ease, border-radius 0.4s ease;
    }
    .section-card-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--ds-label-color);
      padding: 14px var(--ds-padding-md) 0;
      letter-spacing: 0.02em;
      transition: color 0.5s ease;
    }
    .section-card-body {
      padding: var(--ds-padding-sm) var(--ds-padding-md) 16px;
    }
    .section-card .quick-links {
      padding: var(--ds-padding-sm) 16px 16px;
    }

    /* --- Content area (single column) --- */
    .site-content {
      padding: 0;
    }

    /* Main content column */
    .site-main {
      min-width: 0;
      overflow-wrap: break-word;
      word-wrap: break-word;
      padding: 4px var(--ds-padding-md) 16px;
    }

    /* --- SPA loading bar (One UI style) --- */
    .spa-loader {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: var(--ds-loader);
      z-index: 99999;
      width: 0%;
      opacity: 0;
      transition: none;
    }
    .spa-loader.loading {
      opacity: 1;
      width: 70%;
      transition: width 1.2s cubic-bezier(0.22, 0.61, 0.36, 1);
    }
    .spa-loader.done {
      width: 100%;
      transition: width 0.15s ease-out;
    }
    .spa-loader.hide {
      opacity: 0;
      transition: opacity 0.3s ease-out;
    }

    /* SPA content fade transition */
    .site-main {
      transition: opacity 0.2s ease;
    }
    .site-main.fade-out {
      opacity: 0;
    }

    /* --- Footer --- */
    .site-footer-divider { border: 0; border-top: 1px solid var(--ds-divider); margin: 16px 0; transition: border-color 0.5s ease; }
    .site-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 0 24px;
      font-size: 13px;
      color: var(--ds-footer-text);
      transition: color 0.5s ease;
    }
    .site-footer a { color: var(--ds-footer-link); transition: color 0.5s ease; }
    .footer-left   { flex: 1; min-width: 160px; }
    .footer-center { flex: 2; min-width: 200px; text-align: center; font-size: 15px; }
    .footer-right  { flex: 1; min-width: 200px; text-align: right; }
    .footer-right a { display: block; margin-bottom: 2px; }

    /* --- FAB (Floating Action Button) --- */
    .fab-scrim {
      position: fixed;
      inset: 0;
      background: var(--ds-scrim);
      z-index: 9998;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s cubic-bezier(0.33, 0, 0.67, 1);
      -webkit-tap-highlight-color: transparent;
    }
    .fab-scrim.open {
      opacity: 1;
      pointer-events: auto;
    }

    .fab-btn {
      flex-shrink: 0;
      width: 42px;
      height: 42px;
      border-radius: var(--ds-radius-btn);
      border: none;
      background: var(--ds-fab-bg);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--ds-shadow-btn);
      transition:
        box-shadow var(--ds-transition),
        background-color 0.5s ease,
        border-radius 0.4s ease;
      -webkit-tap-highlight-color: transparent;
      outline: none;
    }
    .fab-btn:hover {
      box-shadow:
        0 2px 6px rgba(0,0,0,0.14),
        0 8px 20px rgba(0,0,0,0.16);
    }
    .fab-btn:active {
      background: var(--ds-menu-hover);
    }
    .fab-btn.open {
      box-shadow: var(--ds-shadow-btn), var(--ds-fab-open-ring);
    }
    .fab-btn.open:active {
      background: var(--ds-menu-hover);
    }

    /* Latin cross icon */
    .fab-icon {
      width: 20px;
      height: 24px;
      position: relative;
      transition: transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
    }
    .fab-btn.open .fab-icon {
      transform: scale(1.22);
    }
    .fab-icon::before,
    .fab-icon::after {
      content: '';
      position: absolute;
      background: var(--ds-fab-cross);
      transition: background-color 0.5s ease;
    }
    /* Vertical bar — full height */
    .fab-icon::before {
      width: 4px;
      height: 100%;
      left: 50%;
      top: 0;
      transform: translateX(-50%);
    }
    /* Horizontal bar — positioned slightly below upper third */
    .fab-icon::after {
      width: 16px;
      height: 4px;
      top: 36%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    /* Expanded menu sheet */
    .fab-menu {
      position: fixed;
      bottom: calc(58px + env(safe-area-inset-bottom, 0px));
      right: 12px;
      z-index: 9999;
      background: var(--ds-card-bg);
      border-radius: var(--ds-radius-md);
      box-shadow: var(--ds-shadow-lg);
      padding: 8px 0;
      min-width: 220px;
      max-height: calc(100dvh - 140px);
      overflow-y: auto;
      overscroll-behavior: contain;
      transform: translateY(16px) scale(0.92);
      opacity: 0;
      pointer-events: none;
      transform-origin: bottom right;
      transition:
        transform var(--ds-motion),
        opacity 0.25s cubic-bezier(0.33, 0, 0.67, 1),
        background-color 0.5s ease;
    }
    .fab-menu.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    /* Scrollbar styling inside sheet */
    .fab-menu::-webkit-scrollbar { width: 4px; }
    .fab-menu::-webkit-scrollbar-track { background: transparent; }
    .fab-menu::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

    /* Menu items */
    .fab-menu-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 24px;
      text-decoration: none;
      color: var(--ds-menu-text);
      font-size: 15px;
      font-weight: 500;
      line-height: 1.35;
      transition: background 0.15s, color 0.5s ease;
      -webkit-tap-highlight-color: transparent;
      /* Staggered entry */
      opacity: 0;
      transform: translateY(8px);
    }
    .fab-menu-item:hover {
      background: var(--ds-menu-hover);
    }
    .fab-menu-item:active {
      background: var(--ds-menu-hover);
    }
    .fab-menu.open .fab-menu-item {
      opacity: 1;
      transform: translateY(0);
      transition:
        background 0.15s,
        opacity 0.25s cubic-bezier(0.22, 0.61, 0.36, 1),
        transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
    }
    .fab-menu-item .fab-item-zh {
      font-size: 13px;
      color: var(--ds-text-secondary);
      font-weight: 400;
      margin-left: auto;
      padding-left: 12px;
      white-space: nowrap;
    }
    .fab-menu-item.fab-active {
      background: var(--ds-menu-active-bg);
      color: var(--ds-menu-active-text);
      font-weight: 600;
    }
    .fab-menu-item.fab-active .fab-item-zh {
      color: var(--ds-menu-active-text);
    }


    /* --- Responsive --- */
    @media (max-width: 768px) {
      .info-bar-text { font-size: 13px; }
      table { table-layout: auto; }
      td, th { width: auto !important; }
      .site-footer {
        flex-direction: column;
        text-align: center;
      }
      .footer-left, .footer-center, .footer-right { text-align: center; }
    }

    /* --- Bottom Sheet for small screens --- */
    @media (max-width: 600px) {
      .fab-menu {
        bottom: 0;
        right: 0;
        left: 0;
        border-radius: var(--ds-radius-md) var(--ds-radius-md) 0 0;
        min-width: unset;
        max-height: 70dvh;
        transform: translateY(100%);
        transform-origin: bottom center;
        padding: 8px 16px;
        padding-bottom: calc(66px + env(safe-area-inset-bottom, 0px));
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2px;
      }
      .fab-menu::before {
        content: '';
        display: block;
        width: 40px;
        height: 4px;
        background: #ccc;
        border-radius: 2px;
        margin: 4px auto 8px;
        grid-column: 1 / -1;
      }
      .fab-menu.open {
        transform: translateY(0);
      }
      .fab-menu-item {
        padding: 10px 14px;
        font-size: 14px;
        border-radius: 12px;
        gap: 8px;
      }
      .fab-menu-item .fab-item-zh {
        font-size: 11px;
        padding-left: 4px;
      }
    }

    /* ===== Design System Theme Overrides ===== */

    /* Samsung One UI — default (values in :root) */

    /* ---- Apple Liquid Glass ----
       Ref: Liquid Glass design doc — translucent refractive material, content-first,
       hardware-concentric rounding, SF Pro, 44pt min targets, 11pt min text,
       judicious color, scroll-edge legibility, fluid morphing motion */
    body.ds-liquid-glass {
      --ds-font: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
      /* Concentric rounding: controls match hardware curvature */
      --ds-radius-sm: 13px;
      --ds-radius-md: 16px;
      --ds-radius-pill: 50px;
      --ds-radius-card: 16px;
      --ds-radius-btn: 50%;
      --ds-gap: 8px;
      --ds-padding-sm: 11px;
      --ds-padding-md: 16px;
      /* Liquid Glass: shadows are depth cues beneath elevated elements */
      --ds-shadow-sm: 0 0.5px 1px rgba(0,0,0,0.03), 0 1px 6px rgba(0,0,0,0.05);
      --ds-shadow-md: 0 1px 3px rgba(0,0,0,0.05), 0 4px 14px rgba(0,0,0,0.07);
      --ds-shadow-lg: 0 2px 8px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.10);
      --ds-shadow-btn: 0 0.5px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06);
      /* Material: translucent glass with refraction & blur */
      --ds-blur: blur(40px) saturate(2.0);
      --ds-bar-bg: rgba(255,255,255,0.28);
      --ds-bar-border: 0.5px solid rgba(255,255,255,0.55);
      --ds-bar-shadow: 0 0.5px 4px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.05), inset 0 0 0 0.5px rgba(255,255,255,0.35);
      /* Motion: fluid morphing, spring-like feel */
      --ds-transition: 0.45s cubic-bezier(0.28,0.11,0.32,1);
      --ds-motion: 0.4s cubic-bezier(0.28,0.11,0.32,1);
      /* Colors: iOS systemGroupedBackground */
      --ds-bg: #F2F2F7;
      --ds-text: #000000;
      --ds-text-secondary: #3C3C43;
      --ds-card-bg: rgba(255,255,255,0.55);
      --ds-label-color: #8E8E93;
      --ds-link-bg: rgba(120,120,128,0.04);
      --ds-border: 0.5px solid rgba(60,60,67,0.12);
      --ds-divider: rgba(60,60,67,0.18);
      --ds-accent: #CC0000;
      --ds-info-bg: #CC0000;
      --ds-info-text: #FFFFFF;
      --ds-btn-bg: rgba(60,60,67,0.45);
      --ds-btn-hover: rgba(60,60,67,0.55);
      --ds-btn-active: rgba(60,60,67,0.65);
      --ds-fab-bg: rgba(255,255,255,0.60);
      --ds-fab-cross: #CC0000;
      --ds-fab-open-ring: 0 0 0 1.5px rgba(0,0,0,0.10);
      --ds-menu-text: #000000;
      --ds-menu-hover: rgba(120,120,128,0.06);
      --ds-menu-active-bg: rgba(0,122,255,0.10);
      --ds-menu-active-text: #007AFF;
      --ds-footer-text: #3C3C43;
      --ds-footer-link: #000000;
      --ds-loader: #007AFF;
      --ds-scrim: rgba(0,0,0,0.32);
    }
    body.ds-liquid-glass .section-card {
      backdrop-filter: blur(30px) saturate(1.8);
      -webkit-backdrop-filter: blur(30px) saturate(1.8);
      border: 0.5px solid rgba(255,255,255,0.55);
    }
    body.ds-liquid-glass .fab-menu {
      backdrop-filter: blur(40px) saturate(2);
      -webkit-backdrop-filter: blur(40px) saturate(2);
      background: rgba(255,255,255,0.52);
      border: 0.5px solid rgba(255,255,255,0.50);
    }
    body.ds-liquid-glass .fab-btn {
      backdrop-filter: blur(20px) saturate(1.6);
      -webkit-backdrop-filter: blur(20px) saturate(1.6);
    }
    body.ds-liquid-glass .ds-popup {
      backdrop-filter: blur(40px) saturate(2);
      -webkit-backdrop-filter: blur(40px) saturate(2);
      background: rgba(255,255,255,0.52);
      border: 0.5px solid rgba(255,255,255,0.50);
    }


    /* ---- Google Material Design 3 (Material You) ----
       Ref: M3 design doc — tonal elevation (surface tint not shadows), shape scale
       (None=0, XS=4, S=8, M=12, L=16, XL=28, Full=50%), Roboto, 48dp min touch,
       standard easing cubic-bezier(0.2,0,0,1), emphasized easing for prominent,
       M3 color roles: surface=#FEF7FF, onSurface=#1D1B20, outline=#79747E,
       outlineVariant=#CAC4D0, primary=#6750A4, surfaceContainerLow=#F7F2FA,
       surfaceContainer=#F3EDF7, surfaceContainerHigh=#ECE6F0 */
    body.ds-material {
      --ds-font: "Roboto", "Noto Sans", "Google Sans", Arial, sans-serif;
      /* M3 shape scale: S=8dp, M=12dp, L=16dp, XL=28dp, Full=50% */
      --ds-radius-sm: 8px;
      --ds-radius-md: 16px;
      --ds-radius-pill: 28px;
      --ds-radius-card: 12px;
      --ds-radius-btn: 50%;
      /* M3 grid: compact margins=16dp, gutters=8dp */
      --ds-gap: 8px;
      --ds-padding-sm: 16px;
      --ds-padding-md: 24px;
      /* M3 tonal elevation: minimal shadow, uses surfaceTint overlay instead */
      --ds-shadow-sm: 0 1px 2px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.10);
      --ds-shadow-md: 0 1px 2px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.10);
      --ds-shadow-lg: 0 4px 8px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.10);
      --ds-shadow-btn: 0 1px 2px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.10);
      --ds-blur: blur(16px) saturate(1.2);
      --ds-bar-bg: rgba(243,237,247,0.75);
      --ds-bar-border: none;
      --ds-bar-shadow: 0 1px 2px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06);
      /* M3 standard easing */
      --ds-transition: 0.3s cubic-bezier(0.2,0,0,1);
      --ds-motion: 0.3s cubic-bezier(0.2,0,0,1);
      /* M3 light scheme color roles */
      --ds-bg: #FEF7FF;
      --ds-text: #1D1B20;
      --ds-text-secondary: #49454F;
      --ds-card-bg: #F7F2FA;
      --ds-label-color: #49454F;
      --ds-link-bg: #ECE6F0;
      --ds-border: 1px solid #CAC4D0;
      --ds-divider: #CAC4D0;
      --ds-accent: #6750A4;
      --ds-info-bg: #6750A4;
      --ds-info-text: #FFFFFF;
      --ds-btn-bg: #1D1B20;
      --ds-btn-hover: #49454F;
      --ds-btn-active: #605D66;
      --ds-fab-bg: #ECE6F0;
      --ds-fab-cross: #6750A4;
      --ds-fab-open-ring: 0 0 0 2px rgba(103,80,164,0.30);
      --ds-menu-text: #1D1B20;
      --ds-menu-hover: rgba(29,27,32,0.08);
      --ds-menu-active-bg: rgba(103,80,164,0.12);
      --ds-menu-active-text: #6750A4;
      --ds-footer-text: #49454F;
      --ds-footer-link: #6750A4;
      --ds-loader: #6750A4;
      --ds-scrim: rgba(0,0,0,0.32);
    }
    body.ds-material .section-card {
      border: 1px solid #CAC4D0;
    }

    /* ---- Windows Fluent Design 2 ----
       Ref: Fluent 2 design doc — 4px base grid, Segoe UI Variable,
       6-level shadow ramp (key+ambient composition, 14% base light / 28% dark),
       standardized 4px corners, colorNeutralBackground1=#FFFFFF,
       colorNeutralForeground1=#242424, interaction=darker on hover/press,
       focus=thicker stroke not color change */
    body.ds-fluent {
      --ds-font: "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;
      /* Fluent standardized corners: 4px for components, 8px for containers */
      --ds-radius-sm: 4px;
      --ds-radius-md: 8px;
      --ds-radius-pill: 4px;
      --ds-radius-card: 4px;
      --ds-radius-btn: 4px;
      /* Fluent 4px base grid spacing */
      --ds-gap: 8px;
      --ds-padding-sm: 8px;
      --ds-padding-md: 16px;
      /* Fluent shadow ramp: key (sharp) + ambient (soft) composition */
      --ds-shadow-sm: 0 2px 4px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12);
      --ds-shadow-md: 0 4px 8px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12);
      --ds-shadow-lg: 0 8px 16px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12);
      --ds-shadow-btn: 0 2px 4px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12);
      /* Fluent Acrylic: uses strokes on Windows instead of key shadows */
      --ds-blur: blur(30px) saturate(1.25);
      --ds-bar-bg: rgba(255,255,255,0.70);
      --ds-bar-border: 1px solid rgba(0,0,0,0.0578);
      --ds-bar-shadow: 0 2px 4px rgba(0,0,0,0.04);
      /* Fluent ease-out for entering elements */
      --ds-transition: 0.2s cubic-bezier(0,0,0,1);
      --ds-motion: 0.25s cubic-bezier(0.1,0.9,0.2,1);
      /* Fluent neutral palette */
      --ds-bg: #F5F5F5;
      --ds-text: #242424;
      --ds-text-secondary: #616161;
      --ds-card-bg: #FFFFFF;
      --ds-label-color: #616161;
      --ds-link-bg: #F0F0F0;
      --ds-border: 1px solid rgba(0,0,0,0.0578);
      --ds-divider: rgba(0,0,0,0.0837);
      --ds-accent: #CC0000;
      --ds-info-bg: #CC0000;
      --ds-info-text: #FFFFFF;
      --ds-btn-bg: #242424;
      --ds-btn-hover: #424242;
      --ds-btn-active: #4F4F4F;
      --ds-fab-bg: #FFFFFF;
      --ds-fab-cross: #CC0000;
      --ds-fab-open-ring: 0 0 0 2px #000000;
      --ds-menu-text: #242424;
      --ds-menu-hover: rgba(0,0,0,0.04);
      --ds-menu-active-bg: rgba(0,0,0,0.06);
      --ds-menu-active-text: #242424;
      --ds-footer-text: #616161;
      --ds-footer-link: #242424;
      --ds-loader: #0F6CBD;
      --ds-scrim: rgba(0,0,0,0.40);
    }
    body.ds-fluent .section-card {
      border: 1px solid rgba(0,0,0,0.0578);
      border-bottom: 1px solid rgba(0,0,0,0.0837);
    }
    body.ds-fluent .fab-menu {
      border: 1px solid rgba(0,0,0,0.0578);
      border-bottom: 1px solid rgba(0,0,0,0.0837);
    }
    /* Fluent focus: thicker stroke, no color change */
    body.ds-fluent .fab-menu-item:focus-visible {
      outline: 2px solid #000000;
      outline-offset: -2px;
    }

    /* ---- IBM Carbon ----
       Ref: Carbon design doc — 2x Grid with 8px mini-unit, zero corner radius,
       IBM Plex Sans, spacing scale ($spacing-03=8px, $spacing-05=16px, $spacing-07=32px),
       productive motion: standard=cubic-bezier(0.2,0,0.38,0.9), duration-fast-01=70ms,
       duration-moderate-01=150ms, Gray 10 theme: bg=#f4f4f4, text=$text-primary=Gray100=#161616,
       $border-subtle=#e0e0e0, $layer-01=#ffffff, Blue 60=#0f62fe as primary action,
       $support-error=Red60=#da1e28, no blur/acrylic, condensed 1px borders */
    body.ds-carbon {
      --ds-font: "IBM Plex Sans", "Helvetica Neue", Arial, sans-serif;
      /* Carbon: no corner radius anywhere */
      --ds-radius-sm: 0px;
      --ds-radius-md: 0px;
      --ds-radius-pill: 0px;
      --ds-radius-card: 0px;
      --ds-radius-btn: 0px;
      /* Carbon 2x grid: 8px mini-unit, 16px column padding */
      --ds-gap: 16px;
      --ds-padding-sm: 16px;
      --ds-padding-md: 16px;
      /* Carbon: minimal elevation, borders over shadows */
      --ds-shadow-sm: 0 2px 6px rgba(0,0,0,0.12);
      --ds-shadow-md: 0 2px 6px rgba(0,0,0,0.16);
      --ds-shadow-lg: 0 8px 16px rgba(0,0,0,0.16);
      --ds-shadow-btn: none;
      /* Carbon: no acrylic or blur effects */
      --ds-blur: none;
      --ds-bar-bg: #FFFFFF;
      --ds-bar-border: 1px solid #E0E0E0;
      --ds-bar-shadow: 0 2px 6px rgba(0,0,0,0.12);
      /* Carbon productive motion: standard easing */
      --ds-transition: 0.15s cubic-bezier(0.2,0,0.38,0.9);
      --ds-motion: 0.15s cubic-bezier(0.2,0,0.38,0.9);
      /* Carbon Gray 10 theme */
      --ds-bg: #F4F4F4;
      --ds-text: #161616;
      --ds-text-secondary: #525252;
      --ds-card-bg: #FFFFFF;
      --ds-label-color: #525252;
      --ds-link-bg: #E0E0E0;
      --ds-border: 1px solid #E0E0E0;
      --ds-divider: #E0E0E0;
      /* Carbon: $support-error (Red 60) for danger, Blue 60 for primary actions */
      --ds-accent: #DA1E28;
      --ds-info-bg: #DA1E28;
      --ds-info-text: #FFFFFF;
      --ds-btn-bg: #161616;
      --ds-btn-hover: #353535;
      --ds-btn-active: #525252;
      --ds-fab-bg: #FFFFFF;
      --ds-fab-cross: #DA1E28;
      --ds-fab-open-ring: 0 0 0 2px #0F62FE;
      --ds-menu-text: #161616;
      --ds-menu-hover: #E8E8E8;
      --ds-menu-active-bg: rgba(15,98,254,0.10);
      --ds-menu-active-text: #0F62FE;
      --ds-footer-text: #525252;
      --ds-footer-link: #0F62FE;
      --ds-loader: #0F62FE;
      --ds-scrim: rgba(22,22,22,0.50);
    }
    body.ds-carbon .section-card {
      border: 1px solid #E0E0E0;
    }
    body.ds-carbon .fab-menu {
      border: 1px solid #E0E0E0;
    }
    body.ds-carbon .site-bottom-bar {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
    /* Carbon focus: 2px Blue 60 border */
    body.ds-carbon .fab-menu-item:focus-visible {
      outline: 2px solid #0F62FE;
      outline-offset: -2px;
    }

    /* ===== Dark mode — Samsung One UI (default) ===== */
    body.dark-mode {
      --ds-bg: #0E1C30;
      --ds-text: #FFE082;
      --ds-text-secondary: #D4BA5C;
      --ds-card-bg: #162844;
      --ds-label-color: #A0B8D0;
      --ds-link-bg: #1A2D4A;
      --ds-info-bg: #4A3768;
      --ds-info-text: #FFE082;
      --ds-btn-bg: #1E3450;
      --ds-btn-hover: #2A4565;
      --ds-btn-active: #345575;
      --ds-fab-bg: #CC0000;
      --ds-fab-cross: #FFFFFF;
      --ds-fab-open-ring: 0 0 0 2.5px rgba(255,255,255,0.30);
      --ds-menu-text: #FFE082;
      --ds-menu-hover: #1E3450;
      --ds-menu-active-bg: rgba(255,213,79,0.12);
      --ds-menu-active-text: #FFE082;
      --ds-footer-text: #D4BA5C;
      --ds-footer-link: #FFE082;
      --ds-divider: #2A4060;
      --ds-loader: #FFE082;
      --ds-scrim: rgba(0,0,0,0.65);
      --ds-border: 2px solid rgba(255,255,255,0.25);
      --ds-shadow-sm: 0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.30);
      --ds-shadow-md: 0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.30);
      --ds-shadow-lg: 0 2px 8px rgba(0,0,0,0.30), 0 12px 40px rgba(0,0,0,0.40);
      --ds-shadow-btn: 0 1px 3px rgba(0,0,0,0.25), 0 6px 20px rgba(0,0,0,0.35);
      --ds-bar-bg: rgba(14,28,48,0.50);
      --ds-bar-border: 1px solid rgba(255,255,255,0.10);
      --ds-bar-shadow: 0 2px 8px rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.30);
    }
    body.dark-mode .quick-links a::after {
      background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%);
      background-size: 250% 100%;
    }
    body.dark-mode .fab-menu::before { background: #3A5068; }
    body.dark-mode .fab-menu::-webkit-scrollbar-thumb { background: #3A5068; }

    /* ===== Dark mode — Apple Liquid Glass =====
       iOS dark: pure #000000 bg, #1C1C1E secondarySystemBackground,
       systemGray=#8E8E93, 0A84FF (dark blue), translucent glass persists,
       reduce transparency makes opaque */
    body.dark-mode.ds-liquid-glass {
      --ds-bg: #000000;
      --ds-text: #FFFFFF;
      --ds-text-secondary: #EBEBF5;
      --ds-card-bg: rgba(28,28,30,0.55);
      --ds-label-color: #8E8E93;
      --ds-link-bg: rgba(120,120,128,0.12);
      --ds-info-bg: #CC0000;
      --ds-info-text: #FFFFFF;
      --ds-btn-bg: rgba(120,120,128,0.24);
      --ds-btn-hover: rgba(120,120,128,0.32);
      --ds-btn-active: rgba(120,120,128,0.40);
      --ds-fab-bg: rgba(28,28,30,0.60);
      --ds-fab-cross: #FFFFFF;
      --ds-fab-open-ring: 0 0 0 1.5px rgba(255,255,255,0.16);
      --ds-menu-text: #FFFFFF;
      --ds-menu-hover: rgba(120,120,128,0.12);
      --ds-menu-active-bg: rgba(10,132,255,0.15);
      --ds-menu-active-text: #0A84FF;
      --ds-footer-text: #8E8E93;
      --ds-footer-link: #FFFFFF;
      --ds-divider: rgba(84,84,88,0.65);
      --ds-loader: #0A84FF;
      --ds-scrim: rgba(0,0,0,0.44);
      --ds-border: 0.5px solid rgba(84,84,88,0.45);
      --ds-bar-bg: rgba(28,28,30,0.35);
      --ds-bar-border: 0.5px solid rgba(84,84,88,0.30);
      --ds-shadow-sm: 0 0.5px 1px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.25);
      --ds-shadow-md: 0 1px 3px rgba(0,0,0,0.25), 0 4px 14px rgba(0,0,0,0.30);
      --ds-shadow-lg: 0 2px 8px rgba(0,0,0,0.30), 0 12px 40px rgba(0,0,0,0.40);
    }
    body.dark-mode.ds-liquid-glass .section-card {
      backdrop-filter: blur(30px) saturate(1.6);
      -webkit-backdrop-filter: blur(30px) saturate(1.6);
      border: 0.5px solid rgba(84,84,88,0.35);
    }
    body.dark-mode.ds-liquid-glass .fab-menu {
      backdrop-filter: blur(40px) saturate(2);
      -webkit-backdrop-filter: blur(40px) saturate(2);
      background: rgba(28,28,30,0.55);
      border: 0.5px solid rgba(84,84,88,0.35);
    }
    body.dark-mode.ds-liquid-glass .fab-btn {
      backdrop-filter: blur(20px) saturate(1.6);
      -webkit-backdrop-filter: blur(20px) saturate(1.6);
    }
    body.dark-mode.ds-liquid-glass .fab-menu::before { background: rgba(120,120,128,0.30); }
    body.dark-mode.ds-liquid-glass .ds-popup {
      backdrop-filter: blur(40px) saturate(2);
      -webkit-backdrop-filter: blur(40px) saturate(2);
      background: rgba(28,28,30,0.55);
      border: 0.5px solid rgba(84,84,88,0.35);
    }

    /* ===== Dark mode — Google Material 3 =====
       M3 dark scheme: surface=#141218, onSurface=#E6E0E9,
       surfaceContainerLow=#1D1B20, surfaceContainer=#211F26,
       surfaceContainerHigh=#2B2930, surfaceContainerHighest=#36343B,
       outline=#938F99, outlineVariant=#49454F,
       primary (dark)=#D0BCFF, onPrimary=#381E72,
       primaryContainer=#4F378B, scrim=rgba(0,0,0,0.32) */
    body.dark-mode.ds-material {
      --ds-bg: #141218;
      --ds-text: #E6E0E9;
      --ds-text-secondary: #CAC4D0;
      --ds-card-bg: #1D1B20;
      --ds-label-color: #CAC4D0;
      --ds-link-bg: #211F26;
      --ds-info-bg: #6750A4;
      --ds-info-text: #FFFFFF;
      --ds-btn-bg: #2B2930;
      --ds-btn-hover: #36343B;
      --ds-btn-active: #48464C;
      --ds-fab-bg: #2B2930;
      --ds-fab-cross: #D0BCFF;
      --ds-fab-open-ring: 0 0 0 2px rgba(208,188,255,0.35);
      --ds-menu-text: #E6E0E9;
      --ds-menu-hover: rgba(230,224,233,0.08);
      --ds-menu-active-bg: rgba(208,188,255,0.16);
      --ds-menu-active-text: #D0BCFF;
      --ds-footer-text: #CAC4D0;
      --ds-footer-link: #D0BCFF;
      --ds-divider: #49454F;
      --ds-loader: #D0BCFF;
      --ds-scrim: rgba(0,0,0,0.32);
      --ds-border: 1px solid #49454F;
      --ds-bar-bg: rgba(29,27,32,0.75);
      --ds-bar-border: none;
      --ds-shadow-sm: 0 1px 2px rgba(0,0,0,0.30), 0 1px 3px rgba(0,0,0,0.25);
      --ds-shadow-md: 0 1px 3px rgba(0,0,0,0.35), 0 4px 8px rgba(0,0,0,0.25);
      --ds-shadow-lg: 0 2px 6px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.30);
    }
    body.dark-mode.ds-material .section-card {
      border: 1px solid #49454F;
    }
    body.dark-mode.ds-material .fab-menu::before { background: #49454F; }

    /* ===== Dark mode — Windows Fluent 2 =====
       Fluent dark: colorNeutralBackground1=#292929,
       colorNeutralForeground1=#FFFFFF, 28% base shadow opacity,
       strokes instead of key shadows, focus stroke=White,
       interaction states: controls get *lighter* on Windows */
    body.dark-mode.ds-fluent {
      --ds-bg: #1F1F1F;
      --ds-text: #FFFFFF;
      --ds-text-secondary: #ADADAD;
      --ds-card-bg: #292929;
      --ds-label-color: #ADADAD;
      --ds-link-bg: #333333;
      --ds-info-bg: #CC0000;
      --ds-info-text: #FFFFFF;
      --ds-btn-bg: #333333;
      --ds-btn-hover: #3D3D3D;
      --ds-btn-active: #474747;
      --ds-fab-bg: #292929;
      --ds-fab-cross: #FFFFFF;
      --ds-fab-open-ring: 0 0 0 2px #FFFFFF;
      --ds-menu-text: #FFFFFF;
      --ds-menu-hover: rgba(255,255,255,0.0837);
      --ds-menu-active-bg: rgba(255,255,255,0.0578);
      --ds-menu-active-text: #FFFFFF;
      --ds-footer-text: #ADADAD;
      --ds-footer-link: #FFFFFF;
      --ds-divider: rgba(255,255,255,0.0837);
      --ds-loader: #60CDFF;
      --ds-scrim: rgba(0,0,0,0.50);
      --ds-border: 1px solid rgba(255,255,255,0.0837);
      --ds-bar-bg: rgba(41,41,41,0.75);
      --ds-bar-border: 1px solid rgba(255,255,255,0.0578);
      /* Fluent dark shadows: 28% base opacity */
      --ds-shadow-sm: 0 2px 4px rgba(0,0,0,0.28), 0 0 2px rgba(0,0,0,0.24);
      --ds-shadow-md: 0 4px 8px rgba(0,0,0,0.28), 0 0 2px rgba(0,0,0,0.24);
      --ds-shadow-lg: 0 8px 16px rgba(0,0,0,0.28), 0 0 2px rgba(0,0,0,0.24);
    }
    body.dark-mode.ds-fluent .section-card {
      border: 1px solid rgba(255,255,255,0.0578);
      border-top: 1px solid rgba(255,255,255,0.0837);
    }
    body.dark-mode.ds-fluent .fab-menu {
      border: 1px solid rgba(255,255,255,0.0578);
    }
    body.dark-mode.ds-fluent .fab-menu::before { background: #5C5C5C; }
    body.dark-mode.ds-fluent .fab-menu-item:focus-visible {
      outline: 2px solid #FFFFFF;
      outline-offset: -2px;
    }

    /* ===== Dark mode — IBM Carbon (Gray 100 theme) =====
       Carbon Gray 100: $background=#161616, $text-primary=Gray10=#F4F4F4,
       $text-secondary=Gray30=#C6C6C6, $layer-01=#262626,
       $border-subtle-01=#393939, $interactive=Blue40=#78A9FF,
       $support-error=Red50=#FA4D56, $focus=White #FFFFFF,
       $link-primary=Blue40=#78A9FF */
    body.dark-mode.ds-carbon {
      --ds-bg: #161616;
      --ds-text: #F4F4F4;
      --ds-text-secondary: #C6C6C6;
      --ds-card-bg: #262626;
      --ds-label-color: #C6C6C6;
      --ds-link-bg: #393939;
      --ds-info-bg: #DA1E28;
      --ds-info-text: #FFFFFF;
      --ds-btn-bg: #393939;
      --ds-btn-hover: #4C4C4C;
      --ds-btn-active: #525252;
      --ds-fab-bg: #262626;
      --ds-fab-cross: #F4F4F4;
      --ds-fab-open-ring: 0 0 0 2px #FFFFFF;
      --ds-menu-text: #F4F4F4;
      --ds-menu-hover: #353535;
      --ds-menu-active-bg: rgba(120,169,255,0.20);
      --ds-menu-active-text: #78A9FF;
      --ds-footer-text: #C6C6C6;
      --ds-footer-link: #78A9FF;
      --ds-divider: #393939;
      --ds-loader: #78A9FF;
      --ds-scrim: rgba(22,22,22,0.70);
      --ds-border: 1px solid #393939;
      --ds-bar-bg: #262626;
      --ds-bar-border: 1px solid #393939;
      --ds-bar-shadow: 0 2px 6px rgba(0,0,0,0.30);
      --ds-shadow-sm: 0 2px 6px rgba(0,0,0,0.30);
      --ds-shadow-md: 0 2px 6px rgba(0,0,0,0.40);
      --ds-shadow-lg: 0 8px 16px rgba(0,0,0,0.40);
    }
    body.dark-mode.ds-carbon .section-card {
      border: 1px solid #393939;
    }
    body.dark-mode.ds-carbon .fab-menu {
      border: 1px solid #393939;
    }
    body.dark-mode.ds-carbon .site-bottom-bar {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
    body.dark-mode.ds-carbon .fab-menu::before { background: #525252; }
    body.dark-mode.ds-carbon .fab-menu-item:focus-visible {
      outline: 2px solid #FFFFFF;
      outline-offset: -2px;
    }

    /* --- Theme selector popup --- */
    .ds-picker-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 42px;
      height: 42px;
      border-radius: var(--ds-radius-btn);
      border: none;
      background: var(--ds-btn-bg);
      color: #fff;
      cursor: pointer;
      box-shadow: var(--ds-shadow-btn);
      transition: background-color 0.15s, box-shadow 0.5s ease, border-radius 0.4s ease;
      -webkit-tap-highlight-color: transparent;
      font-size: 18px;
      line-height: 1;
    }
    .ds-picker-btn:hover { background: var(--ds-btn-hover); }
    .ds-picker-btn:active { background: var(--ds-btn-active); }

    .ds-popup {
      position: fixed;
      bottom: calc(66px + env(safe-area-inset-bottom, 0px));
      right: 12px;
      z-index: 10001;
      background: var(--ds-card-bg, #fff);
      border-radius: var(--ds-radius-md, 26px);
      box-shadow: var(--ds-shadow-lg);
      padding: 8px 0;
      min-width: 240px;
      transform: translateY(12px) scale(0.92);
      opacity: 0;
      pointer-events: none;
      transform-origin: bottom right;
      transition:
        transform var(--ds-motion, 0.3s ease),
        opacity 0.2s ease,
        background-color 0.5s ease;
    }
    .ds-popup.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }
    .ds-popup-title {
      padding: 10px 20px 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--ds-label-color);
    }
    .ds-popup-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 20px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: var(--ds-menu-text);
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      transition: background 0.15s;
    }
    .ds-popup-item:hover { background: var(--ds-menu-hover); }
    .ds-popup-item:active { background: var(--ds-menu-hover); }
    .ds-popup-item.active {
      color: var(--ds-menu-active-text);
      font-weight: 600;
      background: var(--ds-menu-active-bg);
    }
    .ds-popup-item .ds-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      flex-shrink: 0;
    }
    .ds-popup-item .ds-desc {
      font-size: 11px;
      font-weight: 400;
      color: var(--ds-text-secondary);
      margin-top: 1px;
    }
  </style>
</head>

<body>
<script>(function(){var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches);if(d){document.body.classList.add('dark-mode');var m=document.getElementById('metaThemeColor');if(m)m.setAttribute('content','#0E1C30')}var ds=localStorage.getItem('designSystem');if(ds&&ds!=='oneui'){document.body.classList.add('ds-'+ds)}})()</script>

<div class="site-wrap">

  <!-- Top banner -->
  <a href="./index.html" class="site-banner">
    <img src="./resources/images/wmpc_topbanner_transparent.png" alt="All World Mission Prayer Center" />
  </a>

  <!-- Main banner image -->
  <a href="./index.html" class="site-main-banner">
    <img src="./webData/components/wmpc_mainbanner2.gif" alt="AWMPC Church Banner" />
  </a>


  <!-- Quick links grid -->
  <div class="section-card">
    <span class="section-card-label">Site Links</span>
    <div class="quick-links">
      <a href="./24hrhop.html"><img src="./resources/images/building_front_compressed_09_05_2020_mini.jpg" alt="Church Building" loading="lazy" /></a>
      <a href="./prayer.html"><img src="./webData/components/adwindow_prayermeeting.jpg" alt="Prayer Meeting" loading="lazy" /></a>
      <a href="./sermons.html"><img src="./webData/components/adwindow_dailysermon.jpg" alt="Daily Sermon" loading="lazy" /></a>
      <a href="./request.html"><img src="./webData/components/adwindow_prayerrequest.jpg" alt="Prayer Request" loading="lazy" /></a>
      <a href="./mission.html"><img src="./resources/images/sidebar_mission.jpg" alt="Mission" loading="lazy" /></a>
      <a href="https://allworldmissionprayercenterinc-321.my.webex.com/meet/awmpc" target="_blank" rel="noopener" class="webex-card-link">
        <span class="webex-card">
          <span class="webex-card-left">
            <img src="https://developer.webex.com/images/webex-logo-icon-non-contained.svg" alt="" class="webex-card-logo" />
          </span>
          <span class="webex-card-divider"></span>
          <span class="webex-card-right">
            <span class="webex-card-line1">Join on</span>
            <span class="webex-card-line2">Webex!</span>
          </span>
        </span>
      </a>
    </div>
  </div>

  <!-- Page content -->
  <?php
    $menuItem = $_GET["page"];
    $pageNames = array(
      'mi_home' => 'Homepage',
      'mi_prayer' => 'Prayer',
      'mi_events' => 'Events',
      'mi_contact' => 'Contact',
      'mi_media' => 'Media',
      'mi_support' => 'Donations',
      'mi_mission' => 'Mission',
      'mi_reply' => 'Prayer Reply',
      'mi_request' => 'Prayers',
      'mi_sermons' => 'Sermons',
      'mi_testimony' => 'Testimony',
      'mi_24hrhop' => 'Church',
      'mi_taiwan' => 'Taiwan',
      'mi_letters' => 'Letters',
      'mi_canaan_record' => 'Canaan',
      'hymns' => 'Hymns'
    );
  ?>
  <div class="section-card" id="contentCard">
    <span class="section-card-label" id="contentCardLabel"><?php echo isset($pageNames[$menuItem]) ? $pageNames[$menuItem] : 'Homepage'; ?></span>

    <main class="site-main">

      <?php
      $files['mi_home']          = "wmpc_s_home.html";
      $files['mi_prayer']        = "wmpc_s_focus_prayer_week_04_09v2.html";
      $files['mi_events']        = "wmpc_s_events.html";
      $files['mi_contact']       = "wmpc_s_contactus.html";
      $files['mi_media']         = "wmpc_s_media.html";
      $files['mi_support']       = "wmpc_s_ministrysupport.html";
      $files['mi_mission']       = "wmpc_s_mission_cn.html";
      $files['mi_reply']         = "wmpc_s_prayerreply.html";
      $files['mi_request']       = "wmpc_s_prayerrequest.html";
      $files['mi_sermons']       = "wmpc_s_sermons.html";
      $files['mi_testimony']     = "wmpc_s_testimonies.html";
      $files['mi_24hrhop']       = "wmpc_s_24hrhop.html";
      $files['mi_taiwan']        = "wmpc_s_taiwan040809.html";
      $files['mi_letters']       = "wmpc_s_letters.html";
      $files['mi_canaan_record'] = "canaan_chapel_record.html";
      $files['hymns']            = "wmpc_s_hymns.html";

      $fname = $files[$menuItem];
      $file = fopen($fname, "r") or exit("Unable to open file!");
      while (!feof($file)) {
        echo fgets($file);
      }
      fclose($file);
      ?>

    </main>

  </div>


  <!-- Footer -->
  <hr class="site-footer-divider">
  <footer class="site-footer">
    <div class="footer-left">
      <a href="https://info.flagcounter.com/u2K3"><img src="https://s11.flagcounter.com/count2/u2K3/bg_FFFFFF/txt_000000/border_CCCCCC/columns_2/maxflags_10/viewers_0/labels_0/pageviews_0/flags_0/percent_0/" alt="Flag Counter" border="0" loading="lazy"></a>
      <script type="text/javascript" src="https://rf.revolvermaps.com/0/0/2.js?i=536ikush1dr&amp;m=7&amp;s=178&amp;c=ff0000&amp;t=1" async="async"></script>
      <br>
      <small style="color:#5A4409;">&copy; awmpc.org</small>
    </div>

    <div class="footer-center">
      1189 S. De Anza Blvd.<br>
      San Jose, CA 95129<br>
      Jay: (415) 816-7873<br>
      Joanna: (650) 504-4901
    </div>

    <div class="footer-right">
      <a href="https://awmpc.org/awmpc_tocau.html">Terms of Conditions and Use</a>
      <a href="https://awmpc.org/awmpc_privacy.html">Privacy Policy</a>
      <a href="https://awmpc.org/awmpc_refunds.html">Donations and Refunds Policy</a>
      <a href="https://www.ssllabs.com/ssltest/analyze.html?d=awmpc.org">Qualys SSL Security Scan</a>
      <a href="https://developers.google.com/speed/pagespeed/insights/?url=awmpc.org&tab=mobile">Google Lighthouse Performance Scan</a>
    </div>
  </footer>

</div>

<!-- Sticky bottom bar: marquee + theme toggle + FAB -->
<div class="site-bottom-bar">
  <div class="site-info-bar">
    <div class="info-bar-text">
      <span class="info-bar-scroll">全年無休 | 晨禱禮拜：6:30am - 8:00am | 晚禱禮拜：8:00pm - 9:00pm | 主日崇拜 周日：10:00am 開始</span>
    </div>
  </div>
  <button class="site-top-btn" id="themeToggle" type="button" aria-label="Toggle dark mode">
    <div class="theme-icon-flip">
      <svg class="icon-sun" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      <svg class="icon-moon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    </div>
  </button>
  <button class="ds-picker-btn" id="dsPickerBtn" type="button" aria-label="Choose design system">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  </button>
  <button class="fab-btn" id="fabBtn" aria-label="Open navigation menu" aria-expanded="false">
    <div class="fab-icon"></div>
  </button>
</div>

<!-- Quick-links skeleton → loaded transition -->
<script>
(function() {
  var links = document.querySelectorAll('.quick-links a');
  links.forEach(function(a) {
    var img = a.querySelector('img');
    if (!img) { a.classList.add('loaded'); return; }
    if (img.complete) { a.classList.add('loaded'); return; }
    img.addEventListener('load', function() { a.classList.add('loaded'); });
    img.addEventListener('error', function() { a.classList.add('loaded'); });
  });
})();
</script>

<!-- Theme toggle -->
<script>
(function() {
  var btn = document.getElementById('themeToggle');
  var metaTC = document.getElementById('metaThemeColor');

  function applyTheme(dark) {
    document.body.classList.toggle('dark-mode', dark);
    var bg = getComputedStyle(document.body).getPropertyValue('--ds-bg').trim();
    if (metaTC && bg) metaTC.setAttribute('content', bg);
  }

  // Manual toggle — saves explicit preference
  btn.addEventListener('click', function() {
    var nowDark = !document.body.classList.contains('dark-mode');
    applyTheme(nowDark);
    localStorage.setItem('theme', nowDark ? 'dark' : 'light');
  });

  // Listen for OS/system theme changes at runtime
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', function(e) {
    // Only follow system if user hasn't set a manual preference
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches);
    }
  });

  // Set initial theme-color meta to match current state
  applyTheme(document.body.classList.contains('dark-mode'));
})();
</script>

<!-- Design system picker popup -->
<div class="ds-popup" id="dsPopup">
  <div class="ds-popup-title">Design System</div>
  <button class="ds-popup-item active" data-ds="oneui">
    <span class="ds-icon" style="background:#1428A0;color:#fff;">S</span>
    <span><span>Samsung One UI</span><br><span class="ds-desc">Rounded, warm, bottom-focused interaction</span></span>
  </button>
  <button class="ds-popup-item" data-ds="liquid-glass">
    <span class="ds-icon" style="background:#A2AAAD;color:#fff;">&#63743;</span>
    <span><span>Apple Liquid Glass</span><br><span class="ds-desc">Translucent glass, refraction, fluid morph</span></span>
  </button>
  <button class="ds-popup-item" data-ds="material">
    <span class="ds-icon" style="background:#6750A4;color:#fff;">M</span>
    <span><span>Google Material 3</span><br><span class="ds-desc">Tonal elevation, dynamic color, spring motion</span></span>
  </button>
  <button class="ds-popup-item" data-ds="fluent">
    <span class="ds-icon" style="background:#0F6CBD;color:#fff;">F</span>
    <span><span>Windows Fluent 2</span><br><span class="ds-desc">4px grid, key+ambient shadows, Segoe UI</span></span>
  </button>
  <button class="ds-popup-item" data-ds="carbon">
    <span class="ds-icon" style="background:#161616;color:#fff;">C</span>
    <span><span>IBM Carbon</span><br><span class="ds-desc">2x grid, zero radius, IBM Plex, structured</span></span>
  </button>
</div>

<!-- Design system picker -->
<script>
(function() {
  var btn = document.getElementById('dsPickerBtn');
  var popup = document.getElementById('dsPopup');
  var items = popup.querySelectorAll('.ds-popup-item');
  var isOpen = false;

  var dsClasses = ['ds-liquid-glass', 'ds-material', 'ds-fluent', 'ds-carbon'];
  var dsMap = {
    'oneui': null,
    'liquid-glass': 'ds-liquid-glass',
    'material': 'ds-material',
    'fluent': 'ds-fluent',
    'carbon': 'ds-carbon'
  };

  function applyDS(key) {
    dsClasses.forEach(function(c) { document.body.classList.remove(c); });
    var cls = dsMap[key];
    if (cls) document.body.classList.add(cls);
    localStorage.setItem('designSystem', key);

    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', items[i].getAttribute('data-ds') === key);
    }

    var metaTC = document.getElementById('metaThemeColor');
    var bg = getComputedStyle(document.body).getPropertyValue('--ds-bg').trim();
    if (metaTC && bg) metaTC.setAttribute('content', bg);
  }

  function toggle() {
    isOpen = !isOpen;
    popup.classList.toggle('open', isOpen);
  }

  function close() {
    if (isOpen) { isOpen = false; popup.classList.remove('open'); }
  }

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    toggle();
  });

  for (var i = 0; i < items.length; i++) {
    items[i].addEventListener('click', function() {
      applyDS(this.getAttribute('data-ds'));
      close();
    });
  }

  document.addEventListener('click', function(e) {
    if (!popup.contains(e.target) && e.target !== btn) close();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') close();
  });

  var saved = localStorage.getItem('designSystem');
  if (saved && dsMap.hasOwnProperty(saved)) applyDS(saved);
})();
</script>

<!-- Info bar marquee for mobile -->
<script>
(function() {
  var bar = document.querySelector('.info-bar-text');
  var text = bar && bar.querySelector('.info-bar-scroll');
  if (!bar || !text) return;

  var timer = null;

  function cycle() {
    // Account for left+right padding (16px each) so last characters are visible
    var overflow = text.scrollWidth - bar.clientWidth + 32;
    if (overflow <= 0) { text.style.transform = ''; return; }

    // Slow linear scroll (~28px/s) for comfortable reading mid-travel
    var scrollDur = overflow / 28;
    var returnDur = overflow / 70;

    // 1. Hold at start
    text.style.transition = 'none';
    text.style.transform = 'translateX(0)';

    timer = setTimeout(function() {
      // 2. Scroll left — linear for constant readable speed
      text.style.transition = 'transform ' + scrollDur + 's linear';
      text.style.transform = 'translateX(-' + overflow + 'px)';

      timer = setTimeout(function() {
        // 3. Hold at end, then ease back to start
        text.style.transition = 'transform ' + returnDur + 's ease-in-out';
        text.style.transform = 'translateX(0)';

        timer = setTimeout(cycle, returnDur * 1000 + 2000);
      }, scrollDur * 1000 + 1500);
    }, 2000);
  }

  function start() {
    stop();
    if (window.matchMedia('(max-width: 768px)').matches) cycle();
    else { text.style.transition = ''; text.style.transform = ''; }
  }
  function stop() { if (timer) { clearTimeout(timer); timer = null; } }

  window.matchMedia('(max-width: 768px)').addEventListener('change', start);
  start();
})();
</script>

<!-- SPA loading bar -->
<div class="spa-loader" id="spaLoader"></div>

<!-- FAB Navigation -->
<div class="fab-scrim" id="fabScrim"></div>

<nav class="fab-menu" id="fabMenu" aria-label="Quick navigation">
  <a class="fab-menu-item" href="./index.html">Homepage <span class="fab-item-zh">首頁</span></a>
  <a class="fab-menu-item" href="./mission.html">Mission <span class="fab-item-zh">使命</span></a>
  <a class="fab-menu-item" href="./sermons.html">Sermons <span class="fab-item-zh">講道</span></a>
  <a class="fab-menu-item" href="./testimony.html">Testimony <span class="fab-item-zh">見證</span></a>
  <a class="fab-menu-item" href="./request.html">Prayers <span class="fab-item-zh">代禱</span></a>
  <a class="fab-menu-item" href="./24hrhop.html">Church <span class="fab-item-zh">建堂</span></a>
  <a class="fab-menu-item" href="./support.html">Donations <span class="fab-item-zh">支持</span></a>
  <a class="fab-menu-item" href="./media.html">Media <span class="fab-item-zh">媒體</span></a>
  <a class="fab-menu-item" href="./letters.html">Letters <span class="fab-item-zh">信件</span></a>
  <a class="fab-menu-item" href="./canaan_record.html">Canaan <span class="fab-item-zh">历史</span></a>
  <a class="fab-menu-item" href="./hymns.html">Hymns <span class="fab-item-zh">讚美詩</span></a>
</nav>


<script>
(function() {
  var btn   = document.getElementById('fabBtn');
  var menu  = document.getElementById('fabMenu');
  var scrim = document.getElementById('fabScrim');
  var items = menu.querySelectorAll('.fab-menu-item');
  var isOpen = false;

  function toggle() {
    isOpen = !isOpen;
    btn.classList.toggle('open', isOpen);
    menu.classList.toggle('open', isOpen);
    scrim.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    // Stagger item entrance — One UI cascading deceleration
    for (var i = 0; i < items.length; i++) {
      if (isOpen) {
        items[i].style.transitionDelay = (i * 30) + 'ms';
      } else {
        items[i].style.transitionDelay = '0ms';
      }
    }

    // Block background touch-scrolling on mobile while sheet is open
    if (isOpen) {
      document.addEventListener('touchmove', preventBgScroll, { passive: false });
    } else {
      document.removeEventListener('touchmove', preventBgScroll);
    }

  }

  // Allow touch-scroll only inside the menu; block everywhere else
  function preventBgScroll(e) {
    if (!menu.contains(e.target)) e.preventDefault();
  }

  function close() {
    if (isOpen) toggle();
  }

  // Expose close so SPA router can call it
  window._fabClose = close;

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    toggle();
  });

  scrim.addEventListener('click', close);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') close();
  });

  // --- One UI drag-to-dismiss for mobile bottom sheet ---
  var dragStartY = 0;
  var lastY = 0;
  var lastTime = 0;
  var velocityY = 0;
  var dragging = false;

  menu.addEventListener('touchstart', function(e) {
    if (!isOpen) return;
    // Only allow drag when sheet is scrolled to the very top
    if (menu.scrollTop > 0) return;
    dragStartY = e.touches[0].clientY;
    lastY = dragStartY;
    lastTime = Date.now();
    velocityY = 0;
    dragging = true;
    menu.style.transition = 'none';
    scrim.style.transition = 'none';
  }, { passive: true });

  menu.addEventListener('touchmove', function(e) {
    if (!dragging) return;
    var touchY = e.touches[0].clientY;
    var dy = touchY - dragStartY;
    if (dy < 0) dy = 0; // only allow downward drag

    // Track velocity for flick detection
    var now = Date.now();
    var dt = now - lastTime;
    if (dt > 0) velocityY = (touchY - lastY) / dt;
    lastY = touchY;
    lastTime = now;

    menu.style.transform = 'translateY(' + dy + 'px)';
    // Fade scrim in direct 1:1 proportion with sheet position
    scrim.style.opacity = Math.max(0, 1 - (dy / menu.offsetHeight));

    e.preventDefault(); // prevent page scroll in all directions during drag
  }, { passive: false });

  menu.addEventListener('touchend', function(e) {
    if (!dragging) return;
    dragging = false;
    var dy = e.changedTouches[0].clientY - dragStartY;

    // Flick direction takes priority: upward swipe always snaps back
    var flickingUp = velocityY < -0.3;
    var shouldDismiss = !flickingUp && (dy > 80 || velocityY > 0.4);
    if (shouldDismiss) {
      // Animate sheet off-screen from current position
      menu.style.transition = 'transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1)';
      menu.style.transform = 'translateY(100%)';
      scrim.style.transition = 'opacity 0.25s';
      scrim.style.opacity = '0';
      setTimeout(function() {
        // Clean up inline styles, then run normal close logic
        menu.style.transition = '';
        menu.style.transform = '';
        scrim.style.transition = '';
        scrim.style.opacity = '';
        if (isOpen) toggle();
      }, 260);
    } else {
      // Snap back to open position
      menu.style.transition = 'transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1)';
      menu.style.transform = 'translateY(0)';
      scrim.style.transition = 'opacity 0.25s';
      scrim.style.opacity = '';
      setTimeout(function() {
        menu.style.transition = '';
        menu.style.transform = '';
        scrim.style.transition = '';
      }, 260);
    }
  });
})();
</script>

<!-- SPA Client-Side Router -->
<script>
(function() {
  // Route map: URL filename → content fragment file
  var routes = {
    'index.html':         'wmpc_s_home.html',
    'mission.html':       'wmpc_s_mission_cn.html',
    'sermons.html':       'wmpc_s_sermons.html',
    'testimony.html':     'wmpc_s_testimonies.html',
    'request.html':       'wmpc_s_prayerrequest.html',
    '24hrhop.html':       'wmpc_s_24hrhop.html',
    'support.html':       'wmpc_s_ministrysupport.html',
    'media.html':         'wmpc_s_media.html',
    'letters.html':       'wmpc_s_letters.html',
    'canaan_record.html': 'canaan_chapel_record.html',
    'hymns.html':         'wmpc_s_hymns.html',
    'prayer.html':        'wmpc_s_focus_prayer_week_04_09v2.html'
  };

  var pageNames = {
    'index.html': 'Homepage',
    'mission.html': 'Mission',
    'sermons.html': 'Sermons',
    'testimony.html': 'Testimony',
    'request.html': 'Prayers',
    '24hrhop.html': 'Church',
    'support.html': 'Donations',
    'media.html': 'Media',
    'letters.html': 'Letters',
    'canaan_record.html': 'Canaan',
    'hymns.html': 'Hymns',
    'prayer.html': 'Prayer'
  };

  var mainEl = document.querySelector('.site-main');
  var loader = document.getElementById('spaLoader');
  var contentLabel = document.getElementById('contentCardLabel');
  var cache  = {};  // fragment cache: avoid refetching same page

  // Extract filename from any href
  function routeKey(href) {
    try {
      var url = new URL(href, window.location.origin);
      var parts = url.pathname.split('/');
      return parts[parts.length - 1] || '';
    } catch(e) { return ''; }
  }

  // --- Loading bar ---
  function loaderStart() {
    loader.className = 'spa-loader';
    void loader.offsetWidth;           // force reflow
    loader.classList.add('loading');
  }
  function loaderDone() {
    loader.classList.remove('loading');
    loader.classList.add('done');
    setTimeout(function() {
      loader.classList.add('hide');
    }, 200);
    setTimeout(function() {
      loader.className = 'spa-loader';
    }, 600);
  }

  // --- Highlight active page in FAB menu ---
  function updateActiveNav(activeKey) {
    var items = document.querySelectorAll('.fab-menu-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('fab-active', routeKey(items[i].href) === activeKey);
    }
  }

  // --- Execute scripts inside injected HTML ---
  function runScripts(container) {
    var scripts = container.querySelectorAll('script');
    for (var i = 0; i < scripts.length; i++) {
      var old = scripts[i];
      var s = document.createElement('script');
      for (var j = 0; j < old.attributes.length; j++) {
        s.setAttribute(old.attributes[j].name, old.attributes[j].value);
      }
      if (!old.src) {
        s.textContent = old.textContent;
      }
      old.parentNode.replaceChild(s, old);
    }
  }

  // --- Load a content fragment and swap it in ---
  var contentCard = document.getElementById('contentCard');

  function navigate(fragmentFile, displayUrl, pushState) {
    loaderStart();

    var done = function(html) {
      // Fade out current content
      mainEl.classList.add('fade-out');

      setTimeout(function() {
        mainEl.innerHTML = html;
        runScripts(mainEl);

        if (pushState && displayUrl) {
          history.pushState({ fragment: fragmentFile }, '', displayUrl);
        }

        // Update active page indicator in FAB and content card label
        var activeKey = routeKey(displayUrl || window.location.href);
        updateActiveNav(activeKey);
        if (contentLabel) contentLabel.textContent = pageNames[activeKey] || 'Homepage';

        // Scroll to top of content card
        if (contentCard) {
          contentCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Fade in new content
        void mainEl.offsetWidth;
        mainEl.classList.remove('fade-out');

        loaderDone();
      }, 200);
    };

    if (cache[fragmentFile]) {
      done(cache[fragmentFile]);
      return;
    }

    fetch(fragmentFile)
      .then(function(res) {
        if (!res.ok) throw new Error(res.status);
        return res.text();
      })
      .then(function(html) {
        cache[fragmentFile] = html;
        done(html);
      })
      .catch(function() {
        loaderDone();
        // Fallback: full page navigation
        if (displayUrl) window.location.href = displayUrl;
      });
  }

  // --- Intercept clicks on any internal link ---
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (!link) return;

    // Skip external, new-tab, download, hash-only links
    if (link.target === '_blank' || link.target === '_new') return;
    if (link.hasAttribute('download')) return;
    if (link.hostname && link.hostname !== window.location.hostname) return;

    var key = routeKey(link.href);
    var fragment = routes[key];
    if (!fragment) return;

    e.preventDefault();

    // Close FAB first, then navigate after its animation settles
    if (window._fabClose) window._fabClose();
    setTimeout(function() {
      navigate(fragment, link.href, true);
    }, 80);
  });

  // --- Handle browser back / forward ---
  window.addEventListener('popstate', function(e) {
    if (e.state && e.state.fragment) {
      navigate(e.state.fragment, null, false);
    }
  });

  // --- Seed initial history entry so back works ---
  var initKey = routeKey(window.location.href);
  var initFragment = routes[initKey];
  if (initFragment) {
    history.replaceState({ fragment: initFragment }, '', window.location.href);
  }

  // --- Highlight current page on initial load ---
  updateActiveNav(initKey);
})();
</script>

</body>
</html>
