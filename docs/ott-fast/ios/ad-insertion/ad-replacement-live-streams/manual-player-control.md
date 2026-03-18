---
sidebar_position: 2
---

# Manual Player Control

This guide walks you through the complete process of inserting ads into linear TV channels and FAST streams using the Flower SDK. Ad integration follows these steps:
1. **Declare the Ad UI:** Place `FlowerAdView` on the screen to display the ad.
2. **Implement Ad Event Reception:** Implement `FlowerAdsManagerListener` to handle logic at ad playback and completion points.
3. **Pass the Player:** Implement `MediaPlayerHook` to pass player information so the SDK can recognize content playback status.
4. **Configure Additional Parameters (****`extraParams`****):** Set up additional information required for ad targeting.
5. **Change Linear Channel URL (****`changeChannelUrl`****):** Change the stream URL by passing information such as ad tag URL and channel ID.
6. **Update Parameters During Playback:** Update targeting information through `changeChannelExtraParams()` during stream playback.

## Step-by-Step Details

### 1. Declare the Ad UI

> Please refer to the Ad Insertion menu > Declare the Ad UI section for ad UI declaration.

### 2. Receiving Ad Events – `FlowerAdsManagerListener`

> **When inserting ads into linear channels**, ads that replace the main stream are played through ad markers (e.g., SCTE-35). **UI control and other logic may be needed** at ad playback start/end points. For this purpose, the Flower SDK provides **a listener interface for receiving ad events**, which can be implemented as follows.

```swift
class FlowerAdsManagerListenerImpl: FlowerAdsManagerListener {
    func onPrepare(adDurationMs: Int32) {
        // TODO GUIDE: need nothing for linear tv
    }

    func onPlay() {
        // OPTIONAL GUIDE: enable additional actions for ad playback
        hidePlayerControls()
    }

    func onCompleted() {
        // OPTIONAL GUIDE: disable additional actions after ad complete
        showPlayerControls()
    }

    func onError(error: FlowerError?) {
        // TODO GUIDE: restart to play Linear TV on ad error
        releasePlayer()
        playLinearTv()
    }

    func onAdSkipped(reason: Int32) {
        os_log(OSLogType.info, log: .default, "onAdSkipped: %d", reason)
    }
}
flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
```

### 3. Passing the Player – `MediaPlayerHook`

> For linear channels, you must pass the player that plays the main content to the SDK.

#### Supported Players

*   AVPlayer
*   AVQueuePlayer

These players pass the current player to the SDK by implementing the `MediaPlayerHook` interface.

#### When Using Unsupported Players

If you are using an unsupported player, please contact [Helpdesk](mailto:dev-support@anypointmedia.com).

### 4. Additional Parameters for Ad Requests – `extraParams`

> When requesting ads using the Flower SDK, passing additional parameters helps the SDK provide the most suitable ads. For mobile web apps, since the SDK cannot determine the ad serving context on its own, these parameters must be passed to the SDK when requesting ads.

#### Parameter List

| Key<br/>(\* indicates web app required) | Value | Example |
| ---| ---| --- |
| serviceId\* | App package name | "tv.anypoint.service" |
| os\* | OS of the device running the app | "Android" |
| adId\* | Ad identifier of the device running the app | Android: Google's GAID value |

### 5. Linear Channel Ad API Call – `changeChannelUrl(...)`

#### FlowerAdsManager.changeChannelUrl()

Function used to change the stream URL for live broadcasts. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | String | Original playback URL |
| adTagUrl | String | Ad tag URL issued by the ad server |
| channelId | String | Unique channel ID<br/>Must be registered in the Flower backend system |
| extraParams | \[String: String\] | Additional pre-agreed information for targeting (_nil_ if none) |
| mediaPlayerHook | MediaPlayerHook | Interface implementation object that returns the video player |
| adTagHeaders | \[String: String\] | (Optional) HTTP header information to add when requesting ads |
| channelStreamHeaders | \[String: String\] | (Optional) HTTP header information to add when requesting the original stream |
| prerollAdTagUrl | String | (Optional) Ad tag URL issued by the ad server for pre-roll |

#### FlowerAdsManager.changeChannelExtraParams()

Function used to change extraParams, the additional targeting information, during live broadcasts. The following describes the parameter:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| extraParams | \[String: String\] | Additional pre-agreed information for targeting |

#### FlowerAdsManager.stop()

API used to stop live broadcasts. No parameters.

## Linear Channel Ad Request Example

```swift
private func playLinearTv() {
    // TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
    // arg0: videoUrl, original LinearTV stream url
    // arg1: adTagUrl, url from flower system
    //       You must file a request to Anypoint Media to receive a adTagUrl.
    // arg2: channelId, unique channel id in your service
    // arg3: extraParams, values you can provide for targeting
    // arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
    // arg5: adTagHeaders, (Optional) values included in headers for ad request
    // arg6: channelStreamHeaders, (Optional) values included in headers for channel stream request
    // arg7: prerollAdTagUrl, (Optional) ad tag URL for pre-roll ads
    let changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        videoUrl: "https://XXX",
        adTagUrl: "https://ad_request",
        channelId: "100",
        extraParams: ["custom-param": "custom-param-value"],
        mediaPlayerHook: mediaPlayerHook,
        adTagHeaders: ["custom-ad-header": "custom-ad-header-value"],
        channelStreamHeaders: ["custom-stream-header": "custom-stream-header-value"],
        prerollAdTagUrl: "https://ad_request?target=preroll"
    )
    player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: changedChannelUrl)!))
}

// TODO GUIDE: change extraParams during stream playback
func onStreamProgramChanged(targetingInfo: String) {
    flowerAdView.adsManager.changeChannelExtraParams(extraParams: ["myTargetingKey": targetingInfo])
}
```
