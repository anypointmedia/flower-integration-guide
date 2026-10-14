---
sidebar_position: 4
---

# FlowerAdsManagerListener

This interface provides an entrypoint for receiving ad events during Flower SDK work.

## Events

### onAdBreakPrepare

The event dispatched when ad manifest is loaded for interstitial ads / VOD ads.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adInfos | [AdInfo](./ad-info.md)\[\] | List of loaded ad metadata. |

### onPrepare

The event dispatched when ad is loaded for interstitial ads / VOD ads.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adDurationMs | number | Total ad duration. |

### onPlay

The event dispatched when ad playback starts.

### onAdPlay

The event dispatched when each individual ad unit begins playback. Delivers metadata for the ad about to be played.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adInfo | [AdInfo](./ad-info.md) | Metadata of the ad that started playing. |

### onAdUserAction

The event dispatched when the user interacts with the ad, such as clicking the learn-more button or pressing the skip button.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| action | string | User action type.<br/>`learn_more`: User clicked the learn-more / click-through area.<br/>`skip`: User pressed the skip button. |
| adInfo | [AdInfo](./ad-info.md) | Metadata of the ad the action was performed on. |

### onCompleted

The event dispatched when ad playback ends.

### onError

The event dispatched when any error happens in the Flower SDK.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| error | FlowerError? | Error object including message. |

`onError` is called when:

*   **An ad fails to play** (for example, the ad media cannot be decoded or cannot be reached).
*   **Content playback stops on a fatal player error.** The player adapter calls `onError` once per incident with the message `playback unrecoverable (<reason>) - url: <url>` and the player's error as `cause`: a fatal `hlsError` from HLS.js or FlowerHls, a CRITICAL `error` from Shaka Player, an `error` from dash.js, or an `error` from Bitmovin Player. A new incident starts once playback runs again.

For VOD, a failed or timed-out VMAP/VAST request, or a break with no ads, is not an error: the SDK calls `onCompleted` (for no ads, `onAdBreakSkipped(1)` and then `onCompleted`).

Recommended handling:

*   **Linear TV / FAST:** stop the ads manager with `stop()`, release the player, and start the channel again with a new `changeChannelUrl(...)` call. Pass exactly the same parameters as the first start, including `prerollAdTagUrl` (with FlowerHls, the same ad config), and handle the returned URL the same way. The SDK skips the pre-roll of the channel (`channelId`) it entered last and calls `onCompleted()` right away, so the viewer does not see it again. See [Manual Player Control](../ad-insertion/linear-tv-fast/manual-player-control).
*   **VOD:** when an ad break fails, the SDK brings the content back before it calls `onError`: after a mid-roll, the content is already playing again from `rewindDuration` before the interruption point. Do not stop, seek, or reload the content for an ad error. For a pre-roll error, load and start the content. `onCompleted` may also be called for the failed break, in either order. For `playback unrecoverable`, reload the content or show an error. See [VOD Pre-roll, Mid-roll, Post-roll Ad Implementation](../ad-insertion/vod/vod-ad-implementation).

### onAdBreakSkipped

The event dispatched when an ad is skipped.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| reason | number | Code that describes why the ad is skipped.<br/>0: Unknown<br/>1: No Ad<br/>2: Timeout<br/>3: Error |

## Related APIs

*   [AdInfo](./ad-info.md)
