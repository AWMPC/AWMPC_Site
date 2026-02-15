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
    body {
      background-color: #EDE0BB;
      color: #212121;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 16px;
      line-height: 1.5;
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
      background-color: #CC0000;
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
      .site-info-bar { font-size: 12px; }
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
    全年無休 &nbsp;&nbsp;|&nbsp;&nbsp; 晨禱禮拜：6:30am - 8:00am &nbsp;&nbsp;|&nbsp;&nbsp; 晚禱禮拜：8:00pm - 9:00pm &nbsp;&nbsp;|&nbsp;&nbsp; 主日崇拜 周日：10:00am 開始
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

</body>
</html>
