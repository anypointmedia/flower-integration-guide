---
sidebar_position: 1
---

# Android SDK

| **Version** | **Date** | **Changes** |
| ---| ---| --- |
| 2.9.0 | Feb 25, 2026 | **BugFix** <ol><li>Fixed a time mismatch when entering a live channel with ad marker</li><li>Fixed a time mismatch that occurred during long-duration playback</li></ol> **Feature** <ol><li>Improved performance when processing playlists with long window</li><li>Enhanced the interactive ad UI</li><li>Added QR code display when selecting “More Info” on ads in TV environments</li></ol> |
| 2.8.3 | Jan 09, 2026 | **BugFix** <ol><li>Fixed the tracking time mismatch issue.</li></ol> **Feature** <ol><li>Enhanced the logic about tracking ad</li><li>Added current time and timezone URL macros</li><li>Enhanced the logic to parse the XML content</li><li>Changed the timeout for VOD ad requests from 3 to 5 seconds</li></ol> |
| 2.8.2 | Dec 15, 2025 | **BugFix** <ol><li>Fixed an issue where the requestChannelAd() API would return an empty ad list and a success response when a timeout occurred.</li></ol> |
| 2.8.1 | Dec 12, 2025 | **BugFix** <ol><li>Fixed a crash on devices without WebView.</li><li>Fixed an ad tracking issue in Exoplayer when playing DASH streams.</li></ol> |
| 2.8.0 | Dec 2, 2025 | **Feature** <ol><li>Added the `FlowerSdk.notifyPictureInPictureModeChanged()`  API so that, even when Flower Player is not used, the app can pass the PiP mode state to the SDK for correct behavior.</li></ol> **BugFix** <ol><li>Fixed an issue where the stream could stutter during or immediately before ad playback.</li><li>Fixed a deadlock issue that could occur during VOD ad playback.</li><li>Fixed an issue where a black screen could appear when switching between certain streams and ads.</li></ol> |
| 2.7.3 | Nov 14, 2025 | **BugFix** <ol><li>Fixed an error that linear tv content displayed before the preroll ads are being played. This fix requires Flower player.</li><li>Improved video stuttering or interruption issues during or before ad playback.</li></ol> |
| 2.7.2 | Nov 13, 2025 | **BugFix** <ol><li>Fixed onPrepare() callback in requestChannelAd() API being called twice when an error occurs in the callback.</li></ol> |
| 2.7.1 | Nov 11, 2025 | **Feature** <ol><li>Changed type of transactionId parameter in requestChannelAd() to Long from Int.</li></ol> |
| 2.7.0 | Nov 10, 2025 | **Feature** <ol><li>Changed the requestChannelAd() API interface to include transaction ID and response status.</li></ol> **BugFix** <ol><li>Fixed a crash when using enterChannel() with custom MediaPlayerAdapter implementation.</li></ol> |
| 2.6.2 | Oct 30, 2025 | **BugFix** <ol><li>Fixed a manipulation error that could occur when skipping an advertisement on linear TV.</li></ol> |
| 2.6.1 | Oct 29, 2025 | **BugFix** <ol><li>Fixed an issue that prevented the ad view from displaying when using TextureView with ExoPlayer.</li></ol> |
| 2.6.0 | Oct 17, 2025 | **Feature** <ol><li>Improved playback of Google Ads to play immediately without encoding when possible.</li></ol> |
| 2.5.1 | Oct 14, 2025 | **BugFix** <ol><li>Fixed an error that spare ad for skippable ad is actually inserted in the stream.</li></ol> |
| 2.5.0 | Oct 2, 2025 | **Feature** <ol><li>Added Flower player support for ad insertion on VOD content.</li><li>Added FlowerBitmovinPlayer, Flower player class that wraps bitmovin player.</li></ol> **BugFix** <ol><li>Fixed an error that VOD ad not showing in PIP mode. This fix requires Flower player.</li></ol> |
| 2.4.2 | Oct 2, 2025 | **BugFix** <ol><li>Rolled back Kotlin version from 2.2.0 to 2.0.21, which was upgraded in 2.3.3</li></ol> |
| 2.4.1 | Sep 22, 2025 | **Feature** <ol><li>Improved ad load speed when using requestChannelAd().</li></ol> **BugFix** <ol><li>Fixed overflow when calculating free storage for cache files.</li></ol> |
| 2.4.0 | Sep 19, 2025 | **Feature** <ol><li>Added FlowerSdk.ignoreSkip() API to allow users to opt out of ad skipping when using their own ad serving system.</li></ol> |
| 2.3.3 | Sep 9, 2025 | **Feature** <ol><li>Improved ad load speed.</li></ol> |
| 2.3.2 | Aug 26, 2025 | **BugFix** <ol><li>Fixed crash when player API throws an error</li><li>Fixed ad insertion error in HLS playlist containing audio-only media.</li></ol> |
| 2.3.1 | Aug 19, 2025 | **BugFix** <ol><li>Fixed crash when playing Google Ads in Linear TV midroll.</li></ol> |
| 2.3.0 | Aug 13, 2025 | **Feature** <ol><li>Added support for linear tv ad request without playlist manipulation.</li></ol> |
| 2.2.0 | July 31, 2025 | **Feature** <ol><li>Added MediaPlayerAdapter interface to support direct integration with unsupported media players.</li></ol> |
| 2.1.0 | July 30, 2025 | **Feature** <ol><li>Added support for playlist formats where the EXT-X-MEDIA-SEQUENCE value of HLS differs by variant</li></ol> |
| 2.0.2 | July 21, 2025 | **BugFix** <ol><li>Added support for the whitespace in the HLS playlist attribute delimiter.</li></ol> |
| 2.0.1 | July 7, 2025 | **BugFix** <ol><li>Fixed the KotlinNothingValueException error that occurred when playing VOD and interstitial ads.</li></ol> |
| 2.0.0 | June 27, 2025 | **Feature** <ol><li>Added support for the ad skipping feature in linear content playback.</li><li>Introduced `FlowerExoPlayer2` and `FlowerMedia3ExoPlayer` for easier SDK integration.</li><li>Improved internal management of 301 redirects</li><li>Improved DASH playlist processing speed</li></ol> |
| 1.1.2 | May 20, 2025 | **BugFix** <ol><li>Fixed an error that occurred when a host-added ad event listener's operation internally affected the SDK.</li><li>Fixed a `ConcurrentModificationException` that occurred due to conflict between the SDK's shutdown process and an active event listener.</li></ol> |
| 1.1.1 | Apr 30, 2025 | **BugFix** <ol><li>Improved tracking logic when playing Google IMA ads</li></ol> |
| 1.1.0 | Jan 14, 2025 | **BugFix** <ol><li>Fixed an issue where the optimal creative was not always selected for each platform when playing VOD ads.</li><li>Improved VOD ad loading speed.</li><li>Improved playlist processing time when playing linear TV.</li><li>Fixed an error where URL query parameters were not handled properly when playing linear TV.</li></ol> **Feature** <ol><li>Added a pre-roll ad feature for linear TV.</li><li>Improved log level.</li><li>Added support for Bitmovin Player.</li><li>Added support for **androidx.media3.exoplayer.ExoPlayer**.</li></ol> |
| 1.0.30 | Nov 15, 2024 | **BugFix** <ol><li>Fixed an issue where logs were output regardless of the configured log levels.</li><li>Fixed an error that prevented streams from playing if the HLS stream URL contained unencoded special characters (e.g., slash "/").</li><li>Fixed an error that prevented streams from playing when the HLS playlist contained more segments than the SDK allowed.</li></ol> |
| 1.0.29 | Oct 21, 2024 | **BugFix** <ol><li>Fixed an issue where streams would not play when the DASH stream URL contained unencoded URL parameters.</li><li>Fixed a buffering issue that occurred when playing repeated filler ads in DASH streams.</li></ol> |
| 1.0.28 | Oct 04, 2024 | **Feature** <ol><li>Modified the third-party library package name to prevent naming collisions.</li></ol> |
| 1.0.27 | Sep 27, 2024 | **BugFix** <ol><li>Fixed an app crash that occurred in environments where Android WebView was not installed.</li></ol> |
| 1.0.26 | Sep 13, 2024 | **BugFix** <ol><li>Fixed an issue where parsing HLS playlists would fail when there were unknown tags or properties.</li></ol> |
| 1.0.25 | Sep 11, 2024 | **Feature** <ol><li>Added response code, request URL, and request header to the log for all ad requests, regardless of success or failure.</li></ol> **BugFix** <ol><li>Fixed an error that occurred when parsing VAST XML containing a Wrapper URL.</li></ol> |
| 1.0.24 | Sep 06, 2024 | **BugFix** <ol><li>Minimum SDK: Lowered from 21 to 17.</li></ol> |
| 1.0.23 | Sep 06, 2024 | **BugFix** <ol><li>Fixed parsing errors in certain ad responses and creative playlist formats.</li></ol> |
| 1.0.22 | Sep 03, 2024 | **Feature** <ol><li>Included enhanced targeting data in ad requests.</li></ol> |
| 1.0.21 | Aug 09, 2024 | **Feature** <ol><li>Added support for ad insertion in DRM-enabled DASH streams.</li><li>Introduced the `adTagHeaders` parameter to the `changeChannelUrl()` API, allowing the inclusion of custom HTTP headers during ad requests.</li><li>Introduced `channelStreamHeaders` parameter to the `changeChannelUrl()` API, allowing the inclusion of custom HTTP headers during stream requests.</li><li>Introduced the `changeChannelExtraParams` API, enabling the modification of targeting information during a live stream.</li></ol> |
| 1.0.20 | Jul 18, 2024 | **Feature** <ol><li>Added a feature to retrieve `MediaPlayerAdapter` instance from `MediaPlayerHook` for custom player support</li><li>Added `onAdSkipped` in `FlowerAdsManagerListener`</li></ol> |
| 1.0.19 | Apr 12, 2024 | **BugFix** <ol><li>Added the defense logic for errors that occur in the linear TV player.</li><li>If an error occurs in the linear TV player, the SDK will be reset.</li></ol> |
| ~~1.0.18~~<br/>Deprecated | Mar 29, 2024 | **Feature** <ol><li>Changed the compileSdk version from 33 to 32.</li></ol> |
| ~~1.0.17~~<br/>Deprecated | Mar 29, 2024 | **Feature** <ol><li>Changed the compileSdk version from 34 to 33.</li></ol> |
| ~~1.0.16~~<br/>Deprecated | Mar 26, 2024 | **BugFix** <ol><li>Fixed an issue where fillers were incorrectly tracked in consecutive ad cues.</li></ol> |
| ~~1.0.15~~<br/>Deprecated | Mar 15, 2024 | **BugFix** <ol><li>Fixed an error where stream URL with long query parameters could not be played.</li></ol> |
| ~~1.0.14~~<br/>Deprecated | Mar 14, 2024 | **BugFix** <ol><li>Fixed a viewability error that occurred when Google Ads are played.</li></ol> |
| ~~1.0.13~~<br/>Deprecated | Feb 7, 2024 | **BugFix** <ol><li>Fixed an error that occurred when responses from certain creatives could not be parsed.</li></ol> |
| ~~1.0.12~~<br/>Deprecated | Jan 19, 2024 | **BugFix** <ol><li>Fixed a tracking error that occurred when two or more responses were received from a wrapper ad.</li></ol> |
| ~~1.0.11~~<br/>Deprecated | Dec 12, 2023 | **BugFix** <ol><li>Fixed an issue where completion beacon logs were not called intermittently.</li></ol> |
| ~~1.0.10~~<br/>Deprecated | Nov 27, 2023 | **BugFix** <ol><li>Fixed an intermittent app crash issue.</li></ol> |
| ~~1.0.9~~<br/>Deprecated | Nov 15, 2023 | **Feature** <ol><li>The feature of handling player object reception when ads are requested has been improved.</li><li>Changed to support Android 4.2 and ignore versions below 4.1.</li><li>Removed XML dependency.</li></ol> **BugFix** <ol><li>Error handling logic has been improved when advertisements are processed. (preventing reports).</li></ol> |
| ~~1.0.7~~<br/>Deprecated | Nov 6, 2023 | **Feature** <ol><li>Improved bitrate handling of ad streams.</li></ol> |
| ~~1.0.6~~<br/>Deprecated | Oct 31, 2023 | **Feature** <ol><li>The cache processing feature for fillers has been improved.</li></ol> |
| ~~1.0.5~~<br/>Deprecated | Oct 25, 2023 | **BugFix** <ol><li>Fixed an issue of ad response order and playback order mismatch.</li><li>Fixed an intermittent app crash issue.</li></ol> |
| ~~1.0.4~~<br/>Deprecated | Oct 13, 2023 | **BugFix** <ol><li>Fixed an issue of an intermittent error that occurred due to a parallel processing issue when ad requests were processed asynchronously.</li></ol> |
| ~~1.0.3~~<br/>Deprecated | Oct 12, 2023 | **Feature** <ol><li>Improved VAST Parser feature (empty string exception handling).</li></ol> **BugFix** <ol><li>Fixed an issue of where completion was not reported.</li></ol> |
| ~~1.0.2~~<br/>Deprecated | Sep 19, 2023 | **New** <ol><li>Supports custom CUE TAG.</li></ol> |
| ~~1.0.1~~<br/>Deprecated | Aug 21, 2023 | **New** <ol><li>Supports HLS streams with DRM applied.</li><li>Supports MPEG-DASH streams.</li></ol> |
| ~~1.0.0~~<br/>Deprecated | Mar 22, 2022 | **New** <ol><li>Supports Flower Solution integration.</li><li>Supports programmatic advertising.</li><li>Supports Direct I/O advertising.</li><li>Supports HLS streams.</li><li>Supports SCTE-35 CUE TAG.</li><li>Supports Google advertising.</li></ol> |

*   **New** : New features
*   **Feature** : Changes to existing features
*   **BugFix** : Error fixed
