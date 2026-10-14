---
sidebar_position: 1
---

# VOD Pre-roll, Mid-roll, Post-roll Ad Implementation

This guide walks you through the complete process of inserting ads into VOD content using the Flower SDK. Ad integration follows these steps:
1. **Declare the Ad UI:** Place `FlowerAdView` on the screen to display the ad.
2. **Implement Ad Event Reception:** Implement `FlowerAdsManagerListener` to handle logic at ad playback and completion points.
3. **Pass the Player:** Implement `MediaPlayerHook` to pass player information so the SDK can recognize content playback status.
4. **Configure Additional Parameters (`extraParams`):** Set up additional information required for ad targeting.
5. **Request VOD Ads (`requestVodAd`):** Request VOD ads by passing information such as ad tag URL and content ID.
6. **Control Playback State**: Call SDK's `pause()`, `resume()`, and `stop()` methods according to content playback flow.

## Step-by-Step Details

### 1. Declare the Ad UI

> Please refer to the Ad Insertion menu > Declare the Ad UI section for ad UI declaration.

### 2. Receiving Ad Events – `FlowerAdsManagerListener`

> To control VOD content playback in response to ad events, implement the `FlowerAdsManagerListener` interface.  
> This allows you to start the main content after the pre-roll, and handle playback errors or skip events. This can be implemented as follows:

:::caution Do not pause, seek, or reload the content player around a VOD ad break
By default (`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`), the SDK plays VOD ads in its own ad player, shown over the content. For a mid-roll, the SDK pauses the content when `onPrepare` is called at the mid-roll's position, and when the ad break ends, seeks the content back by 5 seconds (`rewindDuration`; configurable through `FlowerVodAdConfig` only when using `FlowerAVPlayer`) and resumes it. The SDK does not pause the content for a pre-roll, because the content is not loaded yet. After a post-roll, the content has already ended, so it is not resumed. Do not pause, seek, or reload the content yourself around a VOD ad break, including in `onPlay` and `onError` (see [below](#when-onerror-is-called)).

With `setIgnoreAdBreakInPIPMode(false)`, the SDK plays the ads inside the player it received through `MediaPlayerHook`, so pausing the player stops the ad itself. See [PIP Mode Support](./pip-mode-support) for this mode.
:::

:::info When `onPrepare` is called for a mid-roll
The SDK calls `onPrepare` when the content reaches the mid-roll's position. Call `play()` right away in `onPrepare`.
:::

#### When `onError` is called

For VOD, `onError` is called when:

- **An ad fails to play** in a pre-roll, mid-roll, or post-roll (for example, the ad media cannot be decoded or cannot be reached).
- **The content stops playing and the SDK cannot recover it.** `onError` is called with a message starting with `playback unrecoverable`. Reload the content or show an error to the user.
- **An internal SDK error occurs.**

A failed or timed-out VMAP/VAST request, or a break with no ads, is not an error: the SDK calls `onCompleted` (for no ads, `onAdBreakSkipped(reason: 1)` and then `onCompleted`).

When an ad break fails, the SDK brings the content back **before** it calls `onError`, so the content is already playing again when your handler runs. Handle the error according to where the content is:

- **Pre-roll error** (`isContentPrepared == false`): the content has not started yet. Load the VOD source and start playback, the same as for the pre-roll's `onCompleted`.
- **Mid-roll error** (`isContentEnd == false`): the SDK has already resumed the content `rewindDuration` before the point where the mid-roll interrupted it. Do not stop, seek, or reload the content. Call `player.play()` as a safety net so the content never stays paused; it is harmless if the content is already playing.
- **Post-roll error** (`isContentEnd == true`): the content has already ended. Do not resume it; handle it as the end of playback.

`onCompleted` may also be called for the failed break, before or after `onError`. Make the two handlers safe to run for the same break, for example by checking `isContentPrepared` as below.

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
            // TODO GUIDE: play the ad (pre-roll, mid-roll, post-roll)
            self.playbackView.flowerAdView.adsManager.play()
        }
    }

    func onPlay() {
        // NOTE: Do NOT pause the player here.
        //       The SDK pauses and resumes the content around a mid-roll by itself.
        // OPTIONAL GUIDE: UI-only actions when ad playback starts
        //                 (e.g., hide player controls, show an ad indicator)
    }

    func onCompleted() {
        DispatchQueue.main.async {
            if !self.playbackView.isContentPrepared {
                // TODO GUIDE: load VOD source and start playback after pre-roll completes
                //             (or when no pre-roll ad is served)
                self.playbackView.prepareContentSource()
                self.playbackView.isContentPrepared = true
            } else if !self.playbackView.isContentEnd {
                // NOTE: a mid-roll ad has finished.
                //       The SDK resumes the main VOD content by itself, rewound by rewindDuration.
            } else {
                // TODO GUIDE: a post-roll ad has finished - VOD playback is fully done.
                //             Run any post-playback actions here
                //             (e.g., auto-advance to the next episode, return to the previous screen).
            }
        }
    }

    func onError(error: FlowerError?) {
        // NOTE: When an ad break fails, the SDK brings the content back before calling onError.
        //       Do NOT stop, seek, or reload the content for an ad error.
        os_log(OSLogType.error, log: .default, "onError: %@", error?.message ?? "")
        DispatchQueue.main.async {
            if !self.playbackView.isContentPrepared {
                // TODO GUIDE: the pre-roll ad failed - load VOD source and start playback.
                //             onCompleted may also be called for the same break.
                self.playbackView.prepareContentSource()
                self.playbackView.isContentPrepared = true
            } else if error?.message?.hasPrefix("playback unrecoverable") == true {
                // TODO GUIDE: the content stopped and the SDK will not recover it.
                //             Reload the content or show an error to the user.
            } else if !self.playbackView.isContentEnd {
                // NOTE: a mid-roll ad failed - the SDK has already resumed the content.
                //       Resume it as a safety net (harmless if already playing). No seek, no reload.
                self.playbackView.player.play()
            } else {
                // NOTE: a post-roll ad failed - the content has already ended.
                //       Do not resume it; run your post-playback actions as in onCompleted.
            }
        }
    }

    func onAdBreakSkipped(reason: Int32) {
        os_log(OSLogType.info, log: .default, "onAdBreakSkipped: %d", reason)
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
            // TODO GUIDE: play the ad (pre-roll, mid-roll, post-roll)
            self.flowerAdView.adsManager.play()
        }
    }

    func onPlay() {
        // NOTE: Do NOT pause the player here.
        //       The SDK pauses and resumes the content around a mid-roll by itself.
        // OPTIONAL GUIDE: UI-only actions when ad playback starts
        //                 (e.g., hide player controls, show an ad indicator)
    }

    func onCompleted() {
        DispatchQueue.main.async {
            if !self.isContentPrepared {
                // TODO GUIDE: load VOD source and start playback after pre-roll completes
                //             (or when no pre-roll ad is served)
                self.prepareContentSource()
                self.isContentPrepared = true
            } else if !self.isContentEnd {
                // NOTE: a mid-roll ad has finished.
                //       The SDK resumes the main VOD content by itself, rewound by rewindDuration.
            } else {
                // TODO GUIDE: a post-roll ad has finished - VOD playback is fully done.
                //             Run any post-playback actions here
                //             (e.g., auto-advance to the next episode, return to the previous screen).
            }
        }
    }

    func onError(error: FlowerError?) {
        // NOTE: When an ad break fails, the SDK brings the content back before calling onError.
        //       Do NOT stop, seek, or reload the content for an ad error.
        os_log(OSLogType.error, log: .default, "onError: %@", error?.message ?? "")
        DispatchQueue.main.async {
            if !self.isContentPrepared {
                // TODO GUIDE: the pre-roll ad failed - load VOD source and start playback.
                //             onCompleted may also be called for the same break.
                self.prepareContentSource()
                self.isContentPrepared = true
            } else if error?.message?.hasPrefix("playback unrecoverable") == true {
                // TODO GUIDE: the content stopped and the SDK will not recover it.
                //             Reload the content or show an error to the user.
            } else if !self.isContentEnd {
                // NOTE: a mid-roll ad failed - the SDK has already resumed the content.
                //       Resume it as a safety net (harmless if already playing). No seek, no reload.
                self.player.play()
            } else {
                // NOTE: a post-roll ad failed - the content has already ended.
                //       Do not resume it; run your post-playback actions as in onCompleted.
            }
        }
    }

    func onAdBreakSkipped(reason: Int32) {
        os_log(OSLogType.info, log: .default, "onAdBreakSkipped: %d", reason)
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

> When requesting ads using the Flower SDK, passing additional parameters helps the SDK provide the most suitable ads. For mobile apps, since the SDK cannot determine the ad serving context on its own, these parameters must be passed to the SDK when requesting ads.

#### Parameter List

| Key<br/>(\* indicates mobile app required) | Value | Example |
| ---| ---| --- |
| serviceId\* | App package name | "tv.anypoint.service" |
| os\* | OS of the device running the app | "iOS" |
| adId\* | Ad identifier of the device running the app | iOS: Apple's IDFA value |

### 5. VOD Ad API Call – `requestVodAd(...)`

#### FlowerAdsManager.requestVodAd()

Function used to request ads before entering VOD content. 

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | String | Ad tag URL issued by the ad server |
| contentId | String | Unique content ID<br/>Must be registered in the Flower backend system |
| durationMs | Int64 | Total playback time of VOD content (ms) |
| extraParams | \[String: String\] | Additional pre-agreed information for targeting (_nil_ if none) |
| mediaPlayerHook | MediaPlayerHook | Interface implementation object that returns the video player |
| adTagHeaders | \[String: String\] | (Optional) HTTP header information to add when requesting ads |


#### FlowerAdsManager.notifyContentEnded()

Call this API when the VOD content finishes playing (e.g., `AVPlayerItemDidPlayToEndTime`). This triggers post-roll ad loading. No parameters required.

```swift
// Register observer (target-action pattern)
NotificationCenter.default.addObserver(self, selector: #selector(onEnded), name: .AVPlayerItemDidPlayToEndTime, object: playerItem)

// Handler
@objc private func onEnded() {
    isContentEnd = true
    flowerAdView.adsManager.notifyContentEnded()
}
```

:::note
With `FlowerSdk.setIgnoreAdBreakInPIPMode(false)`, the SDK puts the content back as a new `AVPlayerItem` after each ad break, so an observer registered with `object: playerItem` stops firing. Register the observer with `object: nil` and check the URL of the item that ended. See [PIP Mode Support](./pip-mode-support#handling-player-events).
:::
####  FlowerAdsManager.stop()

Call this API when exiting VOD content. No parameters required.

#### FlowerAdsManager.pause()

Call this API used when pausing VOD content. No parameters required.

#### FlowerAdsManager.resume()

Call this API used when resuming VOD content. No parameters required.

## VOD Ad Request Example

:::tip Defer loading the VOD source until the pre-roll completes
Do not load the main VOD source on the player immediately after calling `requestVodAd(...)`.
Instead, wait for `FlowerAdsManagerListener.onCompleted()` (or `onError()`), check whether the content has not yet been prepared (e.g., `isContentPrepared == false`), and only then load the VOD source and start playback.

If the VOD source is loaded right after `requestVodAd(...)`, the first frame of the main content may briefly appear before the pre-roll ad starts.
:::

```swift
// TODO GUIDE: request vod ad
// arg0: adTagUrl, url from flower system.
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: contentId, unique content id in your service
// arg2: durationMs, duration of vod content in milliseconds
// arg3: extraParams, values you can provide for targeting
// arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
// arg5: adTagHeaders, (Optional) values included in headers for ad request
//
// NOTE: Do NOT load the VOD source on the player here.
//       The VOD source must be loaded inside FlowerAdsManagerListener.onCompleted()
//       (see step 2) so it is played after the pre-roll ad finishes.
flowerAdView.adsManager.requestVodAd(
    adTagUrl: "https://ad_request",
    contentId: "100",
    durationMs: 3600000,
    extraParams: nil,
    mediaPlayerHook: mediaPlayerHook,
    adTagHeaders: ["custom-ad-header": "custom-ad-header-value"]
)
```
