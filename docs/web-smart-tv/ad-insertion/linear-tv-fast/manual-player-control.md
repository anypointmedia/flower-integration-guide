---
sidebar_position: 2
---

# Manual Player Control

This guide walks you through the complete process of inserting ads into linear TV channels and FAST streams using the Flower SDK. Ad integration follows these steps:
1. **Declare the Ad UI:** Place `FlowerAdView` on the screen to display the ad.
2. **Implement Ad Event Reception:** Implement `FlowerAdsManagerListener` to handle logic at ad playback and completion points.
3. **Pass the Player:** Implement `MediaPlayerHook` to pass player information so the SDK can recognize content playback status.
4. **Configure Additional Parameters (`extraParams`):** Set up additional information required for ad targeting.
5. **Change Linear Channel URL (`changeChannelUrl`):** Change the stream URL by passing information such as ad tag URL and channel ID.
6. **Update Parameters During Playback:** Update targeting information through `changeChannelExtraParams()` during stream playback.

## Step-by-Step Details

### 1. Declare the Ad UI

> Please refer to the Ad Insertion menu > Declare the Ad UI section for ad UI declaration.

### 2. Receiving Ad Events – `FlowerAdsManagerListener`

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
flowerAdView.adsManager.addListener(adsManagerListener);
```

### 3. Passing the Player – `MediaPlayerHook`

> For linear channels, you must pass the player that plays the main content to the SDK.

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

### 5. Linear Channel Ad API Call – `changeChannelUrl(...)`

#### FlowerAdsManager.changeChannelUrl()

Function used to change the stream URL for live broadcasts. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | string | Original playback URL |
| adTagUrl | string | Ad tag URL issued by the ad server |
| channelId | string | Unique channel ID<br/>Must be registered in the Flower backend system |
| extraParams | map | Additional pre-agreed information for targeting (_null_ if none) |
| mediaPlayerHook | MediaPlayerHook | Interface implementation object that returns the video player |
| adTagHeaders | map | (Optional) HTTP header information to add when requesting ads |
| channelStreamHeaders | map | (Optional) HTTP header information to add when requesting the original stream |
| prerollAdTagUrl | string | (Optional) Ad tag URL issued by the ad server for pre-roll |

#### FlowerAdsManager.changeChannelExtraParams()

Function used to change extraParams, the additional targeting information, during live broadcasts. The following describes the parameter:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| extraParams | map | Additional pre-agreed information for targeting |

#### FlowerAdsManager.stop()

API used to stop live broadcasts. No parameters.

## Linear Channel Ad Request Example

:::tip Pre-roll Ads and Playback Start
When you call `changeChannelUrl()`, the SDK returns a stream URL with ad tracking applied. The playback start behavior differs depending on whether `prerollAdTagUrl` is set.

- **If `prerollAdTagUrl` is not set:** Set the returned URL on the player and call `videoElement.play()` directly to start content playback.
- **If `prerollAdTagUrl` is set:** Do not load the returned URL on the player immediately. Instead, remove the existing `FlowerAdsManagerListener` and register a temporary listener. When the temporary listener's `onCompleted()` is called, load the returned URL on the player and start playback, then remove the temporary listener and re-register the original listener.

This approach prevents the main content from briefly flashing on screen before the pre-roll ad starts, and avoids unnecessary network resource consumption caused by the ad and main content loading simultaneously.
:::

### _HLS.js_
```javascript
function playLinearTv() {
    const player = new Hls();
    const videoElement = document.querySelector('video');
    player.attachMedia(videoElement);

    // TODO GUIDE: Create MediaPlayerHook
    const mediaPlayerHook = {
        getPlayer() {
            return player;
        }
    };

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
    // (Optional) Set to null if pre-roll ads are not needed
    const prerollAdTagUrl = 'https://ad_request?target=preroll';

    const changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        'https://XXX',
        'https://ad_request',
        '100',
        { 'custom-param': 'custom-param-value' },
        mediaPlayerHook,
        { 'custom-ad-header': 'custom-ad-header-value' },
        { 'custom-stream-header': 'custom-stream-header-value' },
        prerollAdTagUrl
    );

    if (prerollAdTagUrl == null) {
        // If prerollAdTagUrl is not set, load the returned URL directly and start playback.
        player.loadSource(changedChannelUrl);
        player.on(Hls.Events.MANIFEST_PARSED, function() {
            videoElement.play();
        });
    } else {
        // If prerollAdTagUrl is set, remove the existing listener and register a temporary one.
        // Load the stream URL and start playback after the pre-roll ad completes (onCompleted).
        flowerAdView.adsManager.removeListener(adsManagerListener);

        const prerollListener = {
            onPrepare(adDurationMs) {},
            onPlay() {},
            onCompleted() {
                // Load stream URL and start playback after pre-roll ad completes
                player.loadSource(changedChannelUrl);
                player.on(Hls.Events.MANIFEST_PARSED, function() {
                    videoElement.play();
                });

                // Remove temporary listener and restore the original listener
                flowerAdView.adsManager.removeListener(prerollListener);
                flowerAdView.adsManager.addListener(adsManagerListener);
            },
            onError(error) {
                // Start stream playback and restore listener even on pre-roll ad error
                player.loadSource(changedChannelUrl);
                player.on(Hls.Events.MANIFEST_PARSED, function() {
                    videoElement.play();
                });

                flowerAdView.adsManager.removeListener(prerollListener);
                flowerAdView.adsManager.addListener(adsManagerListener);
            },
            onAdBreakSkipped(reason) {}
        };
        flowerAdView.adsManager.addListener(prerollListener);
    }
}

// TODO GUIDE: change extraParams during stream playback
function onStreamProgramChanged(targetingInfo) {
    flowerAdView.adsManager.changeChannelExtraParams({ myTargetingKey: targetingInfo });
}
```

## Using MediaPlayerAdapter

If you are using a player that is not officially supported by the SDK, you can implement the `MediaPlayerAdapter` interface to directly control the player.

Instead of using `changeChannelUrl()` with `MediaPlayerHook`, you use the `enterChannel()` API with a `MediaPlayerAdapter` implementation.

### FlowerAdsManager.enterChannel(...)

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | Ad tag URL issued by the ad server |
| channelId | string | Unique channel ID<br/>Must be registered in the Flower backend system |
| extraParams | map | Additional pre-agreed information for targeting (_null_ if none) |
| mediaPlayerHook | MediaPlayerHook | Interface implementation object that returns the video player |
| adTagHeaders | map | (Optional) HTTP header information to add when requesting ads |
| mediaPlayerAdapter | MediaPlayerAdapter | MediaPlayerAdapter interface implementation object |

### MediaPlayerAdapter Interface

The `MediaPlayerAdapter` interface requires the following methods:

| **Method** | **Return Type** | **Description** |
| ---| ---| --- |
| getCurrentMedia() | Media | Returns the currently playing media (urlOrId, duration, position) |
| getVolume() | number | Returns the audio volume level (0.0–1.0) |
| isPlaying() | boolean | Returns whether the player is currently playing |
| getHeight() | number | Returns the video height in pixels (0 if unknown) |
| pause() | void | Pauses the playback |
| stop() | void | Stops the playback and releases resources |
| resume() | void | Resumes the playback |
| enqueuePlayItem(playItem) | void | Queues a new play item |
| removePlayItem(playItem) | void | Removes a queued play item |
| playNextItem() | void | Seeks to the next media item in the queue |
| seekToPosition(...) | void | Seeks to the specified position |
| getCurrentAbsoluteTime(isPrintDetails) | number \| null | Returns the current absolute playback time in ms |
| getPlayerType() | string \| null | Returns the player type identifier (for Google PAL SDK) |
| getPlayerVersion() | string \| null | Returns the player version string (for Google PAL SDK) |

### Example

```javascript
class MyPlayerAdapter {
    constructor(player) {
        this.player = player;
    }

    getCurrentMedia() {
        return new Media(
            this.player.currentSource || '',
            Math.round(this.player.duration * 1000),
            Math.round(this.player.currentTime * 1000)
        );
    }

    getVolume() {
        return this.player.volume;
    }

    isPlaying() {
        return !this.player.paused;
    }

    getHeight() {
        return this.player.videoHeight || 0;
    }

    pause() {
        this.player.pause();
    }

    stop() {
        this.player.pause();
        this.player.currentTime = 0;
    }

    resume() {
        this.player.play();
    }

    enqueuePlayItem(playItem) {
        this.player.enqueue(playItem.url);
    }

    removePlayItem(playItem) {
        this.player.removeFromQueue(playItem.url);
    }

    playNextItem() {
        this.player.skipToNext();
    }

    seekToPosition(absoluteStartTimeMs, relativeStartTimeMs, offsetMs, windowDurationMs, periodIndex) {
        if (offsetMs != null) {
            this.player.currentTime = offsetMs / 1000;
        }
    }

    getCurrentAbsoluteTime(isPrintDetails) {
        return this.player.currentTime * 1000;
    }

    getPlayerType() {
        return 'CustomPlayer';
    }

    getPlayerVersion() {
        return '1.0.0';
    }
}

// Usage
const adapter = new MyPlayerAdapter(myCustomPlayer);
const mediaPlayerHook = {
    getPlayer() {
        return myCustomPlayer;
    }
};

flowerAdView.adsManager.enterChannel(
    'https://ad_request',
    '100',
    { 'custom-param': 'custom-param-value' },
    mediaPlayerHook,
    { 'custom-ad-header': 'custom-ad-header-value' },
    adapter
);
```
