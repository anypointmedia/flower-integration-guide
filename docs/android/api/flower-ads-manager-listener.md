---
sidebar_position: 3
---

# FlowerAdsManagerListener

This interface provides an entrypoint for receiving ad events during Flower SDK work.

## Events

### onAdBreakPrepare

The event dispatched when ad manifest is loaded for interstitial ads / VOD ads.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adInfos | ArrayList<AdInfo> | List of loaded ad metadata. |

### onPrepare

The event dispatched when ad is loaded for interstitial ads / VOD ads.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adDurationMs | Int | Total ad duration. |

### onPlay

The event dispatched when ad playback starts.

### onCompleted

The event dispatched when ad playback ends.

### onError

The event dispatched when any error happens in the Flower SDK.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| error | FlowerError? | Error object including message. |

### onAdSkipped

The event dispatched when an ad is skipped.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| reason | Int | Code that describes why the ad is skipped.<br/>0: Unknown<br/>1: No Ad<br/>2: Timeout<br/>3: Error<br/>4: User skipped |

## Related APIs

*   [AdInfo](ad-info)
