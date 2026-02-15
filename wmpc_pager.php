<!DOCTYPE html>
<html lang="en">

<head>
  <title>All World Mission Prayer Center - 信望愛禱告中心</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="keywords" content="awmpc,wmpc,awmpc.org,All World Mission Prayer Center,World Mission Prayer Center,prayer,mission" />
  <meta name="theme-color" content="#EDE0BB" id="metaThemeColor">
  <meta name="color-scheme" content="light dark">
  <style>
    /* --- Reset & Base --- */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html {
      overflow-x: hidden;          /* hard stop: no horizontal scroll */
    }
    body {
      background-color: #EDE0BB;
      color: #212121;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      overflow-x: hidden;
      overflow-wrap: break-word;   /* wrap long URLs/strings globally */
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

    /* --- Top banner (One UI focus block) --- */
    .site-banner {
      text-align: center;
      padding: 12px 0;
      background-color: #BDA58B;
      border-radius: 26px;
      margin: 12px 0;
      box-shadow:
        0 1px 3px rgba(0,0,0,0.08),
        0 4px 12px rgba(0,0,0,0.10);
      overflow: hidden;
    }
    .site-banner img {
      max-width: 88%;
      height: auto;
    }

    /* --- Top row: info bar + action buttons --- */
    .site-top-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 12px 0;
    }

    /* --- Info bar (service times) — Google Play split pill --- */
    .site-info-bar {
      display: flex;
      align-items: stretch;
      flex: 1;
      min-width: 0;
      gap: 3px;
    }
    .info-bar-text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      background: #CC0000;
      color: #fff;
      text-align: center;
      padding: 10px 16px;
      font-size: 14px;
      border-radius: 26px 6px 6px 26px;
      box-shadow:
        0 1px 3px rgba(0,0,0,0.08),
        0 4px 12px rgba(0,0,0,0.10);
      transition: background-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease;
    }
    .info-bar-scroll {
      display: inline-block;
      white-space: nowrap;
    }
    .info-bar-webex {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 48px;
      background: #CC0000;
      border: none;
      border-radius: 6px 26px 26px 6px;
      color: #fff;
      text-decoration: none;
      cursor: pointer;
      box-shadow:
        0 1px 3px rgba(0,0,0,0.08),
        0 4px 12px rgba(0,0,0,0.10);
      transition: background-color 0.15s, box-shadow 0.5s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .info-bar-webex:hover { background: #A80000; }
    .info-bar-webex:active { background: #900000; }
    .info-bar-webex img {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      box-shadow: none;
      margin: 0;
    }

    /* --- Top row icon buttons (One UI contained, circular) --- */
    .site-top-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: #212121;
      color: #fff;
      cursor: pointer;
      text-decoration: none;
      box-shadow:
        0 1px 3px rgba(0,0,0,0.08),
        0 4px 12px rgba(0,0,0,0.10);
      transition: background-color 0.15s, box-shadow 0.5s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .site-top-btn:hover { background: #333; }
    .site-top-btn:active { background: #444; }
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
      width: 18px;
      height: 18px;
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

    /* --- Main banner GIF (One UI card) --- */
    .site-main-banner {
      text-align: center;
      overflow: hidden;
      border-radius: 16px;
      margin: 16px 0;
      box-shadow:
        0 1px 3px rgba(0,0,0,0.08),
        0 4px 12px rgba(0,0,0,0.10);
    }
    .site-main-banner img {
      width: 100%;
      height: auto;
      display: block;
    }

    /* --- One UI media defaults inside content --- */
    .site-main img {
      border-radius: 16px;
      box-shadow:
        0 1px 2px rgba(0,0,0,0.06),
        0 4px 12px rgba(0,0,0,0.08);
      margin-bottom: 16px;
    }
    .site-main video {
      border-radius: 16px;
      box-shadow:
        0 1px 2px rgba(0,0,0,0.06),
        0 4px 12px rgba(0,0,0,0.08);
      margin-bottom: 16px;
    }

    /* --- Footer image links (One UI cards) --- */
    .footer-images {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 16px;
      padding: 16px 0;
    }
    .footer-images a {
      display: block;
      flex: 0 1 150px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow:
        0 1px 2px rgba(0,0,0,0.06),
        0 4px 12px rgba(0,0,0,0.08);
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .footer-images a:hover {
      box-shadow:
        0 2px 4px rgba(0,0,0,0.10),
        0 8px 20px rgba(0,0,0,0.14);
      transform: translateY(-2px);
    }
    .footer-images img {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 0;       /* parent handles radius via overflow:hidden */
      box-shadow: none;        /* parent handles shadow */
      margin-bottom: 0;
    }

    /* --- Content area (single column) --- */
    .site-content {
      padding: 16px 0;
    }

    /* Main content column */
    .site-main {
      min-width: 0;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }

    /* --- SPA loading bar (One UI style) --- */
    .spa-loader {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: #CC0000;
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

    /* --- Footer --- */
    .site-footer-divider { border: 0; border-top: 1px solid #999; margin: 16px 0; transition: border-color 0.5s ease; }
    .site-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 0 24px;
      font-size: 13px;
      transition: color 0.5s ease;
    }
    .site-footer a { color: #212121; transition: color 0.5s ease; }
    .footer-left   { flex: 1; min-width: 160px; }
    .footer-center { flex: 2; min-width: 200px; text-align: center; font-family: Arial, sans-serif; font-size: 15px; }
    .footer-right  { flex: 1; min-width: 200px; text-align: right; }
    .footer-right a { display: block; margin-bottom: 2px; }

    /* --- One UI FAB (Floating Action Button) --- */
    .fab-scrim {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.42);
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
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        0 1px 3px rgba(0,0,0,0.10),
        0 6px 20px rgba(0,0,0,0.14);
      transition:
        box-shadow 0.35s cubic-bezier(0.22, 0.61, 0.36, 1),
        background-color 0.5s ease;
      -webkit-tap-highlight-color: transparent;
      outline: none;
    }
    .fab-btn:hover {
      box-shadow:
        0 2px 6px rgba(0,0,0,0.14),
        0 10px 28px rgba(0,0,0,0.18);
    }
    .fab-btn:active {
      background: #f5f5f5;
    }
    .fab-btn.open {
      box-shadow:
        0 1px 3px rgba(0,0,0,0.10),
        0 6px 20px rgba(0,0,0,0.14),
        0 0 0 2.5px rgba(204, 0, 0, 0.3);
    }
    .fab-btn.open:active {
      background: #f5f5f5;
    }

    /* Latin cross icon */
    .fab-icon {
      width: 26px;
      height: 32px;
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
      background: #CC0000;
      transition: background-color 0.5s ease;
    }
    /* Vertical bar — full height */
    .fab-icon::before {
      width: 5px;
      height: 100%;
      left: 50%;
      top: 0;
      transform: translateX(-50%);
    }
    /* Horizontal bar — positioned slightly below upper third */
    .fab-icon::after {
      width: 20px;
      height: 5px;
      top: 36%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    /* Expanded menu sheet */
    .fab-menu {
      position: fixed;
      bottom: 92px;
      right: 24px;
      z-index: 9999;
      background: #fff;
      border-radius: 26px;
      box-shadow:
        0 2px 8px rgba(0,0,0,0.08),
        0 12px 40px rgba(0,0,0,0.18);
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
        transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1),
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
      color: #1a1a1a;
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
      background: #f2f2f2;
    }
    .fab-menu-item:active {
      background: #e5e5e5;
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
      color: #666;
      font-weight: 400;
      margin-left: auto;
      padding-left: 12px;
      white-space: nowrap;
    }
    .fab-menu-item.fab-active {
      background: rgba(204, 0, 0, 0.08);
      color: #CC0000;
      font-weight: 600;
    }
    .fab-menu-item.fab-active .fab-item-zh {
      color: #CC0000;
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

    /* --- One UI Bottom Sheet for small screens --- */
    @media (max-width: 600px) {
      .fab-menu {
        bottom: 0;
        right: 0;
        left: 0;
        border-radius: 26px 26px 0 0;
        min-width: unset;
        max-height: 70dvh;
        transform: translateY(100%);
        transform-origin: bottom center;
        padding: 8px 16px;
        padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
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

    /* === Dark mode: deep night blue + starry yellow === */
    body.dark-mode {
      background-color: #0D1B2A;
      color: #FFD54F;
    }
    body.dark-mode .info-bar-text {
      background: #4A3768;
      color: #FFD54F;
      box-shadow: 0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.30);
    }
    body.dark-mode .info-bar-webex {
      background: #4A3768;
      box-shadow: 0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.30);
    }
    body.dark-mode .info-bar-webex:hover { background: #5A4878; }
    body.dark-mode .info-bar-webex:active { background: #3D2D5C; }
    body.dark-mode .site-top-btn {
      background: #1E3450;
    }
    body.dark-mode .site-top-btn:hover { background: #2A4565; }
    body.dark-mode .site-top-btn:active { background: #345575; }
    body.dark-mode .site-main-banner {
      box-shadow: 0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.30);
    }
    body.dark-mode .site-main img,
    body.dark-mode .site-main video {
      box-shadow: 0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.30);
    }
    body.dark-mode .footer-images a {
      box-shadow: 0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.30);
    }
    body.dark-mode .site-footer-divider { border-top-color: #2A4060; }
    body.dark-mode .site-footer { color: #C8A840; }
    body.dark-mode .site-footer a { color: #FFD54F; }
    body.dark-mode .spa-loader { background: #FFD54F; }

    /* FAB — cross becomes white-on-red */
    body.dark-mode .fab-btn {
      background: #CC0000;
      box-shadow: 0 1px 3px rgba(0,0,0,0.25), 0 6px 20px rgba(0,0,0,0.35);
    }
    body.dark-mode .fab-btn:active { background: #A80000; }
    body.dark-mode .fab-btn.open {
      box-shadow: 0 1px 3px rgba(0,0,0,0.25), 0 6px 20px rgba(0,0,0,0.35),
                  0 0 0 2.5px rgba(255,255,255,0.30);
    }
    body.dark-mode .fab-icon::before,
    body.dark-mode .fab-icon::after { background: #fff; }

    /* FAB menu sheet */
    body.dark-mode .fab-menu {
      background: #152238;
      box-shadow: 0 2px 8px rgba(0,0,0,0.30), 0 12px 40px rgba(0,0,0,0.40);
    }
    body.dark-mode .fab-menu::before { background: #3A5068; }
    body.dark-mode .fab-menu::-webkit-scrollbar-thumb { background: #3A5068; }
    body.dark-mode .fab-menu-item { color: #FFD54F; }
    body.dark-mode .fab-menu-item:hover { background: #1E3450; }
    body.dark-mode .fab-menu-item:active { background: #2A4565; }
    body.dark-mode .fab-menu-item .fab-item-zh { color: #C8A840; }
    body.dark-mode .fab-menu-item.fab-active {
      background: rgba(255, 213, 79, 0.12);
      color: #FFD54F;
    }
    body.dark-mode .fab-menu-item.fab-active .fab-item-zh { color: #FFD54F; }
    body.dark-mode .fab-scrim { background: rgba(0, 0, 0, 0.65); }
  </style>
</head>

<body>
<script>(function(){var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches);if(d){document.body.classList.add('dark-mode');var m=document.getElementById('metaThemeColor');if(m)m.setAttribute('content','#0D1B2A')}})()</script>

<div class="site-wrap">

  <!-- Service times + action buttons — topmost row -->
  <div class="site-top-row">
    <div class="site-info-bar">
      <div class="info-bar-text">
        <span class="info-bar-scroll">全年無休 | 晨禱禮拜：6:30am - 8:00am | 晚禱禮拜：8:00pm - 9:00pm | 主日崇拜 周日：10:00am 開始</span>
      </div>
      <a class="info-bar-webex" href="https://allworldmissionprayercenterinc-321.my.webex.com/meet/awmpc" target="_blank" rel="noopener" aria-label="Join Webex">
        <img src="https://www.google.com/s2/favicons?domain=webex.com&sz=32" alt="Webex" />
      </a>
    </div>
    <button class="site-top-btn" id="themeToggle" type="button" aria-label="Toggle dark mode">
      <div class="theme-icon-flip">
        <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </div>
    </button>
  </div>

  <!-- Top banner -->
  <div class="site-banner">
    <img src="./resources/images/wmpc_topbanner_transparent.png" alt="All World Mission Prayer Center" />
  </div>

  <!-- Main banner image -->
  <div class="site-main-banner">
    <img src="./webData/components/wmpc_mainbanner2.gif" alt="AWMPC Church Banner" />
  </div>

  <!-- Page content -->
  <div class="site-content">

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

      $menuItem = $_GET["page"];
      $fname = $files[$menuItem];
      $file = fopen($fname, "r") or exit("Unable to open file!");
      while (!feof($file)) {
        echo fgets($file);
      }
      fclose($file);
      ?>

    </main>

  </div>

  <!-- Quick links (former sidebar images) -->
  <div class="footer-images">
    <a href="./24hrhop.html"><img src="./resources/images/building_front_compressed_09_05_2020_mini.jpg" alt="Church Building" loading="lazy" /></a>
    <a href="./prayer.html"><img src="./webData/components/adwindow_prayermeeting.jpg" alt="Prayer Meeting" loading="lazy" /></a>
    <a href="./sermons.html"><img src="./webData/components/adwindow_dailysermon.jpg" alt="Daily Sermon" loading="lazy" /></a>
    <a href="./request.html"><img src="./webData/components/adwindow_prayerrequest.jpg" alt="Prayer Request" loading="lazy" /></a>
    <a href="./mission.html"><img src="./resources/images/sidebar_mission.jpg" alt="Mission" loading="lazy" /></a>
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

<!-- Theme toggle -->
<script>
(function() {
  var btn = document.getElementById('themeToggle');
  var metaTC = document.getElementById('metaThemeColor');

  function applyTheme(dark) {
    document.body.classList.toggle('dark-mode', dark);
    if (metaTC) metaTC.setAttribute('content', dark ? '#0D1B2A' : '#EDE0BB');
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

<!-- One UI FAB Navigation -->
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

<button class="fab-btn" id="fabBtn" aria-label="Open navigation menu" aria-expanded="false">
  <div class="fab-icon"></div>
</button>

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

  var mainEl = document.querySelector('.site-main');
  var loader = document.getElementById('spaLoader');
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
  function navigate(fragmentFile, displayUrl, pushState) {
    loaderStart();

    var done = function(html) {
      mainEl.innerHTML = html;
      runScripts(mainEl);

      if (pushState && displayUrl) {
        history.pushState({ fragment: fragmentFile }, '', displayUrl);
      }

      // Smooth momentum scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Update active page indicator in FAB
      updateActiveNav(routeKey(displayUrl || window.location.href));

      loaderDone();
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
