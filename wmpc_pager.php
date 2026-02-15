<!DOCTYPE html>
<html lang="en">

<head>
  <title>All World Mission Prayer Center - 信望愛禱告中心</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="keywords" content="awmpc,wmpc,awmpc.org,All World Mission Prayer Center,World Mission Prayer Center,prayer,mission" />
  <meta name="theme-color" content="#e3d5aa">
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

    /* --- Top banner --- */
    .site-banner {
      text-align: center;
      padding: 8px 0;
      background-color: #BDA58B;
    }
    .site-banner img {
      max-width: 100%;
      height: auto;
    }

    /* --- Nav bar --- */
    .site-nav {
      background: #CC0000;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 2px;
      padding: 4px 0;
    }
    .site-nav a {
      color: #fff;
      text-decoration: none;
      text-align: center;
      padding: 6px 10px;
      font-size: 14px;
      line-height: 1.3;
      border-radius: 3px;
      transition: background 0.15s;
    }
    .site-nav a:hover { background: rgba(255,255,255,0.15); }
    .site-nav a.highlight { color: #FFFF00; font-weight: bold; }

    /* --- Main banner GIF --- */
    .site-main-banner {
      text-align: center;
      overflow: hidden;
    }
    .site-main-banner img {
      width: 100%;
      height: auto;
      display: block;
    }

    /* --- Info bar (service times) --- */
    .site-info-bar {
      background: #CC0000;
      color: #fff;
      text-align: center;
      padding: 8px 12px;
      font-size: 14px;
    }

    /* --- Content area: sidebar + main --- */
    .site-content {
      display: flex;
      gap: 16px;
      padding: 16px 0;
      align-items: flex-start;
    }

    /* Sidebar */
    .site-sidebar {
      flex: 0 0 185px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .site-sidebar a { display: block; }
    .site-sidebar img {
      width: 100%;
      height: auto;
      display: block;
      border: 0;
    }

    /* Main content column */
    .site-main {
      flex: 1;
      min-width: 0;       /* allow flex child to shrink below content size */
      overflow-wrap: break-word;
      word-wrap: break-word;
    }

    /* --- Footer --- */
    .site-footer-divider { border: 0; border-top: 1px solid #999; margin: 16px 0; }
    .site-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 0 24px;
      font-size: 13px;
    }
    .site-footer a { color: #212121; }
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
      border-radius: 16px;
      border: none;
      background: #CC0000;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        0 1px 3px rgba(0,0,0,0.12),
        0 6px 16px rgba(0,0,0,0.16);
      transition:
        background 0.2s,
        box-shadow 0.2s,
        border-radius 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
      -webkit-tap-highlight-color: transparent;
      outline: none;
    }
    .fab-btn:hover {
      box-shadow:
        0 2px 6px rgba(0,0,0,0.16),
        0 10px 24px rgba(0,0,0,0.20);
    }
    .fab-btn:active {
      background: #A80000;
    }
    .fab-btn.open {
      border-radius: 50%;
      background: #333;
    }
    .fab-btn.open:active {
      background: #555;
    }

    /* Hamburger → X icon morph */
    .fab-icon {
      width: 22px;
      height: 18px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .fab-icon span {
      display: block;
      height: 2px;
      width: 100%;
      background: #fff;
      border-radius: 2px;
      transition:
        transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1),
        opacity 0.2s;
      transform-origin: center;
    }
    .fab-btn.open .fab-icon span:nth-child(1) {
      transform: translateY(8px) rotate(45deg);
    }
    .fab-btn.open .fab-icon span:nth-child(2) {
      opacity: 0;
    }
    .fab-btn.open .fab-icon span:nth-child(3) {
      transform: translateY(-8px) rotate(-45deg);
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
        opacity 0.25s cubic-bezier(0.33, 0, 0.67, 1);
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
      transition: background 0.15s;
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
    .fab-menu-item.fab-highlight {
      color: #CC0000;
      font-weight: 700;
    }
    .fab-menu-item.fab-highlight .fab-item-zh {
      color: #CC0000;
    }

    /* --- Responsive --- */
    @media (max-width: 768px) {
      .site-content {
        flex-direction: column;
      }
      .site-sidebar {
        flex: none;
        width: 100%;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
      }
      .site-sidebar a {
        width: 100px;
      }
      .site-nav a {
        font-size: 12px;
        padding: 5px 6px;
      }
      .site-info-bar { font-size: 12px; word-break: keep-all; }
      table { table-layout: auto; }
      td, th { width: auto !important; }
      .site-footer {
        flex-direction: column;
        text-align: center;
      }
      .footer-left, .footer-center, .footer-right { text-align: center; }
    }
  </style>
</head>

<body>

<div class="site-wrap">

  <!-- Top banner -->
  <div class="site-banner">
    <img src="./resources/images/wmpc_topbanner_transparent.png" alt="All World Mission Prayer Center" />
  </div>

  <!-- Navigation -->
  <nav class="site-nav">
    <a href="./index.html">首頁<br>Homepage</a>
    <a href="./mission.html">使命<br>Mission</a>
    <a href="./sermons.html">講道<br>Sermons</a>
    <a href="./testimony.html">見證<br>Testimony</a>
    <a href="./request.html">代禱<br>Prayers</a>
    <a href="./24hrhop.html">建堂<br>Church</a>
    <a class="highlight" href="./support.html">支持<br>Donations</a>
    <a href="./media.html">媒體<br>Media</a>
    <a href="./letters.html">信件<br>Letters</a>
    <a href="./canaan_record.html">历史<br>Canaan</a>
    <a href="./hymns.html">讚美詩<br>Hymns</a>
  </nav>

  <!-- Main banner image -->
  <div class="site-main-banner">
    <img src="./webData/components/wmpc_mainbanner2.gif" alt="AWMPC Church Banner" />
  </div>

  <!-- Service times -->
  <div class="site-info-bar">
    全年無休 | 晨禱禮拜：6:30am - 8:00am | 晚禱禮拜：8:00pm - 9:00pm | 主日崇拜 周日：10:00am 開始
  </div>

  <!-- Sidebar + Page content -->
  <div class="site-content">

    <aside class="site-sidebar">
      <a href="https://allworldmissionprayercenterinc-321.my.webex.com/meet/awmpc"><img src="./resources/images/awmpc_webex_join_banner.png" alt="AWMPC Webex Join Banner" /></a>
      <a href="https://info.flagcounter.com/u2K3"><img src="https://s11.flagcounter.com/count2/u2K3/bg_FFFFFF/txt_000000/border_CCCCCC/columns_2/maxflags_10/viewers_0/labels_0/pageviews_0/flags_0/percent_0/" alt="Flag Counter" loading="lazy" /></a>
      <div><script type="text/javascript" src="https://rf.revolvermaps.com/0/0/2.js?i=536ikush1dr&amp;m=7&amp;s=178&amp;c=ff0000&amp;t=1" async="async"></script></div>
      <a href="./24hrhop.html"><img src="./resources/images/building_front_compressed_09_05_2020_mini.jpg" alt="Church Building" /></a>
      <a href="./prayer.html"><img src="./webData/components/adwindow_prayermeeting.jpg" alt="Prayer Meeting" /></a>
      <a href="./sermons.html"><img src="./webData/components/adwindow_dailysermon.jpg" alt="Daily Sermon" /></a>
      <a href="./request.html"><img src="./webData/components/adwindow_prayerrequest.jpg" alt="Prayer Request" /></a>
      <a href="./mission.html"><img src="./resources/images/sidebar_mission.jpg" alt="Mission" /></a>
    </aside>

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
      $files['hymns']            = "hymns.html";

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

<!-- One UI FAB Navigation -->
<div class="fab-scrim" id="fabScrim"></div>

<nav class="fab-menu" id="fabMenu" aria-label="Quick navigation">
  <a class="fab-menu-item" href="./index.html">Homepage <span class="fab-item-zh">首頁</span></a>
  <a class="fab-menu-item" href="./mission.html">Mission <span class="fab-item-zh">使命</span></a>
  <a class="fab-menu-item" href="./sermons.html">Sermons <span class="fab-item-zh">講道</span></a>
  <a class="fab-menu-item" href="./testimony.html">Testimony <span class="fab-item-zh">見證</span></a>
  <a class="fab-menu-item" href="./request.html">Prayers <span class="fab-item-zh">代禱</span></a>
  <a class="fab-menu-item" href="./24hrhop.html">Church <span class="fab-item-zh">建堂</span></a>
  <a class="fab-menu-item fab-highlight" href="./support.html">Donations <span class="fab-item-zh">支持</span></a>
  <a class="fab-menu-item" href="./media.html">Media <span class="fab-item-zh">媒體</span></a>
  <a class="fab-menu-item" href="./letters.html">Letters <span class="fab-item-zh">信件</span></a>
  <a class="fab-menu-item" href="./canaan_record.html">Canaan <span class="fab-item-zh">历史</span></a>
  <a class="fab-menu-item" href="./hymns.html">Hymns <span class="fab-item-zh">讚美詩</span></a>
</nav>

<button class="fab-btn" id="fabBtn" aria-label="Open navigation menu" aria-expanded="false">
  <div class="fab-icon">
    <span></span>
    <span></span>
    <span></span>
  </div>
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

    // Prevent background scroll while keeping scrollbar visible (no layout shift)
    if (isOpen) {
      document.body.style.overflowY = 'scroll';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '-' + window.scrollY + 'px';
    } else {
      var scrollY = Math.abs(parseInt(document.body.style.top || '0'));
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.overflowY = '';
      window.scrollTo(0, scrollY);
    }
  }

  function close() {
    if (isOpen) toggle();
  }

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    toggle();
  });

  scrim.addEventListener('click', close);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') close();
  });
})();
</script>

</body>
</html>
