---
sidebar_position: 2
---

# FLOWER Ad Agent

| **Version** | **Date** | **Description** |
| ---| ---| --- |
| 3.9.21 | Nov 04, 2024 | **New** <ol><li>Support mid-roll ads</li></ol> |
| 3.9.17 | Oct 10, 2024 | **New** <ol><li>Improved programmatic features.<ol><li>Added fallback call feature for unused ad response time.</li></ol></li><li>Android OS 14 support.</li></ol> **BugFix** <ol><li>Ensure log server timeout as “timeout” for Google timeout</li><li>Fixed playback errors caused by ad response timing ended before programmatic ad request timeout.</li></ol> |
| 3.9.5 | Dec 21, 2023 | **BugFix** <ol><li>Ensure programmatic ad requests are made.</li><li>Calculate playback time correctly when adding a playlist.</li><li>Prevent concurrency errors of not being able to create a playlist when adding it.</li></ol> |
| 3.9.4 | Aug 10, 2023 | **New** <ol><li>Playlist support for you to create and manage playlists.</li><li>Support AD Trigger feature.</li><li>Support OMA Update to update your app seamlessly.</li></ol> **Feature** <ol><li>Calculate remaining time accurately when adding a playlist.</li><li>Include area information in programmatic ad creative review requests.</li><li>Allow additional plays of programmatic ads.</li></ol> **BugFix** <ol><li>Correct programmatic ad tracking log transmission time.</li><li>Fixed an issue where ad playlist configuration completed before the programmatic ad response had arrived.</li><li>Prevent occasional missed calls to the programmatic ad tracking log.</li><li>Display watermarks on kids channels.</li><li>Prevent intermittent exceptions when reporting programmatic ad exposure.</li><li>Ensure `playTime` value accuracy in programmatic ad exposure reports.</li><li>Add playlists before ad ends, not after.</li><li>Retry fallback when there is no programmatic ad response.</li><li>Correctly replace macro values in programmatic ad request URLs.</li><li>Include exposure logs for duplicate ads.</li></ol> |
| 3.9.3 | Dec 28, 2022 | **Feature** <ol><li>Switched from file copy to permission-based sharing for improved OS12 support.</li><li>Changed programmatic ad server logging from synchronous to asynchronous processing.</li></ol> **BugFix** <ol><li>Fixed an issue where ad information was incorrectly uploaded in exposure logs for the same programmatic ad creative.</li></ol> |
| 3.9.2 | Oct 14, 2022 | **Feature** <ol><li>Improved the cue method to download programmatic ad creatives one at a time.</li><li>Improved the playlist method to use even locally cached ads as the first ad in new playlists.</li></ol> **BugFix** <ol><li>Fixed an issue with the programmatic ad request cycle where requests were made at monitoring cycle not at programmatic ad request cycle with empty responses for programmatic ad requests.</li><li>Fixed an issue where exposure logs were incorrectly uploaded after an ad error.</li></ol> |
| 3.9.1 | Jul 12, 2022 | **New** <ol><li>Added feature to download programmatic ad creatives during ad playback.</li></ol> **Feature** <ol><li>Pass SDK version as a parameter in authentication.</li><li>Add incomplete programmatic ads to the playlist when OnCue.</li><li>Prioritize the first ad as internal.</li><li>Overwrite existing programmatic ad creatives with new downloads.</li><li>Use MaxLazyDownloadBandwidth that is received in the authentication response to control the download speed of programmatic ads.</li><li>Delete excess cache files after authentication.</li></ol> |
| 3.9.0 | Mar 17, 2022 | **Feature** <ol><li>Programmatic ad: Added `onCue` feature support.</li><li>Programmatic ad: Added streaming playback support.</li><li>Multi-Google ads support.</li></ol> |
| 3.8.4 | Nov 08, 2021 | **BugFix** <ol><li>IP lookup table: Fixed an update issue when the server IP changes.</li><li>TLS communication: Fixed a failure due to TLS error.</li></ol> |
| 3.8.0 | Aug 27, 2021 | **New** <ol><li>Google Ads support.</li><li>Digital Cue (SCTE-35) support.</li><li>Programmatic ad support.</li></ol> |

*   **New** : New features
*   **Feature** : Changes to existing features
*   **BugFix** : Error fixed
