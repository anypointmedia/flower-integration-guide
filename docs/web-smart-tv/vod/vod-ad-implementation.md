---
sidebar_position: 3
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
> This allows you to pause or resume the main content during ad playback, and handle playback errors or skip events. This can be implemented as follows:

```javascript
const adsManagerListener = {
    onPrepare(adDurationMs) {
        if (yourPlayer.paused === false) {
            // OPTIONAL GUIDE: additional actions before ad playback
            showNotification("Ads will start in a moment.");
            setTimeout(() => {
                // TODO GUIDE: play midroll ad
                flowerAdView.adsManager.play();
            }, 5000);
        } else {
            // TODO GUIDE: play preroll ad
            flowerAdView.adsManager.play();
        }
    },

    onPlay() {
        // TODO GUIDE: pause VOD content
        yourPlayer.pause();
    },

    onCompleted() {
        // TODO GUIDE: resume VOD content after ad complete
        if (!isContentEnd) {
            yourPlayer.play();
        }
    },

    onError(error) {
        // TODO GUIDE: resume VOD content on ad error
        if (!isContentEnd) {
            yourPlayer.play();
        }
    },

    onAdSkipped(reason) {
        console.log(`onAdSkipped: ${reason}`);
    }
};
flowerAdView.adsManager.addListener(adsManagerListener);
```

### 3. Passing the Player – `MediaPlayerHook`

> To enable ad tracking based on playback status, you must provide the current player instance to the SDK.  
> Implement the `MediaPlayerHook` interface to allow Flower SDK to access playback state and timing information.

#### Supported Players

*   HLS.js
*   Video.js
*   Bitmovin Player

These players pass the current player to the SDK by implementing the `MediaPlayerHook` interface.

#### When Using Unsupported Players

If you are using an unsupported player, please contact [Helpdesk](mailto:dev-support@anypointmedia.com).

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

#### FlowerAdsManager.notifyContentEnded()

Call this API when the VOD content finishes playing. This triggers post-roll ad loading. No parameters required.

```javascript
videoElement.addEventListener('ended', () => {
    isContentEnd = true;
    flowerAdView.adsManager.notifyContentEnded();
});
```

#### FlowerAdsManager.stop()

Call this API when exiting VOD content. No parameters required.

#### FlowerAdsManager.pause()

Call this API used when pausing VOD content. No parameters required.

#### FlowerAdsManager.resume()

Call this API used when resuming VOD content. No parameters required.

## VOD Ad Request Example

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
    flowerAdView.adsManager.requestVodAd(
        'https://ad_request',
        '100',
        3600000,
        { 'custom-param': 'custom-param-value' },
        mediaPlayerHook,
        { 'custom-ad-header': 'custom-ad-header-value' }
    );

    player.loadSource('https://vod_content_url');
    player.on(Hls.Events.MANIFEST_PARSED, function() {
        videoElement.play();
    });
}

// TODO GUIDE: stop SDK when exiting VOD
function onVodExit() {
    flowerAdView.adsManager.stop();
}
```
