---
sidebar_position: 3
---

# FlowerAdsManagerListener

This interface provides an entry point for receiving ad events during Flower SDK operation.

## Events

### onAdBreakPrepare

The event dispatched when ad manifest is loaded for interstitial ads / VOD ads.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adInfos | ArrayList&lt;[AdInfo](./ad-info.md)&gt; | List of loaded ad metadata. |

### onPrepare

The event dispatched when ad is loaded for interstitial ads / VOD ads.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adDurationMs | Int | Total ad duration. |

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
| action | String | User action type.<br/>`learn_more`: User clicked the learn-more / click-through area.<br/>`skip`: User pressed the skip button. |
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
*   **Content playback stops and the SDK will not recover it.** The player adapter calls `onError` once per incident with the message `playback unrecoverable (<reason>) - url: <url>` and the player's error as `cause`. Media3 ExoPlayer / ExoPlayer2: a fatal player error that the SDK does not recover by itself, `BehindLiveWindow` when the SDK's automatic recovery from it is turned off in the Flower configuration, or a live playlist still stalled after 3 recovery attempts. Bitmovin Player: after 3 reload attempts, or with no source to reload. A new incident starts once playback runs again.
*   **The SDK's local proxy server fails to respond.** VOD ad media is cached through this server.

For VOD, a failed or timed-out VMAP/VAST request, or a break with no ads, is not an error: the SDK calls `onCompleted` (for no ads, `onAdBreakSkipped(1)` and then `onCompleted`).

The SDK calls listeners off the main thread, so switch to the main thread before touching the player. The recommended handling:

*   **Linear TV / FAST:** call `FlowerAdsManager.stop()`, stop or release the content player, then start the channel again (a new `changeChannelUrl(...)` call and the returned URL). Pass exactly the same parameters as the first start, including `prerollAdTagUrl` (with a Flower Player, the same `FlowerLinearTvAdConfig`), and handle the returned URL in the same way: with `prerollAdTagUrl`, hold it until `onCompleted`. The viewer does not see the pre-roll again, because the SDK skips the pre-roll of the channel entered last. With a Flower Player, its `stop()` / `release()` (`destroy()` for `FlowerBitmovinPlayer`) stops the ads manager. See [Manual Player Control](../ad-insertion/linear-tv-fast/manual-player-control).
*   **VOD:** when an ad break fails, the SDK brings the content back before it calls `onError`: after a mid-roll, the content is already playing again from `rewindDuration` before the interruption point. Do not stop, seek, or reload the content for an ad error. If the content has not started yet (pre-roll), load and start it; if the content has ended (post-roll), run the end-of-playback scenario. `onCompleted` may also be called for the failed break, in either order. For `playback unrecoverable`, reload the content or show an error. See [VOD Pre-roll, Mid-roll, Post-roll Ad Implementation](../ad-insertion/vod/vod-ad-implementation).

### onAdBreakSkipped

The event dispatched when an ad is skipped.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| reason | Int | Code that describes why the ad is skipped.<br/>0: Unknown<br/>1: No Ad<br/>2: Timeout<br/>3: Error |

## Related APIs

*   [AdInfo](./ad-info.md)
