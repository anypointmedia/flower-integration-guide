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
        // TODO GUIDE: on error, stop the ads manager, release the player, and restart the channel
        // FlowerHls.destroy() releases both HLS.js instances and calls adsManager.stop() itself.
        // (Optional) Count restarts and stop retrying after a few attempts so a broken channel does not loop.
        hls.removeAdListener(adsManagerListener);
        hls.destroy();
        initHls();      // new FlowerHls + attachContainer(), same as the first start
        // A restart leaves the channel pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it.
        playLinearTv({ withPreroll: false }); // setAdConfig() without prerollAdTagUrl -> addAdListener() -> loadSource()
    },

    onAdBreakSkipped(reason) {
        console.log(`onAdBreakSkipped: ${reason}`);
    }
};
// Register the listener with FlowerHls
hls.addAdListener(adsManagerListener);
```

:::info Recovering from `onError()`
When `onError()` is called, stop the ads manager, release the player, and start the channel again. With FlowerHls, `hls.destroy()` does the first two steps: it destroys the HLS.js instances and calls `stop()` on the ads manager of that FlowerHls. Create a new FlowerHls and load the channel again, because a destroyed FlowerHls cannot be reused.

A restart leaves the channel pre-roll out (`prerollAdTagUrl` omitted): the viewer has already seen it. Pass `setAdConfig()` the same values as the first start but without `prerollAdTagUrl`, so the channel stream plays right away. The first start of a channel and a switch to another channel use the pre-roll as configured.

Remove the listener before `destroy()`. `stop()` ends any ad break in progress and can still call `onCompleted()` for that break afterwards; once the listener is removed from the old instance, that late call does not reach it.
:::

## Pre-roll Ads

A channel pre-roll is an ad that plays once when the viewer enters a channel, before the channel stream starts. To enable it, set `prerollAdTagUrl` in the `FlowerLinearTvAdConfig` passed to `setAdConfig()`.

FlowerHls handles the pre-roll itself. `loadSource()` loads the stream and requests the pre-roll; when the pre-roll is ready, the SDK plays it in a video element of its own over the stream and pauses the stream, and when the pre-roll ends, it resumes the stream. Unlike [manual player control](./manual-player-control.md#pre-roll-ads), the app needs no temporary listener and must not pause or delay the stream itself.

- Listeners registered with `addAdListener()` also receive `onPrepare()`, `onPlay()`, and `onCompleted()` for the pre-roll.
- When there is no pre-roll ad, the ad request fails, or the pre-roll fails to play, the SDK calls `onCompleted()` (not `onError()`) and the stream resumes.
- A restart after `onError()` leaves the pre-roll out, as described above. A channel change (`setAdConfig()` and `loadSource()` for the next channel) stops a pre-roll still in progress and requests the new channel's pre-roll.
- With the default `FlowerSdk.setIgnoreAdBreakInPIPMode(true)`, the pre-roll is paused when the app enters PIP and resumed when it returns. See [PIP Mode Support](../../getting-started/pip-mode-support.md).

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

// withPreroll: true for the first start of a channel, false for a restart after onError()
function playLinearTv({ withPreroll = true } = {}) {
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
    // A restart leaves the channel pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it.
    if (withPreroll) {
        adConfig.prerollAdTagUrl = 'https://preroll_ad_request';
    }

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
            // TODO GUIDE: stop the ads manager, release the player, and restart the channel
            // hls.destroy() also calls adsManager.stop(). Remove the listener first so a late
            // onCompleted() of a stopped ad break does not reach it.
            hls.removeAdListener(adsManagerListener);
            hls.destroy();
            initHls();
            playLinearTv({ withPreroll: false });  // restart without the channel pre-roll
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
