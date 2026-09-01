---
sidebar_position: 100
sidebar_label: Release Notes
---

# React Native SDK Release Notes

| **Version** | **Date** | **Changes** |
| ---| ---| --- |
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
