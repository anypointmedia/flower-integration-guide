---
sidebar_position: 4
---

# PIP Mode Support

Flower SDK restricts CTA (Call To Action) functionality in PIP (Picture-in-Picture) mode, and by default does not play ads while the user is away from the app. To ensure correct behavior, the application must notify the SDK when the user leaves the app and when the user comes back.

The SDK provides the following two options related to PIP mode:

#### `FlowerSdk.notifyUserLeftApp`

Notifies the SDK when the user leaves the app (`true`) or comes back to it (`false`). The user leaves the app when they switch to another tab or app, when the TV app goes to the background, or when the video moves to a PIP window.

```javascript
FlowerSdk.notifyUserLeftApp(hasLeftApp)
```

`notifyPictureInPictureModeChanged` is deprecated and replaced by `notifyUserLeftApp`. Existing calls keep working.

#### `FlowerSdk.setIgnoreAdBreakInPIPMode`

Selects how ads are played. The default is `true`.

```javascript
FlowerSdk.setIgnoreAdBreakInPIPMode(ignore)
```

| **Value** | **Ad player** | **Ads in PIP mode** |
| ---| ---| --- |
| `true` (default) | The SDK plays VOD ads (pre-roll, mid-roll, post-roll) and inline ads in its own video element, shown over the content. | Not supported. An ad playing when the user leaves the app is paused, and Mid-roll or Post-roll Ad Breaks are not requested until the user comes back. |
| `false` | For supported players, the SDK plays the ads inside the app's own player, by switching its source to the ads and back to the content. | Supported. Ads keep playing in PIP mode. |

Call `setIgnoreAdBreakInPIPMode` before requesting ads. The ad player is chosen when ads are requested.

:::caution
You must notify the SDK with `notifyUserLeftApp`, both when the user leaves the app and when the user comes back, whether or not the video goes into PIP. The SDK does not detect this by itself.
:::

## Ads in PIP Mode (Default)

Ads are not supported in PIP mode by default. While an ad is playing, the app must not switch the content player into PIP, because PIP mode could otherwise be used to bypass the ad. So PIP does not start when the user leaves the app during an ad, which is why the app reports leaving the app, not the start of PIP: call `notifyUserLeftApp(true)` when the user switches to another tab or app or the TV app goes to the background, and `notifyUserLeftApp(false)` when the user comes back. The ad is then paused while the user is away and resumed on return.

*   When the app calls `notifyUserLeftApp(true)` while an ad is playing, the SDK pauses the ad and hides the ad UI. While the ad is paused, its progress does not advance.
*   When the app calls `notifyUserLeftApp(false)`, the ad resumes from where it stopped and plays to completion.
*   While the user is away from the app, Mid-roll and Post-roll Ad Breaks are not requested.
*   Linear TV ads inserted into the stream are not affected by this option. They keep playing while the user is away, and only the ad UI is hidden. A linear channel pre-roll (`prerollAdTagUrl`) is paused and resumed in the same way as VOD ads.

Which video goes into PIP is decided by the app, not by the SDK. On the web, it is the `<video>` element the app requested PIP on, which is the content video. While an ad is playing, do not request PIP on the content video, and disable PIP on it until the ad break ends.

On the web, the page becomes hidden (`visibilitychange`) when the user switches to another tab or app, or the TV app goes to the background. If the app lets the content video go into PIP outside ads, also report the user as away while the content video is in the PIP window.

```javascript
const videoElement = document.querySelector('video');

// TODO GUIDE: Notify Flower SDK when the user leaves the app and comes back
function reportUserLeftApp() {
    const hasLeftApp = document.visibilityState === 'hidden'
        || document.pictureInPictureElement === videoElement;
    FlowerSdk.notifyUserLeftApp(hasLeftApp);
}
document.addEventListener('visibilitychange', reportUserLeftApp);
videoElement.addEventListener('enterpictureinpicture', reportUserLeftApp);
videoElement.addEventListener('leavepictureinpicture', reportUserLeftApp);

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

For an LLM prompt that applies this to a VOD app, see [VOD — PIP Without Ads (Default)](../prompts/by-case/vod/no-ads-in-pip-mode.md).

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
