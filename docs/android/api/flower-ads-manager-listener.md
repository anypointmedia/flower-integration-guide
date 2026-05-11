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

### onAdBreakSkipped

The event dispatched when an ad is skipped.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| reason | Int | Code that describes why the ad is skipped.<br/>0: Unknown<br/>1: No Ad<br/>2: Timeout<br/>3: Error |

## Related APIs

*   [AdInfo](./ad-info.md)
