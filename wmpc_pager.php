<html>

<head>
  <title>All World Mission Prayer Center - 信望愛禱告中心 </title>
  <meta name="keywords" content="awmpc,wmpc,awmpc.org,All World Mission Prayer Center,World Mission Prayer Center,prayer,mission" />
  <meta http-equiv="content-type" content="text/html;charset=utf-8" />
  <meta name="theme-color" content="#e3d5aa">
  <style>
    body {
      text-align: center;
    }

    img.ad {
      width: 185;
      border: 0;
      /* DEPRECATED - hspace, vspace */
      /* hspace: 6;
      vspace: 3; */
    }

    img.mi {
      height: 21;
      border: 0;
    }
  </style>
</head>

<!-- Full site background color HEX -->
<body bgcolor="#EDE0BB" text="#212121">

  <table width="1000" border="0" cellpadding="3" cellspacing="1">
    <!-- 
<caption><h2>AWMPC Template<h2></caption>
-->

    <!-- Table contents -->
    <tr>
      <!-- top banner -->
      <td colspan="10"><img src="./resources/images/wmpc_topbanner_transparent.png" height="110" width="1000" border="0" hspace="0" /></td>
    </tr>

    <tr bgcolor="#CC0000" align="center">
      <!-- menu items -->
      <td width="5%"><a href="./index.html"><span style='color:#FFFFFF'>&#39318;&#38913;<br />Homepage</span></a></td>
      <td width="5%"><a href="./mission.html"><span style='color:#FFFFFF'>&#20351;&#21629;<br />Mission</span></a></td>
      <td width="5%"><a href="./sermons.html"><span style='color:#FFFFFF'>&#35611;&#36947;<br />Sermons</span></a></td>
      <td width="5%"><a href="./testimony.html"><span style='color:#FFFFFF'>&#35211;&#35657;<br />Testimony</span></a></td>
      <td width="5%"><a href="./request.html"><span style='color:#FFFFFF'>&#20195;&#31153;<br />Prayers</span></a></td>
      <td width="5%"><a href="./24hrhop.html"><span style='color:#FFFF00'>&#24314;&#22530;<br />Church</span></a></td>
      <td width="5%"><a href="./support.html"><span style='color:#FFFFFF'>&#25903;&#25345;<br />Donations</span></a></td>
      <td width="5%"><a href="./media.html"><span style='color:#FFFF00'>&#23186;&#39636;<br />Media</span></a></td>
      <!--<td width="100"><a href="./wmpc_pager.php?page=mi_contact"><span style='color:#FFFFFF'>&#32879;&#32363;</span></a></td>-->
      <td width="5%"><a href="./letters.html"><span style='color:#FFFFFF'>&#20449;&#20214;<br />Letters</span></a></td>
      <td width="5%"><a href="./canaan_record.html"><span style='color:FFFFFF'>历史<br />Canaan</span></a></td>
      <td width="5%"><a href="./hymns.html"><span style='color:FFFFFF'>讚美詩<br />Hymns</span></a></td>
      <!-- sermons on revelation
<td width="100"><a href="./wmpc_pager.php?page=mi_talk"><span style='color:#FFFFFF'>&#21855;&#31034;&#37636;</span></a></td>
-->
      <!-- <td width="100">&nbsp;</td> -->
    </tr>

    <tr>
      <!-- church picture -->
      <!-- <td colspan="10"><video autoplay loop muted playsinline height="213" width="1000">
  <source src="./resources/videos/wmpc_mainbanner2.webm" type="video/webm">
</video></td> -->
      <td colspan="10"><img src="./webData/components/wmpc_mainbanner2.gif" height="213" width="1000" border="0" hspace="0" /></td>
    </tr>

    <tr bgcolor="#CC0000" align="center">
      <td colspan="10"><span style='color:#FFFFFF'>
          全年無休 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;晨禱禮拜﹕6:30am - 8:00am &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;晚禱禮拜﹕8:00pm - 9:00pm &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 主日崇拜 周日：10:00am 開始
        </span></td>
    </tr>

    <tr>
      <!-- blank cells -->
      <td colspan="10">&nbsp;</td>
    </tr>

    <tr valign="top">
      <!-- ad windows -->

      <!--<td colspan="2" align="left">-->

      <?php

      $adBar = $_GET["page"];
      if ($adBar == 'mi_home') {
        echo <<<END
<td colspan="10">
		
END;
      } else {
        echo <<<END
		
<td colspan="2" align="left">

<a href="./24hrhop.html">
    <img class="ad" src="./resources/images/building_front_compressed_09_05_2020_mini.jpg" />
</a>
<br>
<br>

<a href="./prayer.html"><img class="ad" src="./webData/components/adwindow_prayermeeting.jpg" /></a>
<br>
<br>

<a href="./sermons.html"><img src="./webData/components/adwindow_dailysermon.jpg" border="0" class="ad" /></a>
<br>
<br>

<a href="./request.html"><img class="ad" src="./webData/components/adwindow_prayerrequest.jpg" /></a>
<br>
<br>

<a href="./mission.html">
    <img class="ad" src="./resources/images/sidebar_mission.jpg" />
</a>
<br>
<br>

</td>

<td colspan="8" rowspan="1">

END;
      }


      ?>

      <!--<td colspan="8" rowspan="1">-->

      <!-- page text begin -->

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
      // $files['mi_talk']          = "wmpc_s_specialtopic.html";
      $files['mi_taiwan']        = "wmpc_s_taiwan040809.html";
      // $files['mi_usrevival']     = "wmpc_s_events_revival200811.html";
      $files['mi_letters']       = "wmpc_s_letters.html";
      $files['mi_canaan_record'] = "canaan_chapel_record.html";
      $files['hymns']            = "hymns.html";

      $menuItem = $_GET["page"];
      $fname = $files[$menuItem];
      $file = fopen($fname, "r") or exit("Unable to open file!");
      //Output a line of the file until the end is reached
      while (!feof($file)) {
        echo fgets($file);
      }
      fclose($file);

      echo '</td>';
      ?>

      <!-- page text end -->
    </tr>

    <tr>
      <!-- blank cells -->
      <td colspan="10">
        <br>
        <hr><br>
      </td>
    </tr>

    <tr>
      <!-- counter info -->
      <td colspan="2" align="left">
        <!-- <img src="/cgi-sys/Count.cgi?df=awmpcorg.dat|display=Counter|ft=1|md=7|frgb=204;187;153|dd=B"> -->
        <br>
        <a href="https://info.flagcounter.com/u2K3"><img src="https://s11.flagcounter.com/count2/u2K3/bg_FFFFFF/txt_000000/border_CCCCCC/columns_2/maxflags_10/viewers_0/labels_0/pageviews_0/flags_0/percent_0/" alt="Flag Counter" border="0"></a>
        <script type="text/javascript" src="https://rf.revolvermaps.com/0/0/2.js?i=536ikush1dr&amp;m=7&amp;s=178&amp;c=ff0000&amp;t=1" async="async"></script>
        <!-- copyright info -->
        <!-- TODO: need to attain new copyright for 2020 here. -->
        <font size="-2" color="#5A4409;">2016&copy;awmpc.org</font>
      </td>

      <!-- address information -->
      <td colspan="5" align="center">
        <span style='font-family:"arial";font-size:"18"'>
          1189 S. De Anza Blvd.
          <br>
          San Jose, CA 95129
          <br>
          <!-- (408) 910-0073 who is this? -->
          Jay : (415) - 816 - 7873
          <br>
          Joanna : (650) - 504 - 4901
        </span>
      </td>

      <td colspan="4" align="right">
        <a href="https://awmpc.org/awmpc_tocau.html">Terms of Conditions and Use</a>
        <br>
        <a href="https://awmpc.org/awmpc_privacy.html">Privacy Policy</a>
        <br>
        <a href="https://awmpc.org/awmpc_refunds.html">Donations and Refunds Policy</a>
        <br>
        <a href="https://www.ssllabs.com/ssltest/analyze.html?d=awmpc.org">Qualys SSL Security Scan</a>
        <br>
        <a href="https://developers.google.com/speed/pagespeed/insights/?url=awmpc.org&tab=mobile">Google Lighthouse Performance Scan</a>
      </td>

    </tr>

  </table>


</body>

</html>
