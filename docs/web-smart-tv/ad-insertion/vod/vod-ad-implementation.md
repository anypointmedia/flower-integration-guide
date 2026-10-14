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
By default (`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`), the SDK plays VOD ads in its own video element, shown over the content. For a mid-roll, the SDK pauses the content when the ad break starts, and when the ad break ends, seeks the content back by `rewindDuration` (5 seconds by default) and resumes it. After a post-roll, the content has already ended, so it is not resumed. Do not pause, seek, or reload the content yourself around a VOD ad break, including in `onPlay` and `onError()` (see `onError()` below).

With `setIgnoreAdBreakInPIPMode(false)`, the SDK plays the ads inside the HLS.js or Bitmovin player it received through `MediaPlayerHook`, so pausing the player stops the ad itself. See [PIP Mode Support](../../getting-started/pip-mode-support) for this mode.
:::

:::info When `onPrepare` is called for a mid-roll
The SDK calls `onPrepare` when the content reaches the mid-roll's position. Call `play()` right away in `onPrepare`.
:::

```javascript
const adsManagerListener = {
    onPrepare(adDurationMs) {
        // TODO GUIDE: play the ad (pre-roll, mid-roll, post-roll)
        flowerAdView.adsManager.play();
    },

    onPlay() {
        // NOTE: Do NOT pause the player here.
        //       The SDK pauses and resumes the content around a mid-roll by itself.
        // OPTIONAL GUIDE: UI-only actions when ad playback starts
        //                 (e.g., hide player controls, show an ad indicator)
    },

    onCompleted() {
        if (!isContentPrepared) {
            // TODO GUIDE: load VOD source and start playback after pre-roll completes
            //             (or when no pre-roll ad is served)
            prepareContentSource();
            isContentPrepared = true;
        } else if (!isContentEnd) {
            // NOTE: a mid-roll ad has finished.
            //       The SDK resumes the main VOD content by itself, rewound by rewindDuration.
        } else {
            // TODO GUIDE: a post-roll ad has finished - VOD playback is fully done.
            //             Run any post-playback actions here
            //             (e.g., auto-advance to the next episode, return to the previous screen).
        }
    },

    onError(error) {
        console.warn(`onError: ${error?.message}`);
        if (!isContentPrepared) {
            // TODO GUIDE: load VOD source when pre-roll ad fails
            //             (onCompleted() may also be called; isContentPrepared keeps the content from loading twice)
            prepareContentSource();
            isContentPrepared = true;
        } else if (error?.message?.startsWith('playback unrecoverable')) {
            // TODO GUIDE: the content stopped and the SDK will not recover it.
            //             Reload the content or show an error to the user.
        } else if (!isContentEnd) {
            // Mid-roll ad error: resume the content as a safety net - play() only, no seek or reload.
            //                    The content is normally already playing again, so this is harmless.
            videoElement.play();  // Bitmovin: player.play()
        }
        // NOTE: post-roll ad error (isContentEnd) - playback is over, nothing to resume.
    },

    onAdBreakSkipped(reason) {
        console.log(`onAdBreakSkipped: ${reason}`);
    }
};
flowerAdView.adsManager.addListener(adsManagerListener);
```

:::info When `onError()` is called
For VOD, the SDK calls `onError()` when:
- **An ad fails to play** in a pre-roll, mid-roll, or post-roll (for example, the ad media cannot be decoded or cannot be reached).
- **Content playback stops and the SDK cannot recover it.** `onError()` is called with a message starting with `playback unrecoverable`. Reload the content or show an error to the user.

A failed or timed-out VMAP/VAST request, or a break with no ads, is not an error: the SDK calls `onCompleted()` (for no ads, `onAdBreakSkipped(1)` and then `onCompleted()`).
:::

:::info The content is already playing when `onError()` is called
When an ad break fails, the SDK brings the content back **before** it calls `onError()`:
- **Pre-roll error**: the content has not started yet. Load and start it, as after a completed pre-roll.
- **Mid-roll error**: the SDK has already resumed the content `rewindDuration` before the point where the mid-roll interrupted it. Do not stop, seek, or reload the content. Resume it with `videoElement.play()` (Bitmovin: `player.play()`) as a safety net; this is harmless if it is already playing.
- **Post-roll error**: the content has already ended. Do not resume it.

`onCompleted()` may also be called for the same ad break, before or after `onError()`. Keep the `isContentPrepared` and `isContentEnd` checks so the content is never loaded twice. With `setIgnoreAdBreakInPIPMode(false)`, `onError()` can be called twice for one failure.
:::

### 3. Passing the Player – `MediaPlayerHook`

> To enable ad tracking based on playback status, you must provide the current player instance to the SDK.  
> Implement the `MediaPlayerHook` interface to allow Flower SDK to access playback state and timing information.

#### Supported Players

*   HLS.js
*   Bitmovin Player
*   dash.js
*   Shaka Player

These players pass the current player to the SDK by implementing the `MediaPlayerHook` interface.

#### When Using Unsupported Players

Other players, such as Video.js, are not supported. With an unsupported player, the SDK does not insert VOD ads and does not call `FlowerAdsManagerListener`. If you are using an unsupported player, please contact [Helpdesk](mailto:dev-support@anypointmedia.com).

### 4. Additional Parameters for Ad Requests – `extraParams`

> When requesting ads using the Flower SDK, passing additional parameters helps the SDK provide the most suitable ads. For web apps, since the SDK cannot determine the ad serving context on its own, these parameters must be passed to the SDK when requesting ads.

#### Parameter List

| Key<br/>(\* indicates required for web apps) | Value | Example |
| ---| ---| --- |
| serviceId\* | App package name | "tv.anypoint.service" |
| os\* | OS of the device running the app | "Web" |
| adId\* | Ad identifier of the device running the app | Web: User identifier or session ID |

### 5. VOD Ad API Call – `requestVodAd(...)`

#### FlowerAdsManager.requestVodAd()

Function used to request ads before entering VOD content. 

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | Ad tag URL issued by the ad server |
| contentId | string | Unique content ID<br/>Must be registered in the Flower backend system |
| durationMs | number | Total playback time of VOD content (ms) |
| extraParams | map | Additional pre-agreed information for targeting (_null_ if none) |
| mediaPlayerHook | MediaPlayerHook | Interface implementation object that returns the video player |
| adTagHeaders | map | (Optional) HTTP header information to add when requesting ads |
| requestTimeout | number | (Optional) Timeout for requesting a VOD ad (ms). Default is 5000. |
| minPrepareDuration | number | (Optional) Preparation lead time (ms). A mid-roll ad is requested `requestTimeout + minPrepareDuration` before the mid-roll's position, and `onPrepare` is called when the content reaches that position. Default is 5000. |
| rewindDuration | number | (Optional) Duration to rewind the content when a mid-roll ad break ends (ms). The content resumes this much earlier than the point where it was interrupted. Rewinding does not make the same mid-roll play again. Default is 5000. |

`requestTimeout`, `minPrepareDuration` and `rewindDuration` are optional trailing parameters. Omitting them or passing `null` keeps the default.

#### FlowerAdsManager.notifyContentEnded()

Call this API when the VOD content finishes playing. This triggers post-roll ad loading. No parameters required.

```javascript
videoElement.addEventListener('ended', () => {
    isContentEnd = true;
    flowerAdView.adsManager.notifyContentEnded();
});
```

:::note
With `FlowerSdk.setIgnoreAdBreakInPIPMode(false)`, ads are played in the content player, so the `ended` event also occurs when each ad ends. Check that the current source is the content before calling `notifyContentEnded()`. See [PIP Mode Support](../../getting-started/pip-mode-support#handling-player-events).
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
Instead, wait for the first `FlowerAdsManagerListener.onCompleted()` (or `onError()`), check whether the content has not yet been prepared (e.g., `isContentPrepared === false`), and only then load the VOD source and start playback.

By default (`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`), the SDK does not pause the content for a pre-roll. If the VOD source is loaded right after `requestVodAd(...)`, the main content actually plays, with its audio, under the pre-roll ad.

The SDK calls `onCompleted()` even when there is no pre-roll, no ad is served, or the ad request fails, so the content always starts from this callback. After the content has been prepared, do not load, play, pause, or seek the content in `onCompleted()`, because the SDK resumes the content by itself after a mid-roll. In `onError()`, do not load, pause, or seek it either; handle it as described in [`onError()`](#2-receiving-ad-events-floweradsmanagerlistener) above.
:::

### _HLS.js_

```javascript
function playVod() {
    const player = new Hls();
    const videoElement = document.querySelector('video');
    player.attachMedia(videoElement);

    // TODO GUIDE: Create MediaPlayerHook
    const mediaPlayerHook = {
        getPlayer() {
            return player;
        }
    };

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
        'https://ad_request',
        '100',
        3600000,
        { 'custom-param': 'custom-param-value' },
        mediaPlayerHook,
        { 'custom-ad-header': 'custom-ad-header-value' }
    );
}

// TODO GUIDE: load VOD source. Called from FlowerAdsManagerListener.onCompleted()
//             (or onError()) after the pre-roll ad finishes.
function prepareContentSource() {
    yourPlayer.loadSource('https://vod_content_url');
    yourPlayer.on(Hls.Events.MANIFEST_PARSED, function() {
        videoElement.play();
    });
}

// TODO GUIDE: stop SDK when exiting VOD
function onVodExit() {
    flowerAdView.adsManager.stop();
}
```
