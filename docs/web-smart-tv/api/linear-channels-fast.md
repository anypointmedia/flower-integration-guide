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
| prerollAdTagUrl | string | (Optional) Ad tag URL issued by the ad server for pre-roll ads. When set, the SDK plays a channel pre-roll before the stream. See [Pre-roll Ads](#pre-roll-ads) |

#### Pre-roll Ads

When `prerollAdTagUrl` is set, `changeChannelUrl()` still returns the stream URL right away and requests the pre-roll in the background. The SDK plays the pre-roll in a video element of its own over the player, pauses the player while it plays, and calls `onCompleted()` and resumes the player when it ends. It also calls `onCompleted()` when there is no pre-roll ad or the pre-roll fails; a failed pre-roll is not reported through `onError()`.

Hold the stream until then: store the returned URL and load it from a temporary listener's first `onCompleted()` (or `onError()`), then register the main listener again. Each `changeChannelUrl()` call stops the previous session, including a pending pre-roll, and requests the new channel's pre-roll. When `changeChannelUrl()` is called with the same `channelId` as the channel entered last, the SDK skips the pre-roll even if `prerollAdTagUrl` is passed, and calls `onCompleted()` right after `changeChannelUrl()` returns. So a restart after `onError()` passes the same `prerollAdTagUrl` and holds the stream in the same way. `stop()` does not clear the remembered channel; `requestVodAd()` and `requestAd()` do. See [Manual Player Control](../ad-insertion/linear-tv-fast/manual-player-control.md#pre-roll-ads) for the full flow and example.

### FlowerAdsManager.changeChannelExtraParams

This function above allows you to change extraParams, which is additional targeting information, during a live broadcast. The parameter is described below:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| extraParams | map | Additional targeting information agreed upon beforehand |

### FlowerAdsManager.stop

This method stops the playback of linear channels. There are no parameters.

## Work Process

1. Insert replacement ads at the correct timing, consulting "Ad UI Declaration"
2. If you need additional processing during ad playback, you can listen for events corresponding to ad playbacks or finishes by implementing the _FlowerAdsManagerListener_ interface.
3. Finally, change the original streaming URL by using _FlowerAdsManager_._changeChannelUrl_ and then send it to the player.
4. (Optional) If targeting information changes during streaming, update the SDK with the new information using FlowerAdsManager.changeChannelExtraParams.

```javascript
// TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
// arg0: videoUrl, original LinearTV stream url
// arg1: adTagUrl, url from flower system
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg2: channelId, unique channel id in your service
// arg3: extraParams, values you can provide for targeting
// arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
// arg5: adTagHeaders, (Optional) values included in headers for ad request
// arg6: channelStreamHeaders, (Optional) values included in headers for channel stream request
// arg7: prerollAdTagUrl, (Optional) ad tag URL for the channel pre-roll; null for no pre-roll
const changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
    'https://XXX',
    'https://ad_request',
    '100',
    null,
    mediaPlayerHook,
    new Map([['custom-ad-header', 'custom-ad-header-value']]),
    new Map([['custom-stream-header', 'custom-stream-header-value']]),
    null
);
// Without a pre-roll, load and play the returned URL right away.
// With prerollAdTagUrl, load it only after the pre-roll ends (see Pre-roll Ads above).
player.loadAndPlay(changedChannelUrl)
...
// TODO GUIDE: change extraParams during stream playback
function onStreamProgramChanged(targetingInfo) {
    flowerAdView.adsManager.changeChannelExtraParams(new Map([ [ 'myTargetingKey', targetingInfo ] ]));
}
```
