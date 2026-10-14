---
sidebar_position: 2
---

# VOD Pre-roll, Mid-roll, Post-roll Ad Implementation

This guide walks you through the complete process of inserting ads into VOD content using the Flower SDK. Ad integration follows these steps:
1. **Declare the Ad UI:** Place `FlowerAdView` on the screen to display the ad.
2. **Implement Ad Event Reception:** Implement `FlowerAdsManagerListener` to handle logic at ad playback and completion points.
3. **Pass the Player:** Implement `MediaPlayerHook` to pass player information so the SDK can recognize content playback status.
4. **Configure Additional Parameters (`extraParams`):** Set up additional information required for ad targeting.
5. **Request VOD Ads (`requestVodAd`):** Request VOD ads by passing information such as ad tag URL and content ID.
6. **Control Playback State**: Call SDK's `pause()`, `resume()`, and `stop()` methods according to content playback flow.

## Step-by-Step Details

### 1. Declare the Ad UI

> Please refer to the Ad Insertion menu > Declare the Ad UI section for ad UI declaration.

### 2. Receiving Ad Events – `FlowerAdsManagerListener`

> To control VOD content playback in response to ad events, implement the `FlowerAdsManagerListener` interface.
> This allows you to start the main content after the pre-roll, and handle playback errors or skip events. This can be implemented as follows:

:::caution Do not pause, seek, or reload the content player around a VOD ad break
By default (`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`), the SDK plays VOD ads in its own ad player, shown over the content. For a mid-roll, the SDK pauses the content when `onPrepare` is called at the mid-roll position, and when the ad break ends, seeks the content back by `rewindDuration` (5 seconds by default) and resumes it. After a post-roll, the content has already ended, so it is not resumed. Do not pause, seek, or reload the content yourself around a VOD ad break, including in `onPlay` and `onError`.

With `setIgnoreAdBreakInPIPMode(false)`, the SDK plays the ads inside the player it received through `MediaPlayerHook`, so pausing the player stops the ad itself. See [PIP Mode Support](./pip-mode-support) for this mode.
:::

:::info When `onPrepare` is called for a mid-roll
The SDK requests a mid-roll ad in advance, and calls `onPrepare` when the content reaches the mid-roll's position. Call `play()` right away in `onPrepare`.
:::

:::info When `onError` is called
For VOD, the SDK calls `onError` when:
- **An ad fails to play** in a pre-roll, mid-roll, or post-roll (for example, the ad media cannot be decoded or cannot be reached).
- **The content stops playing and the SDK will not recover it.** See "When the content cannot be played" below.
- **An internal SDK error occurs.**

A failed or timed-out VMAP/VAST request, or a break with no ads, is not an error: the SDK calls `onCompleted` (for no ads, `onAdBreakSkipped(1)` and then `onCompleted`).
:::

:::info Handling `onError` for a failed ad break
When an ad break fails, the SDK brings the content back **before** it calls `onError`, so the content is already playing again when your handler runs.
- **Pre-roll error** (`!isContentPrepared`): the content has not started yet. Load the VOD source and start playback, as after a completed pre-roll.
- **Mid-roll error**: the SDK has already resumed the content `rewindDuration` before the point where the mid-roll interrupted it. Do not stop, seek, or reload the content. Resume it as a safety net (`player.playWhenReady = true`, or `player.play()` for Bitmovin); this is harmless if it is already playing.
- **Post-roll error** (`isContentEnd`): the content has already ended. Run the end-of-playback scenario, as after a completed post-roll.

`onCompleted` may also be called for the failed break, before or after `onError`. Make the two handlers safe to run for the same break, for example by checking `isContentPrepared` as below.
:::

:::info When the content cannot be played
When content playback stops and the SDK cannot recover it, `onError` is called with a message that starts with `playback unrecoverable`. For VOD, reload the content or show an error to the user.

With `setIgnoreAdBreakInPIPMode(false)`, one ad failure can be reported to `onError` twice.
:::

```kotlin
val adsManagerListener = object : FlowerAdsManagerListener {
    override fun onPrepare(adDurationMs: Int) {
        CoroutineScope(Dispatchers.Main).launch {
            // TODO GUIDE: play the ad (pre-roll, mid-roll, post-roll)
            flowerAdView.adsManager.play()
        }
    }

    override fun onPlay() {
        // NOTE: Do NOT pause the player here.
        //       The SDK pauses and resumes the content around a mid-roll by itself.
        // OPTIONAL GUIDE: UI-only actions when ad playback starts
        //                 (e.g., hide player controls, show an ad indicator)
    }

    override fun onCompleted() {
        CoroutineScope(Dispatchers.Main).launch {
            if (!isContentPrepared) {
                // TODO GUIDE: load VOD source and start playback after pre-roll completes
                //             (or when no pre-roll ad is served)
                prepareContentSource()
                isContentPrepared = true
            } else if (!isContentEnd) {
                // NOTE: a mid-roll ad has finished.
                //       The SDK resumes the main VOD content by itself, rewound by rewindDuration.
            } else {
                // TODO GUIDE: a post-roll ad has finished - VOD playback is fully done.
                //             Run any post-playback actions here
                //             (e.g., auto-advance to the next episode, return to the previous screen).
            }
        }
    }

    override fun onError(error: FlowerError?) {
        // NOTE: When an ad break fails, the SDK brings the content back before calling onError.
        //       Do NOT stop, seek, or reload the content for an ad error.
        logger.warn { "onError: ${error?.message}" }
        CoroutineScope(Dispatchers.Main).launch {
            if (!isContentPrepared) {
                // TODO GUIDE: the pre-roll ad failed - load VOD source and start playback.
                //             onCompleted may also be called for the same break.
                prepareContentSource()
                isContentPrepared = true
            } else if (error?.message?.startsWith("playback unrecoverable") == true) {
                // TODO GUIDE: the content stopped and the SDK will not recover it.
                //             Reload the content or show an error to the user.
            } else if (isContentEnd) {
                // TODO GUIDE: a post-roll ad failed - VOD playback is fully done.
                //             Run the same post-playback actions as in onCompleted.
            } else {
                // NOTE: a mid-roll ad failed - the content is normally already playing again.
                //       Resuming is a harmless safety net (Bitmovin: player.play()).
                player.playWhenReady = true
            }
        }
    }

    override fun onAdBreakSkipped(reason: Int) {
        logger.info { "onAdBreakSkipped: $reason" }
    }
}
flowerAdView.adsManager.addListener(adsManagerListener)
```

### 3. Passing the Player – `MediaPlayerHook`

> To enable ad tracking based on playback status, you must provide the current player instance to the SDK.
> Implement the `MediaPlayerHook` interface to allow Flower SDK to access playback state and timing information.

#### Supported Players

*   ExoPlayer2
*   Media3 ExoPlayer
*   Bitmovin Player

These players pass the current player to the SDK by implementing the `MediaPlayerHook` interface. 

#### When Using Unsupported Players

If you are using an unsupported player, please contact [Helpdesk](mailto:dev-support@anypointmedia.com).

### 4. Additional Parameters for Ad Requests – `extraParams`

> When requesting ads using the Flower SDK, passing additional parameters helps the SDK provide the most suitable ads. For mobile apps, since the SDK cannot determine the ad serving context on its own, these parameters must be passed to the SDK when requesting ads.

#### Parameter List

| Key<br/>(\* indicates required for web apps) | Value | Example |
| ---| ---| --- |
| serviceId\* | App package name | "tv.anypoint.service" |
| os\* | OS of the device running the app | "Web" |
| adId\* | Ad identifier of the device running the app | Web: User identifier or session ID |

### 5. VOD Ad API Call – `requestVodAd(...)`

#### FlowerAdsManager.requestVodAd()

Function used to request ads before entering VOD content. 

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | Ad tag URL issued by Flower backend system.<br/>You must file a request to Anypoint Media to receive a adTagUrl. |
| contentId | string | Unique content ID.<br/>Must be registered in Flower backend system. |
| durationMs | long | Duration of VOD content in milliseconds. |
| extraParams | map | (Optional) Additional information pre-agreed for targeting. |
| mediaPlayerHook | MediaPlayerHook | Interface implementation object that returns video player. |
| adTagHeaders | map | (Optional) HTTP header information to add for ad requests. |

#### FlowerAdsManager.notifyContentEnded()

Call this API when the VOD content finishes playing (e.g., `Player.STATE_ENDED`). This triggers post-roll ad loading. No parameters required.

```kotlin
// Detect content end
player.addListener(object : Player.Listener {
    override fun onPlaybackStateChanged(playbackState: Int) {
        if (playbackState == Player.STATE_ENDED) {
            isContentEnd = true
            flowerAdView.adsManager.notifyContentEnded()
        }
    }
})
```

:::note
With `FlowerSdk.setIgnoreAdBreakInPIPMode(false)`, ads are played as media items in the content player, so `STATE_ENDED` also occurs around ad breaks. Check that the current media item is the content before calling `notifyContentEnded()`. See [PIP Mode Support](./pip-mode-support#handling-player-events).
:::

#### FlowerAdsManager.stop()

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

```kotlin
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
    adTagUrl = "https://ad_request",
    contentId = "100",
    durationMs = 3_600_000L,
    extraParams = mapOf("custom-param" to "custom-param-value"),
    mediaPlayerHook = { player },
    adTagHeaders = mapOf("custom-ad-header" to "custom-ad-header-value"),
)

// TODO GUIDE: stop SDK when exiting VOD
fun onVodExit() {
    flowerAdView.adsManager.stop()
}
```