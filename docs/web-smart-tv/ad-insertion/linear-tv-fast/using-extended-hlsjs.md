---
sidebar_position: 1
---

# Using Extended HLS.js

The Flower SDK provides the FlowerHls wrapper class for services using HLS.js to insert ads. This maintains compatibility with existing HLS.js while enabling ad integration with minimal changes.

Using these wrapper players is more convenient than manually controlling ad insertion, as they simplify the integration process. You can also subclass these players for further customization. However, when overriding methods, **it is essential to call the superclass implementation** to ensure proper behavior.

## Work Process

![](/img/docs/59f47f41-6cf3-4f9e-a2bf-79ce46a14172.png)
![](/img/docs/3a3ca3ac-838e-408f-a35f-59b2e256a564.png)
1. Replace HLS instance creation from HLS.js to FlowerHls in existing code using HLS.js.
2. Create an ad configuration object with appropriate values such as the pre-issued Tag URL. The objects used are:
    1. For linear channels / FAST: `{ adTagUrl, channelId, extraParams, ... }`
3. Before loading the stream, pass the ad configuration object to the player using the `setAdConfig()` API.

    Note: This step is mandatory to enable ads.

4. If necessary, register an ad event listener. The ad event listener can be created by implementing the FlowerAdsManagerListener object.
5. Load and play the stream.

Below are the Flower SDK APIs used in the example code.

## FlowerHls

A wrapper class that extends the existing HLS.js class to enable ad integration through connection with the Flower backend system.

### FlowerHls.attachContainer

Attaches the HLS player to a DOM container. This method internally creates a video element and calls HLS.js's attachMedia.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| container | HTMLElement | DOM container where the video player will be inserted |

### FlowerHls.setAdConfig

Sets ad configuration for the player. To apply ads, this method must be called to set the ad configuration before loading the stream.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| config | FlowerLinearTvAdConfig | Information required for ad insertion |
| config.adTagUrl | string | Ad tag URL issued by the Flower backend system |
| config.prerollAdTagUrl | string | (Optional) Ad tag URL issued by the Flower backend system for pre-roll |
| config.channelId | string | Unique channel ID<br/>Must be registered in the Flower backend system |
| config.extraParams | map | (Optional) Additional pre-agreed information for targeting |
| config.adTagHeaders | map | (Optional) HTTP header information to add when requesting ads |
| config.channelStreamHeaders | map | (Optional) HTTP header information to add when requesting the original stream |

### FlowerHls.addAdListener

Adds an ad event listener to the player. If the listener is already registered, nothing happens.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| listener | FlowerAdsManagerListener | Ad event listener to add |

### FlowerHls.removeAdListener

Removes an ad event listener from the player. If the listener is not registered, nothing happens.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| listener | FlowerAdsManagerListener | Ad event listener to remove |

## Receiving Ad Events – FlowerAdsManagerListener

> **When inserting ads into linear channels**, ads that replace the main stream are played through ad markers (e.g., SCTE-35). **UI control and other logic may be needed** at ad playback start/end points. For this purpose, the Flower SDK provides **a listener object for receiving ad events**, which can be implemented as follows.

```javascript
const adsManagerListener = {
    onPrepare(adDurationMs) {
        // TODO GUIDE: need nothing for linear tv
    },

    onPlay() {
        // OPTIONAL GUIDE: enable additional actions for ad playback
        hidePlayerControls();
    },

    onCompleted() {
        // OPTIONAL GUIDE: disable additional actions after ad complete
        showPlayerControls();
    },

    onError(error) {
        // TODO GUIDE: restart to play Linear TV on ad error
        releasePlayer();
        playLinearTv();
    },

    onAdBreakSkipped(reason) {
        console.log(`onAdBreakSkipped: ${reason}`);
    }
};
// Register the listener with FlowerHls
hls.addAdListener(adsManagerListener);
```

## Linear Channel Ad Request Example

### _Plain HTML/JavaScript_
```javascript
// Initialize SDK
FlowerSdk.init();
FlowerSdk.setLogLevel('Debug');

let hls = null;
let adsManagerListener = null;

function initHls() {
    // TODO GUIDE: Replace your HLS.js with FlowerHls
    hls = new FlowerHls();
    hls.attachContainer(document.getElementById('video-container'));

    hls.on(Hls.Events.MANIFEST_PARSED, function() {
        hls.media.play();
    });
}

function playLinearTv() {
    const videoUrl = 'https://video_url';

    // TODO GUIDE: Configure linear tv ad
    // adTagUrl: url from flower system
    //       You must file a request to Anypoint Media to receive a adTagUrl.
    // prerollAdTagUrl: (Optional) url for linear tv preroll ads from flower system
    //       You must file a request to Anypoint Media to receive a prerollAdTagUrl.
    // channelId: unique channel id in your service
    // extraParams: (Optional) values you can provide for targeting
    // adTagHeaders: (Optional) values included in headers for ad request
    // channelStreamHeaders: (Optional) values included in headers for channel stream request
    const adConfig = {
        adTagUrl: 'https://ad_request',
        prerollAdTagUrl: 'https://preroll_ad_request',
        channelId: '1',
        extraParams: {
            title: 'My Summer Vacation',
            genre: 'horror',
            contentRating: 'PG-13'
        },
        adTagHeaders: {
            'custom-ad-header': 'custom-ad-header-value'
        },
        channelStreamHeaders: {
            'custom-stream-header': 'custom-stream-header-value'
        }
    };

    // TODO GUIDE: FlowerAdConfig should be delivered before calling loadSource()
    hls.setAdConfig(adConfig);

    // OPTIONAL GUIDE: Implement FlowerAdsManagerListener to receive ad events
    adsManagerListener = {
        onPrepare(adDurationMs) {
            // OPTIONAL GUIDE: Implement custom actions for when the ad playback is prepared
        },
        onPlay() {
            // OPTIONAL GUIDE: Implement custom actions for when the ad playback starts
            hidePlayerControls();
        },
        onCompleted() {
            // OPTIONAL GUIDE: Implement custom actions for when the ad playback ends
            showPlayerControls();
        },
        onError(error) {
            // OPTIONAL GUIDE: Implement custom actions for when the error occurs in Flower SDK
        },
        onAdBreakSkipped(reason) {
            // OPTIONAL GUIDE: Implement custom actions for when the ad playback is skipped
        }
    };

    // OPTIONAL GUIDE: Register FlowerAdsManagerListener to receive ad events
    hls.addAdListener(adsManagerListener);

    hls.loadSource(videoUrl);
}

function stopPlayback() {
    hls.removeAdListener(adsManagerListener);
    hls.stopLoad();
    hls.destroy();
}

// Initialize and start playback
initHls();
playLinearTv();
```
