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
        // TODO GUIDE: on error, stop the ads manager, release the player, and restart the channel
        // (Optional) Count restarts and stop retrying after a few attempts so a broken channel does not loop.
        flowerAdView.adsManager.stop();
        releasePlayer(); // e.g. hls.destroy() for HLS.js, player.unload() for Bitmovin
        // Start the channel exactly as the first time, prerollAdTagUrl included.
        playLinearTv();  // new changeChannelUrl() -> load the returned URL -> play
    },

    onAdBreakSkipped(reason) {
        console.log(`onAdBreakSkipped: ${reason}`);
    }
};
flowerAdView.adsManager.addListener(adsManagerListener);
```

:::info Recovering from `onError()`
When `onError()` is called, stop the ads manager with `flowerAdView.adsManager.stop()`, release the player, and start the channel again: call `changeChannelUrl()` again, load the URL it returns, and play it. Do not reuse the URL returned before the error. Pass exactly the same parameters as the first start, including `prerollAdTagUrl`, and handle the returned URL the same way as the first start. The viewer does not see the pre-roll again; see [Pre-roll Ads](#pre-roll-ads).

When content playback stops and the SDK cannot recover it, `onError()` is called with a message starting with `playback unrecoverable`. Restart the channel in the same way.

`stop()` ends any ad break in progress, and the SDK can still call `onCompleted()` for that break after the restart has begun. Keep `onCompleted()` limited to UI work such as showing the player controls, and never start or reload playback from it, so this late call cannot start a second restart.
:::

### 3. Passing the Player – `MediaPlayerHook`

> For linear channels, you must pass the player that plays the main content to the SDK.

#### Supported Players

*   HLS.js
*   Bitmovin Player
*   dash.js
*   Shaka Player

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

## Pre-roll Ads

A channel pre-roll is an ad that plays once when the viewer enters a channel, before the channel stream starts. It is separate from the linear ads that replace the stream at ad markers.

**Enabling it:** Pass the pre-roll ad tag URL issued by Anypoint Media as the `prerollAdTagUrl` argument of `changeChannelUrl()`. Pass `null` (or omit it) for no pre-roll. With FlowerHls, set `prerollAdTagUrl` in `FlowerLinearTvAdConfig` instead; see [Using Extended HLS.js](./using-extended-hlsjs.md#pre-roll-ads). `enterChannel()` with `MediaPlayerAdapter` has no pre-roll parameter.

**How it plays:**

1. `changeChannelUrl()` returns the stream URL right away, and the SDK requests the pre-roll in the background.
2. When the pre-roll is ready, the SDK calls `onPrepare()`, plays the pre-roll in a video element of its own over the player, pauses the player, and calls `onPlay()`.
3. When the pre-roll ends, the SDK calls `onCompleted()` and resumes the player.

**Holding the stream:** When `prerollAdTagUrl` is set, do not load the returned URL right away. Store it, remove the main `FlowerAdsManagerListener`, and register a temporary listener. On the temporary listener's first `onCompleted()` (or `onError()`), load and play the stored URL, remove the temporary listener, and register the main listener again. This keeps the stream from flashing on screen before the pre-roll and from loading at the same time as the ad. Without `prerollAdTagUrl`, load the returned URL and call `play()` right away. The [example below](#linear-channel-ad-request-example) shows both paths.

**No ad and failures:** The SDK also calls `onCompleted()` when there is no pre-roll ad, the ad request fails, or the pre-roll fails to play; a failed pre-roll is not reported through `onError()`. So the stream always starts. The temporary listener's `onError()` only starts the stream and restores the main listener. Do not call `stop()` there, because there is no channel stream or linear ad break to stop yet.

**Restart after `onError()`:** A restart passes the same parameters as the first start, including `prerollAdTagUrl`, and holds the stream in the same way. The pre-roll is not shown again: if the channel has not changed, the pre-roll is skipped (also after `stop()`), and the SDK calls `onCompleted()` right after `changeChannelUrl()` returns, so the temporary listener's `onCompleted()` starts the stream at once.

**Channel change:** The first start of a channel and a switch to another channel use the pre-roll as configured. `changeChannelUrl()` for the next channel stops the current session, including a pre-roll still in progress, and requests the new channel's pre-roll. Coming back to a channel after another channel (A → B → A) plays A's pre-roll again. The stopped pre-roll does not call the temporary listener, so remove the previous temporary listener (and register the main listener again) before the new call, as the example does. Remove it as well before `stop()` when the viewer leaves the channel screen.

**PIP:** With the default `FlowerSdk.setIgnoreAdBreakInPIPMode(true)`, the pre-roll is paused when the user leaves the app and resumed when the user comes back, like VOD ads. See [PIP Mode Support](../../getting-started/pip-mode-support.md).

## Linear Channel Ad Request Example

### _HLS.js_
```javascript
let prerollListener = null;  // temporary listener while a channel pre-roll is pending

// Used for the first start of a channel, a channel change, and a restart after onError()
function playLinearTv() {
    // A channel change stops a pending pre-roll without calling its listener:
    // remove the temporary listener and restore the main one.
    if (prerollListener) {
        flowerAdView.adsManager.removeListener(prerollListener);
        flowerAdView.adsManager.addListener(adsManagerListener);
        prerollListener = null;
    }

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

        prerollListener = {
            onPrepare(adDurationMs) {},
            onPlay() {},
            onCompleted() {
                // Load stream URL and start playback after pre-roll ad completes
                // (also called when there is no pre-roll ad or it fails)
                player.loadSource(changedChannelUrl);
                player.on(Hls.Events.MANIFEST_PARSED, function() {
                    videoElement.play();
                });

                // Remove temporary listener and restore the original listener
                flowerAdView.adsManager.removeListener(prerollListener);
                flowerAdView.adsManager.addListener(adsManagerListener);
                prerollListener = null;
            },
            onError(error) {
                // Start stream playback and restore listener even on pre-roll ad error
                player.loadSource(changedChannelUrl);
                player.on(Hls.Events.MANIFEST_PARSED, function() {
                    videoElement.play();
                });

                flowerAdView.adsManager.removeListener(prerollListener);
                flowerAdView.adsManager.addListener(adsManagerListener);
                prerollListener = null;
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

Instead of using `changeChannelUrl()` with `MediaPlayerHook`, you use the `enterChannel()` API with a `MediaPlayerAdapter` implementation. `enterChannel()` has no `prerollAdTagUrl` parameter, so this path has no [channel pre-roll](#pre-roll-ads).

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
| getPlayerType() | string \| null | Returns an identifier for the player implementation. The SDK uses it to apply player specific behavior and includes it in ad requests. |
| getPlayerVersion() | string \| null | Returns the player version string. The SDK includes it in ad requests. |

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
