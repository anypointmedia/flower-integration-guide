---
sidebar_position: 2
---

# iOS SDK

| **Version** | **Date** | **Changes** |
| ---| ---| --- |
| 2.2.3 | Jan 16, 2025 | **Improvement** <ol><li>Improved ad tracking when the network is unstable.</li><li>Improved procedure for resolving device fingerprints.</li><li>Changed the timeout for VOD ad requests from 3 to 5 seconds.</li><li>Replaced the device fingerprint library (use a native library).</li></ol> **BugFix** <ol><li>Separated threads for ad request or tracking.</li><li>Fixed an issue where the main content is shown between ads in VOD.</li></ol> |
| 2.2.0 | Dec 3, 2025 | **Feature** <ol><li>Added VOD playback support to FlowerAVPlayer.</li><li>Added the `FlowerSdk.notifyPictureInPictureModeChanged()`  API so that, even when Flower Player is not used, the app can pass the PiP mode state to the SDK for correct behavior.</li></ol> **Improvement** <ol><li>Improved ad tracking when playing streams with long play window.</li></ol> **BugFix** <ol><li>Fixed an issue that the VMAP manifest cannot be parsed.</li><li>Fixed crash when switching between streams.</li><li>Fixed manipulation error on HLS/DASH streams.</li></ol> |
| 2.1.4 | Oct 13, 2025 | **BugFix** <ol><li>Fixed black screen when playing DRM-protected stream.</li></ol> |
| 2.1.3 | Aug 26, 2025 | **BugFix** <ol><li>Fixed crash when player API throws an error</li><li>Fixed ad insertion error in HLS playlists containing audio-only media.</li><li>Fixed playlist manipulation error in streams with long rewind buffer.</li><li>Fixed crash when using FlowerAVPlayer in UiKit.</li></ol> |
| 2.1.2 | Aug 19, 2025 | **BugFix** <ol><li>Fixed crash when playing wrapper player.</li></ol> |
| 2.1.1 | Aug 14, 2025 | **Feature** <ol><li>Improved response when the original playlist response is empty on Linear TV.</li></ol> **BugFix** <ol><li>Fixed NullPointerException that occurred when exiting FlowerAVPlayer without configuring ads.</li></ol> |
| ~~2.1.0~~<br/>Deprecated | July 30, 2025 | **Feature** <ol><li>Added support for playlist formats where the EXT-X-MEDIA-SEQUENCE value of HLS differs by variant</li></ol> |
| 2.0.3 | July 21, 2015 | **BugFix** <ol><li>Added support for the whitespace in the HLS playlist attribute delimiter.</li></ol> |
| 2.0.2 | July 7, 2025 | **BugFix** <ol><li>Resolved the KotlinNothingValueException error that occurred when playing VOD and interstitial ads.</li></ol> |
| 2.0.1 | Jun 19, 2025 | **BugFix** <ol><li>Changed `FlowerAVPlayer` to open class to be able to be inherited.</li></ol> |
| 2.0.0 | Jun 5, 2025 | **Feature** <ol><li>Added support for the ad skipping feature in linear content playback.</li><li>Introduced `FlowerAVPlayer` for easier SDK integration.</li></ol> |
| 1.1.0 | Jan 14, 2025 | **BugFix** <ol><li>Fixed an issue where the optimal creative was not always selected for each platform when playing VOD ads.</li><li>Improved VOD ad loading speed.</li><li>Improved playlist processing time when playing linear content.</li><li>Resolved an error where URL query parameters were not handled properly when playing linear content.</li></ol> **Feature** <ol><li>Added a pre-roll ad feature for linear content.</li><li>Improved log level.</li></ol> |
| 1.0.14 | Dec 9, 2024 | **Feature** <ol><li>Improved VOD ad playback to select the optimal ad creative for each platform.</li></ol> |
| 1.0.13 | Nov 28, 2024 | **BugFix** <ol><li>Resolved an issue that caused an undefined error when stopping the SDK.</li><li>Improved stability by addressing an app crash that occurred when stopping the SDK during ad playback on VOD.</li></ol> |
| 1.0.12 | Nov 15, 2024 | **BugFix** <ol><li>Fixed an issue where logs were output regardless of the configured log levels.</li><li>Fixed an error that prevented streams from playing if the HLS stream URL contained unencoded special characters (e.g., slash "/").</li><li>Fixed an error that prevented streams from playing when the HLS playlist contained more segments than the SDK allowed.</li></ol> |
| 1.0.11 | Sep 13, 2024 | **BugFix** <ol><li>Fixed an issue where parsing HLS playlists would fail when there were unknown tags or properties.</li></ol> |
| 1.0.10 | Sep 11, 2024 | **Feature** <ol><li>Added response code, request URL, and request header to the log for all ad requests, regardless of success or failure.</li></ol> **BugFix** <ol><li>Fixed an error that occurred when parsing VAST XML containing a Wrapper URL.</li></ol> |
| 1.0.9 | Sep 06, 2024 | **BugFix** <ol><li>Resolved parsing errors in certain ad responses and creative playlist formats.</li></ol> |
| 1.0.8 | Sep 03, 2024 | **Feature** <ol><li>Included enhanced targeting data in ad requests</li></ol> **BugFix** <ol><li>Resolved a crash that occurred when developers implemented the `MediaPlayerAdapter` directly without using the provided helper methods.</li><li>Resolved a crash that occurred when attempting to play a media URL that was invalid or inaccessible.</li></ol> |
| 1.0.7 | Aug 28, 2024 | **BugFix** <ol><li>Resolved an accessibility issue with the `MediaPlayerAdapter` interface, allowing for seamless integration of unsupported media players within the SDK.</li><li>Eliminated redundant `ApplicationContext` parameter to optimize code clarity and maintainability.</li></ol> |
| 1.0.6 | Aug 09, 2024 | **Feature** <ol><li>Implemented VOD ad insertion feature.</li><li>Introduced the `CACHEBUSTING` URL macro.</li><li>Introduced the `adTagHeaders` parameter to the `changeChannelUrl()` API, allowing the inclusion of custom HTTP headers during ad requests.</li><li>Introduced the `channelStreamHeaders` parameter to the `changeChannelUrl()` API, allowing the inclusion of custom HTTP headers during stream requests.</li><li>Introduced the `changeChannelExtraParams()` API, enabling the modification of targeting information during a live stream.</li></ol> **BugFix** <ol><li>Fixed an issue causing incorrect tracking of filler ads in consecutive ad queues.</li><li>Resolved an issue where logs were still generated despite disabling logging via the `setLoglevel('Off')` API.</li></ol> |
| 1.0.5 | Mar 15, 2024 | **Feature** <ol><li>Added a VOD ad insertion feature.</li></ol> **BugFix** <ol><li>Fixed the black screen issue that occurred when linear content is played in a picture-in-picture mode.</li></ol> |
| ~~1.0.4~~<br/>Deprecated | Jan 23, 2024 | **BugFix** <ol><li>Fixed an app crash issue that occurred when the player is playing a channel before `FlowerAdsManager.changeChannelUrl()` is called.</li></ol> |
| ~~1.0.3~~<br/>Deprecated | Jan 16, 2024 | **BugFix** <ol><li>Fixed an operation error on the background mode.</li></ol> |
| ~~1.0.2~~<br/>Deprecated | Sep 19, 2023 | **New** <ol><li>Supports custom CUE TAG.</li></ol> |
| ~~1.0.1~~<br/>Deprecated | Aug 21, 2023 | **New** <ol><li>Supports HLS streams with DRM applied.</li><li>Supports MPEG-DASH streams.</li></ol> |
| ~~1.0.0~~<br/>Deprecated | Mar 22, 2022 | **New** <ol><li>Supports Flower Solution integration.</li><li>Supports programmatic advertising.</li><li>Supports Direct I/O advertising.</li><li>Supports HLS streams.</li><li>Supports SCTE35 CUE TAG.</li><li>Supports Google advertising.</li></ol> |

*   **New** : New features
*   **Feature** : Changes to existing features
*   **BugFix** : Error fixed
