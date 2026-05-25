<!DOCTYPE html>
<html lang="en">

<head>
  <title>All World Mission Prayer Center - 信望愛禱告中心</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="keywords" content="awmpc,wmpc,awmpc.org,All World Mission Prayer Center,World Mission Prayer Center,prayer,mission" />
  <meta name="theme-color" content="#EDE3D5" id="metaThemeColor">
  <meta name="color-scheme" content="light">
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
      --ds-bg: #EDE3D5;
      --ds-text: #212121;
      --ds-text-secondary: #656565;
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
    }

    /* --- Banner + info bar combined card --- */
    .site-hero-card {
      border-radius: var(--ds-radius-md);
      margin: 12px 0;
      box-shadow: var(--ds-shadow-md);
      overflow: hidden;
      background-color: #BDA58B;
    }
    .site-banner {
      display: block;
      padding: 12px;
      text-decoration: none;
    }
    .site-banner img {
      width: 100%;
      height: auto;
      display: block;
    }
    .site-top-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px 10px;
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

    /* site-main-banner styles deprecated — replaced by single banner image */

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
    .quick-link-icon {
      display: flex !important;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      background: #f7f5f0 !important;
      font-size: 28px;
      line-height: 1;
      gap: 4px;
    }
    .quick-link-icon span {
      font-size: 11px;
      font-weight: 600;
      color: #444;
      text-align: center;
      line-height: 1.3;
    }
    .quick-link-icon::after { display: none !important; }
    /* webex-card styles deprecated — replaced by awmpc_webex_join_banner.png */
    @media (max-width: 768px) {
      .quick-links {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-template-rows: 1fr 1fr;
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
      background: rgba(255,255,255,0.72);
      backdrop-filter: var(--ds-blur);
      -webkit-backdrop-filter: var(--ds-blur);
      border-radius: var(--ds-radius-md);
      box-shadow: var(--ds-shadow-lg);
      padding: 8px 0;
      min-width: 220px;
      max-height: calc(100dvh - 140px);
      transform: translateY(16px) scale(0.92);
      opacity: 0;
      pointer-events: none;
      transform-origin: bottom right;
      transition:
        transform var(--ds-motion),
        opacity 0.25s cubic-bezier(0.33, 0, 0.67, 1),
        background-color 0.5s ease;
    }
    .fab-menu-scroll {
      overflow-y: auto;
      overscroll-behavior: contain;
      max-height: inherit;
    }
    .fab-menu.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    /* Scrollbar styling inside sheet */
    .fab-menu-scroll::-webkit-scrollbar { width: 4px; }
    .fab-menu-scroll::-webkit-scrollbar-track { background: transparent; }
    .fab-menu-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

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
    .fab-menu-item.fab-bible {
      background: #f0f2f5;
      border-top: 1px solid #e0e0e0;
      margin-top: 4px;
    }
    .fab-menu-item.fab-bible:hover {
      background: #e4e6ea;
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

    /* --- Bottom sheet for small screens --- */
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
        padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      }
      .fab-menu-scroll {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2px;
        max-height: calc(70dvh - 80px);
      }
      .fab-menu::before {
        content: '';
        display: block;
        width: 40px;
        height: 4px;
        background: #ccc;
        border-radius: 2px;
        margin: 4px auto 8px;
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

    /* Samsung One UI is the only design system (tokens in :root) */
  </style>
</head>

<body>

<div class="site-wrap">

  <!-- Banner + info bar card -->
  <div class="site-hero-card">
    <a href="./index.html" class="site-banner">
      <img src="./resources/images/banners/wmpc_topbanner_transparent.png" alt="All World Mission Prayer Center" />
    </a>
    <div class="site-top-bar">
      <div class="site-info-bar">
        <div class="info-bar-text">
          <span class="info-bar-scroll">全年無休 | 晨禱禮拜：6:30am - 8:00am | 晚禱禮拜：8:00pm - 9:00pm | 主日崇拜 周日：10:00am 開始</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick links grid -->
  <div class="section-card">
    <span class="section-card-label">Site Links</span>
    <div class="quick-links">
      <a href="./24hrhop.html"><img src="./resources/images/banners/awmpc_banner_2026_03_05.webp" alt="Church Building" loading="lazy" /></a>
      <a href="./prayer.html"><img src="./resources/images/sidebar/adwindow_prayermeeting.jpg" alt="Prayer Meeting" loading="lazy" /></a>
      <a href="./sermons.html"><img src="./resources/images/sidebar/adwindow_dailysermon.jpg" alt="Daily Sermon" loading="lazy" /></a>
      <a href="./request.html"><img src="./resources/images/sidebar/adwindow_prayerrequest.jpg" alt="Prayer Request" loading="lazy" /></a>
      <a href="./mission.html"><img src="./resources/images/sidebar_mission.jpg" alt="Mission" loading="lazy" /></a>
      <a href="https://allworldmissionprayercenterinc-321.my.webex.com/meet/awmpc" target="_blank" rel="noopener"><img src="./resources/images/awmpc_webex_join_banner.png" alt="Join on Webex" loading="lazy" /></a>
      <a href="./hymns.html" class="quick-link-hymns quick-link-icon" aria-label="Hymns">🎤<span>Hymns<br>讚美詩</span></a>
      <a href="./bible.html" class="quick-link-bible quick-link-icon" aria-label="Bible">📖<span>Bible<br>聖經</span></a>
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

<!-- FAB button: fixed bottom-right -->
<button class="fab-btn" id="fabBtn" aria-label="Open navigation menu" aria-expanded="false" style="position:fixed;bottom:calc(12px + env(safe-area-inset-bottom, 0px));right:12px;z-index:10000;">
  <div class="fab-icon"></div>
</button>

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

<!-- banner blend script removed — single banner image now -->


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
  <div class="fab-menu-scroll">
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
  <a class="fab-menu-item fab-bible" href="./bible.html">📚 Bible <span class="fab-item-zh">聖經</span></a>
  </div>
</nav>


<script>
(function() {
  var btn   = document.getElementById('fabBtn');
  var menu  = document.getElementById('fabMenu');
  var menuScroll = menu.querySelector('.fab-menu-scroll');
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

  // --- Drag-to-dismiss for mobile bottom sheet ---
  var dragStartY = 0;
  var lastY = 0;
  var lastTime = 0;
  var velocityY = 0;
  var dragging = false;

  menu.addEventListener('touchstart', function(e) {
    if (!isOpen) return;
    if (menuScroll.scrollTop > 1) return;
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
    if (dy < 0) dy = 0;

    var now = Date.now();
    var dt = now - lastTime;
    if (dt > 0) velocityY = (touchY - lastY) / dt;
    lastY = touchY;
    lastTime = now;

    menu.style.transform = 'translateY(' + dy + 'px)';
    scrim.style.opacity = Math.max(0, 1 - (dy / menu.offsetHeight));

    e.preventDefault();
  }, { passive: false });

  menu.addEventListener('touchend', function(e) {
    if (!dragging) return;
    dragging = false;
    var dy = e.changedTouches[0].clientY - dragStartY;

    var shouldDismiss = dy > 80 || velocityY > 0.4;
    if (shouldDismiss) {
      menu.style.transition = 'transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1)';
      menu.style.transform = 'translateY(100%)';
      scrim.style.transition = 'opacity 0.25s';
      scrim.style.opacity = '0';
      setTimeout(function() {
        menu.style.transition = '';
        menu.style.transform = '';
        scrim.style.transition = '';
        scrim.style.opacity = '';
        if (isOpen) toggle();
      }, 260);
    } else {
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
    var scripts = Array.prototype.slice.call(container.querySelectorAll('script'));

    return scripts.reduce(function(chain, old) {
      return chain.then(function() {
        return new Promise(function(resolve) {
          var s = document.createElement('script');
          for (var j = 0; j < old.attributes.length; j++) {
            s.setAttribute(old.attributes[j].name, old.attributes[j].value);
          }

          s.async = false;

          if (old.src) {
            s.onload = resolve;
            s.onerror = resolve;
          } else {
            s.textContent = old.textContent;
          }

          old.parentNode.replaceChild(s, old);
          if (!old.src) resolve();
        });
      });
    }, Promise.resolve());
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
        return runScripts(mainEl).then(function() {
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
        });
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
        mainEl.innerHTML = '<p style="text-align:center;padding:40px 20px;color:var(--ds-text-secondary);">' +
          'This page is not available offline. Please reconnect and try again.</p>';
        mainEl.classList.remove('fade-out');
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
