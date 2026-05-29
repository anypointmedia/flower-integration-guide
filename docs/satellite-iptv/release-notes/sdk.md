---
sidebar_position: 1
---

# FLOWER SDK Release Notes

This release of the Flower SDK includes the following key modules:
*   [sdk-ad-ui](https://maven.anypoint.tv/service/rest/repository/browse/public-release/tv/anypoint/sdk-ad-ui/)
*   [sdk-multicast](https://maven.anypoint.tv/service/rest/repository/browse/public-release/tv/anypoint/sdk-multicast/)
*   [sdk-multicast-exoplayer](https://maven.anypoint.tv/service/rest/repository/browse/public-release/tv/anypoint/sdk-multicast-exoplayer/)
*   [sdk-multicast-ima](https://maven.anypoint.tv/service/rest/repository/browse/public-release/tv/anypoint/sdk-multicast-ima/)

| **Version** | **Date** | **Description** |
| --- | --- | --- |
| 2.0.11 | Jan 19, 2026 | **New** <ol><li>Added volume control APIs (mute, unmute, setVolume) to the AdPlayer interface.</li></ol> |
| 2.0.10 | Jan 06, 2026 | **BugFix** <ol><li>Discontinued sources.jar upload.</li><li>Fixed scheduled cues being ignored by CUE_IN signals. [Requires Agent v3.9.39 or higher]</li><li>Removed high-level IMA SDK usage. Updated for compatibility with IMA SDK 3.28.2.</li></ol> |
| 2.0.9 | Dec 08, 2025 | **New** <ol><li>Integrated SDK logs into AppLog. [Requires Agent v3.9.36 or higher]</li></ol> **Feature** <ol><li>Improved Digital start cue to schedule ad playback by separating regions. [Requires Agent v3.9.36 or higher]</li><li>[KT] Provided ad playback time modification.</li><li>Added -701 error reporting when ad preparation is received later than the scheduled ad time.</li><li>Added skip progress recovery functionality.</li></ol> **BugFix** <ol><li>Fixed retainChannelStream being changed in the middle of playback.</li><li>Restored resume functionality of the built-in player.</li><li>Improved to include IMA SDK error messages in request reports. [Requires Agent v3.9.36 or higher]</li><li>Fixed memory leak occurring during IMA SDK usage.</li><li>Fixed an issue where video occasionally remained paused when ad time was imminent.</li></ol> |
| 2.0.8 |  | **New** <ol><li>Added rendering view selection option.</li><li>Added PreRoll ad support for immediate ad playback upon channel entry.</li><li>Added device1stPartyData input support.</li><li>[Airtel] Added sdk-airtel.</li><li>Added Agent health check and recovery functionality. [Requires Agent v3.9.35 or higher]</li></ol> **Feature** <ol><li>Improved thread safety and error handling during ad preparation and playback stages.</li><li>Moved ad playback operations to a separate thread to prevent blocking the main thread.</li><li>Improved event firing frequency:<ul><li>Suppressed redundant state events when navigating to the same channel.</li><li>Fixed prepareStop callback being invoked multiple times.</li></ul></li><li>Improved IMA SDK load time by adding ImaSdkFactory initialization.</li><li>Improved SCTE-35 signal timing by capturing signal origin time to compensate for reception and decoding latency.</li><li>Registered select receivers directly in the Manifest.</li><li>[KT] Refined slot code segmentation and placement Id differentiation based on CueType.</li></ol> **BugFix** <ol><li>Fixed IMA SDK 402 error.</li><li>Fixed ad residual image remaining on screen after ad completion.</li><li>Fixed SCTE-35 splicePts overflow issue.</li><li>Fixed SCTE-35 CUE_IN signal to be cancellable on channel switch.</li></ol> |
| 2.0.7 | Apr 01, 2025 | **Feature** <ol><li>Removed Kotlin dependency.</li><li>Upgraded IMA SDK.</li><li>Removed repetitive SCTE-35 logs.</li></ol> **BugFix** <ol><li>Fixed ad-ui not sending UI rendering notification when receiving ads that require UI via append.</li><li>Fixed Google skip button not receiving focus on certain device models.</li></ol> |
| 2.0.6 | Oct 30, 2024 | **Feature** <ol><li>Android OS 14 Support</li></ol> |
| 2.0.5 | Oct 04, 2023 | **New** <ol><li>Support skippable Google Ads in custom players</li></ol> |
| 2.0.4 | Jul 12, 2023 | **New** <ol><li>The built-in player now supports skippable Google Ads.</li><li>Playlist support for you to create and manage playlists.</li></ol> **BugFix** <ol><li>Fixed an issue where the remaining time was incorrectly calculated when adding a playlist.</li></ol> |
| 2.0.1 | Jan 12, 2023 | **Feature** <ol><li>Improved SDK initialization to prevent duplicate initialization of the SDK for enhanced stability.</li><li>Improved handling of Splice Null commands.</li></ol> |
| 2.0.0 | Apr 15, 2022 | **New** <ol><li>Multi-Google Ads support.</li></ol> |
| 1.1.0 | Oct 29, 2021 | **New** <ol><li>Support for language settings in the IMA SDK.</li></ol> **Feature** <ol><li>Improved ad player status checks to automatically switch to live status if abnormalities are detected.</li></ol> |
| 1.0.0 | Jul 16, 2021 | **New** <ol><li>Google Ads support.</li><li>SCTE-35 cue tag support.</li><li>Consecutive cue support.</li></ol> |

*   **New** : New features
*   **Feature** : Changes to existing features
*   **BugFix** : Error fixed
