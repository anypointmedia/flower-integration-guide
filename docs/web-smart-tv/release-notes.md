---
sidebar_position: 100
sidebar_label: Release Notes
---

# HTML5 SDK

| **Version** | **Date** | **Changes** |
| ---| ---| --- |
| 2.3.4 | Apr 21, 2026 | **BugFix** <ol><li>Fixed XMLHttpRequest to use the original URL's query string as-is without URL encoding</li></ol> |
| 2.3.3 | Apr 15, 2026 | **Feature** <ol><li>Added Linear TV entry ad events</li><li>Renamed `onAdSkipped` to `onAdBreakSkipped` in `FlowerAdsManagerListener`</li></ol> |
| 2.3.0 | Feb 25, 2026 | **BugFix** <ol><li>Fixed a time mismatch when entering a live channel with ad marker</li><li>Fixed a time mismatch that occurred during long-duration playback</li></ol> **Feature** <ol><li>Improved performance when processing playlists with long window</li><li>Enhanced the interactive ad UI</li><li>Added QR code display when selecting “More Info” on ads in TV environments</li></ol> |
| 2.2.2 | Jan 09, 2026 | **BugFix** <ol><li>Fixed the tracking time mismatch issue.</li></ol> **Feature** <ol><li>Enhanced the logic about tracking ad</li><li>Added current time and timezone URL macros</li></ol> |
| 2.2.1 | Dec 19, 2025 | **Feature** <ol><li>Improved ad tracking when using bitmovin player.</li><li>Changed the timeout for VOD ad requests from 3 to 5 seconds.</li></ol> |
| 2.2.0 | Dec 8, 2025 | **Feature** <ol><li>Improved HLS/DASH playlist manipulation speed.</li></ol> **BugFix** <ol><li>Fixed an issue where ads would not play on Samsung TV models.</li><li>Fixed manipulation error on HLS/DASH streams.</li></ol> |
| 2.1.3 | Oct 14, 2025 | **BugFix** <ol><li>Fixed an issue where ads could not be inserted when the original playlist URL was redirected.</li></ol> |
| 2.1.2 | Aug 26, 2025 | **BugFix** <ol><li>Fixed ad insertion error in HLS playlist containing audio-only media.</li></ol> |
| 2.1.1 | Aug 21, 2025 | **Feature** <ol><li>Improved response when the original playlist response is empty on Linear TV.</li></ol> |
| 2.1.0 | July 30, 2025 | **Feature** <ol><li>Added support for playlist formats where the EXT-X-MEDIA-SEQUENCE value of HLS differs by variant</li></ol> |
| 2.0.2 | July 21, 2025 | **BugFix** <ol><li>Added support for the whitespace in the HLS playlist attribute delimiter.</li></ol> |
| 2.0.1 | July 7, 2025 | **BugFix** <ol><li>Fixed the KotlinNothingValueException error that occurred when playing VOD and interstitial ads.</li></ol> |
| 2.0.0 | June 27, 2025 | **Feature** <ol><li>Added support for the ad skipping feature in linear content playback.</li><li>Introduced `FlowerHlsjs` for easier SDK integration.</li></ol> |
| 1.3.0 | Jan 14, 2025 | **BugFix** <ol><li>Fixed an issue where the optimal creative was not always selected for each platform when playing VOD ads.</li><li>Improved VOD ad loading speed.</li><li>Improved playlist processing time when playing linear TV.</li><li>Fixed an error that occurred when a decimal value was entered in the `durationMs` parameter of the `requestVodAd()` API.</li></ol> **Feature** <ol><li>Added a pre-roll ad feature for linear TV.</li><li>Improved log level.</li></ol> |
| 1.2.17 | Nov 15, 2024 | **BugFix** <ol><li>Fixed an issue where logs were output regardless of the configured log levels.</li><li>Fixed an error that prevented streams from playing if the HLS stream URL contained unencoded special characters (e.g., slash "/").</li><li>Fixed an error that prevented streams from playing when the HLS playlist contained more segments than the SDK allowed.</li></ol> |
| 1.2.16 | Oct 21, 2024 | **BugFix** <ol><li>Fixed an issue where streams would not play when the DASH stream URL contained unencoded URL parameters.</li><li>Fixed a buffering issue that occurred when playing repeated filler ads in DASH streams.</li></ol> |
| 1.2.15 | Sep 13, 2024 | **BugFix** <ol><li>Fixed an issue where parsing HLS playlists would fail when there were unknown tags or properties.</li></ol> |
| 1.2.14 | Sep 11, 2024 | **Feature** <ol><li>Added response code, request URL, and request header to the log for all ad requests, regardless of success or failure.</li></ol> **BugFix** <ol><li>Fixed an error that occurred when parsing VAST XML containing a Wrapper URL.</li></ol> |
| 1.2.13 | Sep 06, 2024 | **BugFix** <ol><li>Fixed parsing errors in certain ad responses and creative playlist formats.</li></ol> |
| 1.2.12 | Sep 03, 2024 | **Feature** <ol><li>Included enhanced targeting data in ad requests</li></ol> |
| 1.2.11 | Aug 19, 2024 | **BugFix** <ol><li>Fixed a timing calculation error that could lead to ad requests timing out prematurely during DASH stream playback.</li></ol> |
| 1.2.10 | Aug 09, 2024 | **Feature** <ol><li>Introduced the `changeChannelExtraParams()` API, enabling the modification of targeting information during a live stream.</li></ol> |
| 1.2.9 | Jul 26, 2024 | **Feature** <ol><li>Introduced the `adTagHeaders` parameter, enabling the inclusion of custom HTTP headers during ad requests.</li><li>Introduced the `channelStreamHeaders` parameter, enabling the inclusion of custom HTTP headers during stream requests.</li></ol> **BugFix** <ol><li>Fixed an issue where stream redirection caused a black screen error.</li></ol> |
| ~~1.2.8~~<br/>Deprecated | Jul 22, 2024 | **BugFix** <ol><li>Fixed a TypeError (Illegal invocation at Node.get) that occurred when the SDK was loaded as a JavaScript module.</li></ol> |
| ~~1.2.7~~<br/>Deprecated | Jul 08, 2024 | **Feature** <ol><li>Added support for ad insertion in DRM-enabled DASH streams.</li></ol> |
| ~~1.2.6~~<br/>Deprecated | May 16, 2024 | **Feature** <ol><li>Changed the production log storage cycle.</li></ol> **BugFix** <ol><li>Added the defense logic for errors that occur in the Bitmovin player.</li><li>If the Bitmovin player is destroyed, the SDK will be reset.</li></ol> |
| ~~1.2.5~~<br/>Deprecated | Apr 26, 2024 | **Feature** <ol><li>Improved the features of linear TVs.<ol><li>Improved the feature of calculating cumulative errors of timing of ads and cues.</li><li>Use the EXT-X-PROGRAM-DATE-TIME tag in the original HLS.</li></ol></li><li>Implemented parallel processing of VAST event tracking.</li><li>Added URL macro (CACHEBUSTING).</li></ol> **BugFix** <ol><li>Fixed an error where some logs were still recorded even when logging was disabled.</li></ol> |
| ~~1.2.4~~<br/>Deprecated | Apr 15, 2024 | **Feature** <ol><li>Improved the error processing of ad requests.</li><li>Supports LG webOS’s LGUDID and Samsung Tizen’s TIFA.</li></ol> **BugFix** <ol><li>Fixed the XML parsing error that occurred in the LG webOS 4.0 version.</li><li>Fixed errors regarding the clickable UI.</li></ol> |
| ~~1.2.3~~<br/>Deprecated | Mar 26, 2024 | **BugFix** <ol><li>Fixed an issue where fillers were incorrectly tracked in consecutive ad cues.</li></ol> |
| ~~1.2.2~~<br/>Deprecated | Mar 15, 2024 | **Feature** <ol><li>Added the VOD ad insertion feature.</li></ol> |
| ~~1.2.1~~<br/>Deprecated | Mar 11, 2024 | **BugFix** <ol><li>Fixed freezing issues that occurred on LG and Samsung Smart TVs.</li></ol> |
| ~~1.2.0~~<br/>Deprecated | Jan 16, 2024 | **Feature** <ol><li>Manifest Manipulation feature stabilized.</li></ol> **BugFix** <ol><li>Fixed an ad attachment error when switching between stream variants</li></ol> |
| ~~1.0.0~~<br/>Deprecated | Mar 22, 2022 | **New** <ol><li>Supports Flower Solution integration.</li><li>Supports programmatic advertising.</li><li>Supports Direct I/O advertising.</li><li>Supports HLS streams.</li><li>Supports SCTE-35 CUE TAG.</li><li>Supports Google advertising.</li></ol> |

*   **New** : New features
*   **Feature** : Changes to existing features
*   **BugFix** : Error fixed
