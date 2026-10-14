---
sidebar_position: 100
sidebar_label: Release Notes
---

# React Native SDK Release Notes

| **Version** | **Date** | **Changes** |
| ---| ---| --- |
| 1.0.3 | Oct 14, 2026 | **New** <ol><li>Added `notifyPictureInPictureModeChanged(isInPictureInPictureMode)` and `setIgnoreAdBreakInPIPMode(ignore)`. See [PIP Mode Support](./getting-started/pip-mode-support)</li></ol> **Feature** <ol><li>Updated the bundled Android SDK to 2.9.28 and the iOS SDK to 2.3.17, including their bug fixes</li><li>By default (`setIgnoreAdBreakInPIPMode(true)`), a VOD ad break plays in the SDK's own ad player over the `<Video>`, and for a mid-roll the SDK pauses the content and, at `completed`, seeks it back by the rewind duration (5 seconds) and resumes it. The SDK does not pause the content for a pre-roll, so mount the `<Video>` paused and start the content on the first `completed` or `error` (`completed` is also sent when there is no pre-roll). Once the content has started, do not pause, seek, or reload it around a VOD ad break, including with `playerType: 'bitmovin'` on iOS. With `false`, the VOD ad break plays in the app's player (`react-native-video` on Android and iOS, Bitmovin on Android) and keeps playing in PIP mode; inline breaks and Bitmovin on iOS still use the SDK's ad player</li><li>A mid-roll's `prepare` event is now dispatched when the content reaches the mid-roll's position</li><li>When a VOD ad break fails with an ad playback error, the SDK now brings the content back before sending `error`: after a mid-roll, the content is already playing again from the rewind duration before the interruption point (with `setIgnoreAdBreakInPIPMode(false)`, the failed ad is dropped and the content is put back into the app's player). Do not resume, seek, or re-source the content on a VOD `error`; for a pre-roll failure, start the held content. `completed` may also be sent for the failed break, in either order. See [VOD Ad Implementation](./ad-insertion/vod/vod-ad-implementation#handling-error)</li><li>When content playback stops and the native SDK will not recover it, an `error` event whose message starts with `playback unrecoverable` is now sent once per incident on Android, as on iOS (not with `playerType: 'bitmovin'` on iOS). For a live channel, stop and start again with `changeChannelUrl`; for VOD, reload the content or show an error</li></ol> |
| 1.0.2 | Sep 01, 2026 | **Feature** <ol><li>Updated the bundled Android SDK to 2.9.23 and the iOS SDK to 2.3.13</li></ol> |
| 1.0.1 | Aug 27, 2026 | **Feature** <ol><li>Updated the bundled iOS SDK to 2.3.12</li></ol> |
| 1.0.0 | Aug 21, 2026 | **New** <ol><li>Initial release of `@anypoint/flower-sdk-react-native`, bundling the JavaScript API with the Android and iOS native bindings</li><li>Supports Linear TV (incl. FAST) via `changeChannelUrl`, VOD via `requestVodAd`, and inline/interstitial ads via `requestAd`</li><li>All sessions are addressed by the `nativeID` of the `<Video>` they belong to, so several players can run their own channel on one screen</li><li>Ad events delivered as a typed `AdEvent` union through `addAdEventListener` / `addAdEventListenerFor`</li><li>Supports `react-native-video` 6.0.0 and above (verified against 6.19.2)</li><li>Optional `bitmovin-player-react-native` support through `playerType: 'bitmovin'`</li></ol> |

## Bundled Native SDK Versions

Each release of the React Native package resolves a specific version of the underlying platform SDKs.

| **React Native package** | **Android SDK** | **iOS SDK** |
| ---| ---| --- |
| 1.0.2 | 2.9.23 | 2.3.13 |
| 1.0.1 | 2.9.22 | 2.3.12 |
| 1.0.0 | 2.9.22 | 2.3.11 |

For the changes in those SDKs, see the [Android release notes](../android/release-notes.md) and the [iOS release notes](../ios/release-notes.md).

*   **New** : New features
*   **Feature** : Changes to existing features
*   **BugFix** : Error fixed
