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

    /* --- Info bar (service times) — topmost --- */
    .site-info-bar {
      background: #CC0000;
      color: #fff;
      text-align: center;
      padding: 8px 12px;
      font-size: 14px;
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
        box-shadow 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
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
      width: 22px;
      height: 28px;
      position: relative;
      transition: transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
    }
    .fab-btn.open .fab-icon {
      transform: rotate(360deg);
    }
    .fab-icon::before,
    .fab-icon::after {
      content: '';
      position: absolute;
      background: #CC0000;
      border-radius: 1.5px;
    }
    /* Vertical bar — full height */
    .fab-icon::before {
      width: 3.5px;
      height: 100%;
      left: 50%;
      top: 0;
      transform: translateX(-50%);
    }
    /* Horizontal bar — shorter, positioned at upper third */
    .fab-icon::after {
      width: 16px;
      height: 3.5px;
      top: 28%;
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
    .fab-menu-item.fab-active {
      background: rgba(204, 0, 0, 0.08);
      color: #CC0000;
      font-weight: 600;
    }
    .fab-menu-item.fab-active .fab-item-zh {
      color: #CC0000;
    }
    .fab-item-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      border-radius: 4px;
    }

    /* --- Responsive --- */
    @media (max-width: 768px) {
      .site-info-bar { font-size: 12px; word-break: keep-all; }
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
        padding-bottom: max(24px, env(safe-area-inset-bottom));
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2px;
      }
      .fab-menu::before {
        content: '';
        display: block;
        width: 40px;
        height: 4px;
        background: #ddd;
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
      .fab-menu-webex {
        grid-column: 1 / -1;
      }
    }
  </style>
</head>

<body>

<div class="site-wrap">

  <!-- Service times — topmost -->
  <div class="site-info-bar">
    全年無休 | 晨禱禮拜：6:30am - 8:00am | 晚禱禮拜：8:00pm - 9:00pm | 主日崇拜 周日：10:00am 開始
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

<!-- SPA loading bar -->
<div class="spa-loader" id="spaLoader"></div>

<!-- One UI FAB Navigation -->
<div class="fab-scrim" id="fabScrim"></div>

<nav class="fab-menu" id="fabMenu" aria-label="Quick navigation">
  <a class="fab-menu-item fab-menu-webex" href="https://allworldmissionprayercenterinc-321.my.webex.com/meet/awmpc" target="_blank" rel="noopener"><img class="fab-item-icon" src="https://www.google.com/s2/favicons?domain=webex.com&sz=32" alt="" width="20" height="20" />Join Webex</a>
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

    // Prevent background scroll — compensate scrollbar width to avoid layout shift
    if (isOpen) {
      var sbw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = sbw + 'px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
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
