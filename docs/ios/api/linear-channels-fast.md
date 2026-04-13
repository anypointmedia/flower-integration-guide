---
sidebar_position: 1
---

# Linear Channels / FAST

## Methods

### FlowerAdsManager.changeChannelUrl

The function above allows you to dynamically change the stream URL of a live broadcast. The parameters are described below:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | string | Original playback URL |
| adTagUrl | string | Ad tag URL issued by an ad server |
| channelId | string | Channel ID<br/>Channel IDs must be registered in the FLOWER backend system |
| extraParams | map | Extra information which is agreed upon for targeting (null for no extra information) |
| mediaPlayerHook | MediaPlayerHook | An object implementing an interface that returns a video player |
| adTagHeaders | map | (Optional) HTTP header information to be added when requesting an ad |
| channelStreamHeaders | map | (Optional) HTTP header information to be added when requesting the original media stream |
| prerollAdTagUrl | string | (Optional) Ad tag URL issued by the ad server for pre-roll ads |

### FlowerAdsManager.changeChannelExtraParams

This function above allows you to change extraParams, which is additional targeting information, during a live broadcast. The parameter is described below:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| extraParams | map | Additional targeting information agreed upon beforehand |

### FlowerAdsManager.stop

This method stops the playback of linear channels. There are no parameters.

## Work Process

1. Insert replacement ads at a correct timing, consulting “Ad UI Declaration”
2. If you need additional processing during ad playback, you can listen for events corresponding to ad playbacks or finishes by implementing the _FlowerAdsManagerListener_ interface.
3. Finally, change the original streaming URL by using _FlowerAdsManager_._changeChannelUrl_ and then send it to the player.
4. (Optional) If targeting information changes during streaming, update the SDK with the new information using FlowerAdsManager.changeChannelExtraParams.

```swift
// TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
// arg0: videoUrl, original LinearTV stream url
// arg1: adTagUrl, url from flower system
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg2: channelId, unique channel id in your service
// arg3: extraParams, values you can provide for targeting
// arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
// arg5: adTagHeaders, (Optional) values included in headers for ad request
// arg6: channelStreamHeaders, (Optional) values included in headers for channel stream request
let changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
    videoUrl: "https://XXX",
    adTagUrl: "https://ad_request",
    channelId: "100",
    extraParams: nil,
    mediaPlayerHook: mediaPlayerHook,
    adTagHeaders: ["custom-ad-header": "custom-ad-header-value"],
    channelStreamHeaders: ["custom-stream-header": "custom-stream-header-value"],
    prerollAdTagUrl: "https://preroll_ad_request"
)
player.insert(AVPlayerItem(url: URL(string: changedChannelUrl)!), after: nil)
...
// TODO GUIDE: change extraParams during stream playback
func onStreamProgramChanged(targetingInfo: String) {
    flowerAdView?.adsManager.changeChannelExtraParams(extraParams: ["myTargetingKey": targetingInfo]);
}
```
