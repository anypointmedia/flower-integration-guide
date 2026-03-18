---
sidebar_position: 2
---

# VOD

## Methods

### FlowerAdsManager.requestVodAd

The function above is used before you enter VOD content. The parameters are described below:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | Ad tag URL issued by an ad server |
| contentId | string | Content’s ID<br/>Must be registered in the FLOWER backend system |
| durationMs | Long | Total playback time of VOD content (milliseconds) |
| extraParams | map | Extra information which is agreed upon for targeting (null for no extra information) |
| mediaPlayerHook | MediaPlayerHook | An object implementing an interface that returns a video player |
| adTagHeaders | map | (Optional) HTTP header information to be added when requesting an ad |

### FlowerAdsManager.stop

This method ends VOD content playback. There are no parameters.

### FlowerAdsManager.pause

This method pauses VOD content playback. There are no parameters.

### FlowerAdsManager.resume

This method resumes VOD content playback. There are no parameters.

## Work Process

1. Insert replacement ads at a correct timing, consulting “Ad UI Declaration”
2. If you need additional processing during ad playback, you can listen for events corresponding to ad playbacks or finishes by implementing the _FlowerAdsManagerListener_ interface.
3. Finally, pass the VOD content ID and duration information to the player through _FlowerAdsManager_._requestVodAd_.

```swift
// TODO GUIDE: request vod ad
// arg0: adTagUrl, url from flower system.
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: contentId, unique content id in your service
// arg2: durationMs, duration of vod content in milliseconds
// arg3: extraParams, values you can provide for targeting
// arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
// arg5: adTagHeaders, (Optional) values included in headers for ad request
flowerAdView.adsManager.requestVodAd(
    adTagUrl: "https://ad_request",
    contentId: "100",
    durationMs: 3600000,
    extraParams: nil,
    mediaPlayerHook: mediaPlayerHook,
    adTagHeaders: ["custom-ad-header": "custom-ad-header-value"]
)
```
