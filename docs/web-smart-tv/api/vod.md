---
sidebar_position: 2
---

# VOD

## Methods

### FlowerAdsManager.requestVodAd

The function above is used before you enter VOD content. 

The parameters are described below:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | Ad tag URL issued by an ad server |
| contentId | string | Content’s ID<br/>Must be registered in the FLOWER backend system |
| durationMs | number | Total playback time of VOD content (milliseconds) |
| extraParams | map | Extra information which is agreed upon for targeting (null for no extra information) |
| mediaPlayerHook | MediaPlayerHook | An object implementing an interface that returns a video player |
| adTagHeaders | map | (Optional) HTTP header information to be added when requesting an ad |
| requestTimeout | number | (Optional) Timeout for requesting a VOD ad (milliseconds). Default is 5000. |
| minPrepareDuration | number | (Optional) Preparation lead time (milliseconds). A mid-roll ad is requested `requestTimeout + minPrepareDuration` before the mid-roll's position, and `onPrepare` is called when the content reaches that position. Default is 5000. |
| rewindDuration | number | (Optional) Duration to rewind the content when a mid-roll ad break ends (milliseconds). The content resumes this much earlier than the point where it was interrupted. Default is 5000. |

`requestTimeout`, `minPrepareDuration` and `rewindDuration` are optional trailing parameters. Omitting them or passing `null` keeps the default, so the 6-argument form works as before.

```javascript
flowerAdView.adsManager.requestVodAd(
    'https://ad_request',
    '100',
    3600000,
    null,
    mediaPlayerHook,
    null,
    5000,   // requestTimeout
    5000,   // minPrepareDuration
    5000    // rewindDuration
);
```

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

```javascript
// TODO GUIDE: request vod ad
// arg0: adTagUrl, url from flower system.
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: contentId, unique content id in your service
// arg2: durationMs, duration of vod content in milliseconds
// arg3: extraParams, values you can provide for targeting
// arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
// arg5: adTagHeaders, (Optional) values included in headers for ad request
flowerAdView.adsManager.requestVodAd(
    'https://ad_request',
    '100',
    3600000,
    null,
    mediaPlayerHook,
    new Map([['custom-ad-header', 'custom-ad-header-value']])
);
```
