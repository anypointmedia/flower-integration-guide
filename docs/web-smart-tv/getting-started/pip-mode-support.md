---
sidebar_position: 4
---

# PIP Mode Support

Flower SDK restricts CTA (Call To Action) functionality in PIP (Picture-in-Picture) mode, and does not play ads in PIP mode by default. To ensure correct behavior, the application must notify the SDK about PIP state changes.

The SDK provides the following two options related to PIP mode:

#### `FlowerSdk.notifyPictureInPictureModeChanged`

Notifies the SDK when PIP mode is entered (`true`) or exited (`false`).

```javascript
FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode)
```

#### `FlowerSdk.setIgnoreAdBreakInPIPMode`

Selects how ads are played. The default is `true`.

```javascript
FlowerSdk.setIgnoreAdBreakInPIPMode(ignore)
```

| **Value** | **Ad player** | **Ads in PIP mode** |
| ---| ---| --- |
| `true` (default) | The SDK plays VOD ads (pre-roll, mid-roll, post-roll) and inline ads in its own video element, shown over the content. | Not supported. An ad playing when the app enters PIP is paused, and Mid-roll or Post-roll Ad Breaks are not requested while in PIP. |
| `false` | For supported players, the SDK plays the ads inside the app's own player, by switching its source to the ads and back to the content. | Supported. Ads keep playing in PIP mode. |

Call `setIgnoreAdBreakInPIPMode` before requesting ads. The ad player is chosen when ads are requested.

:::caution
You must notify PIP mode transitions using `notifyPictureInPictureModeChanged`, on both entering and exiting PIP. The SDK does not detect PIP mode by itself.
:::

## Ads in PIP Mode (Default)

Ads are not supported in PIP mode by default. Therefore, if an ad is playing, the app must notify the SDK of PIP mode changes through `notifyPictureInPictureModeChanged`. Only then is the ad paused when the app enters PIP, and resumed when the user returns to the app. In addition, while an ad is playing, the app must not switch the content player into PIP, even if the app goes into PIP mode, because PIP mode could otherwise be used to bypass the ad.

*   When the app calls `notifyPictureInPictureModeChanged(true)` while an ad is playing, the SDK pauses the ad and hides the ad UI. While the ad is paused, its progress does not advance and no quartile tracking events are sent.
*   When the app calls `notifyPictureInPictureModeChanged(false)`, the ad resumes from where it stopped and plays to completion.
*   While the app is in PIP mode, Mid-roll and Post-roll Ad Breaks are not requested.
*   Linear TV ads inserted into the stream are not affected by this option. They keep playing in PIP mode, and only the ad UI is hidden. A linear channel pre-roll (`prerollAdTagUrl`) is paused and resumed in the same way as VOD ads.

Which video goes into PIP is decided by the app, not by the SDK. On the web, it is the `<video>` element the app requested PIP on, which is the content video. While an ad is playing, do not request PIP on the content video, and disable PIP on it until the ad break ends.

```javascript
const videoElement = document.querySelector('video');

// TODO GUIDE: Notify Flower SDK about Picture-in-Picture mode changes
videoElement.addEventListener('enterpictureinpicture', () => {
    FlowerSdk.notifyPictureInPictureModeChanged(true);
});
videoElement.addEventListener('leavepictureinpicture', () => {
    FlowerSdk.notifyPictureInPictureModeChanged(false);
});

// TODO GUIDE: Do not let the content video go into PIP while an ad is playing
const adsManagerListener = {
    onPlay() {
        videoElement.disablePictureInPicture = true;
    },
    onCompleted() {
        videoElement.disablePictureInPicture = false;
        ...
    },
    onError(error) {
        videoElement.disablePictureInPicture = false;
        ...
    },
    ...
};
```

## Supporting Ads in PIP Mode

Conversely, to support ads in PIP mode as well for more ad inventory (`setIgnoreAdBreakInPIPMode(false)`), the app needs to pay attention to how it handles player events.

```javascript
// TODO GUIDE: Play ads in the app's player so that they keep playing in PIP mode
FlowerSdk.setIgnoreAdBreakInPIPMode(false);
```

The following players play ads inside the app's player in this mode. The other supported players (Shaka Player, dash.js) always use the SDK's own video element.

*   HLS.js, including `FlowerHls`
*   Bitmovin Player

### How Ads Are Played in the App's Player

1. When an ad break starts, the SDK switches the player's source to the ads.
2. When the ad break ends, the SDK switches the source back to the content, at the resume point (the interrupted position minus `rewindDuration`).

### Handling Player Events

Because the player's source changes around every ad break, any app logic that detects source changes or completion (the `ended` event, source loaded events and so on) must react only to the content URL, not to whichever source is current.

*   The `ended` event of the video element also occurs when each ad ends. Check that the current source is the content before treating it as the content's end.
*   Call `notifyContentEnded()` only once per content.

### _HLS.js_

```javascript
const contentUrl = 'https://vod_content_url';
let isContentEnd = false;

videoElement.addEventListener('ended', () => {
    // TODO GUIDE: The end of an ad is not the end of the content
    if (hls.url !== contentUrl) return;

    // TODO GUIDE: Notify the content end only once
    if (isContentEnd) return;
    isContentEnd = true;
    flowerAdView.adsManager.notifyContentEnded();
});
```

### _Bitmovin Player_

```javascript
const contentUrl = 'https://vod_content_url';
let isContentEnd = false;

player.on(bitmovin.player.PlayerEvent.PlaybackFinished, () => {
    // TODO GUIDE: The end of an ad is not the end of the content
    if (player.getSource()?.hls !== contentUrl) return;

    // TODO GUIDE: Notify the content end only once
    if (isContentEnd) return;
    isContentEnd = true;
    flowerAdView.adsManager.notifyContentEnded();
});
```
