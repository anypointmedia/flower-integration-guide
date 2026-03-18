---
sidebar_position: 3
---

# VOD Pre-roll, Mid-roll, Post-roll Ad Implementation

This guide walks you through the complete process of inserting ads into VOD content using the Flower SDK. Ad integration follows these steps:
1. **Declare the Ad UI:** Place `FlowerAdView` on the screen to display the ad.
2. **Implement Ad Event Reception:** Implement `FlowerAdsManagerListener` to handle logic at ad playback and completion points.
3. **Pass the Player:** Implement `MediaPlayerHook` to pass player information so the SDK can recognize content playback status.
4. **Configure Additional Parameters (****`extraParams`****):** Set up additional information required for ad targeting.
5. **Request VOD Ads (****`requestVodAd`****):** Request VOD ads by passing information such as ad tag URL and content ID.
6. **Control Playback State**: Call SDK's `pause()`, `resume()`, and `stop()` methods according to content playback flow.

## Step-by-Step Details

### 1. Declare the Ad UI

> Please refer to the Ad Insertion menu > Declare the Ad UI section for ad UI declaration.

### 2. Receiving Ad Events – `FlowerAdsManagerListener`

> To control VOD content playback in response to ad events, implement the `FlowerAdsManagerListener` interface.  

> This allows you to pause or resume the main content during ad playback, and handle playback errors or skip events. This can be implemented as follows:

#### _SwiftUI_
```swift
// TODO GUIDE: Implement FlowerAdsManagerListener
class FlowerAdsManagerListenerImpl: FlowerAdsManagerListener {
    var playbackView: PlaybackView

    init(_ playbackView: PlaybackView) {
        self.playbackView = playbackView
    }

    func onPrepare(adDurationMs: Int32) {
        DispatchQueue.main.async {
            if (self.playbackView.player.rate != 0.0) {
                Task {
                    // OPTIONAL GUIDE: additional actions before ad playback
                    self.playbackView.showNotification("Ads will start in a moment.")
                    try await Task.sleep(nanoseconds: 5_000_000_000)

                    // TODO GUIDE: play midroll ad
                    self.playbackView.flowerAdView.adsManager.play()
                }
            } else {
                // TODO GUIDE: play preroll ad
                self.playbackView.flowerAdView.adsManager.play()
            }
        }
    }

    func onPlay() {
        DispatchQueue.main.async {
            // TODO GUIDE: pause VOD content
            self.playbackView.player.pause()
        }
    }

    func onCompleted() {
        DispatchQueue.main.async {
            // TODO GUIDE: resume VOD content after ad complete
            if !self.playbackView.isContentEnd {
                self.playbackView.player.play()
            }
        }
    }

    func onError(error: FlowerError?) {
        DispatchQueue.main.async {
            // TODO GUIDE: resume VOD content on ad error
            if !self.playbackView.isContentEnd {
                self.playbackView.player.play()
            }
        }
    }

    func onAdSkipped(reason: Int32) {
        os_log(OSLogType.info, log: .default, "onAdSkipped: %d", reason)
    }
}

let adsManagerListener = FlowerAdsManagerListenerImpl(self)
flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
```

#### _UIKit_
```swift
// TODO GUIDE: Implement FlowerAdsManagerListener
extension PlayerViewController: FlowerAdsManagerListener {
    func onPrepare(adDurationMs: Int32) {
        DispatchQueue.main.async {
            if (self.player.rate != 0.0) {
                Task {
                    // OPTIONAL GUIDE: additional actions before ad playback
                    self.showNotification("Ads will start in a moment.")
                    try await Task.sleep(nanoseconds: 5_000_000_000)

                    // TODO GUIDE: play midroll ad
                    self.flowerAdView.adsManager.play()
                }
            } else {
                // TODO GUIDE: play preroll ad
                self.flowerAdView.adsManager.play()
            }
        }
    }

    func onPlay() {
        DispatchQueue.main.async {
            // TODO GUIDE: pause VOD content
            self.player.pause()
        }
    }

    func onCompleted() {
        DispatchQueue.main.async {
            // TODO GUIDE: resume VOD content after ad complete
            if !self.isContentEnd {
                self.player.play()
            }
        }
    }

    func onError(error: FlowerError?) {
        DispatchQueue.main.async {
            // TODO GUIDE: resume VOD content on ad error
            if !self.isContentEnd {
                self.player.play()
            }
        }
    }

    func onAdSkipped(reason: Int32) {
        os_log(OSLogType.info, log: .default, "onAdSkipped: %d", reason)
    }
}

flowerAdView.adsManager.addListener(adsManagerListener: self)
```

### 3. Passing the Player – `MediaPlayerHook`

> To enable ad tracking based on playback status, you must provide the current player instance to the SDK.  

> Implement the `MediaPlayerHook` interface to allow Flower SDK to access playback state and timing information.

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

### 5. VOD Ad API Call – `requestVodAd(...)`

#### FlowerAdsManager.requestVodAd()

Function used to request ads before entering VOD content. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | String | Ad tag URL issued by the ad server |
| contentId | String | Unique content ID<br/>Must be registered in the Flower backend system |
| durationMs | Int64 | Total playback time of VOD content (ms) |
| extraParams | \[String: String\] | Additional pre-agreed information for targeting (_nil_ if none) |
| mediaPlayerHook | MediaPlayerHook | Interface implementation object that returns the video player |
| adTagHeaders | \[String: String\] | (Optional) HTTP header information to add when requesting ads |

####  FlowerAdsManager.stop()

Call this API when exiting VOD content. No parameters required.

#### FlowerAdsManager.pause()

Call this API used when pausing VOD content. No parameters required.

#### FlowerAdsManager.resume()

Call this API used when resuming VOD content. No parameters required.

### VOD Ad Request Example

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
