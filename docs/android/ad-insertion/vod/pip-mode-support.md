---
sidebar_position: 3
---

# PIP Mode Support

The SDK provides the following two options related to PIP (Picture-in-Picture) mode:

#### `FlowerSdk.notifyPictureInPictureModeChanged`

Notifies the SDK when PIP mode is entered (`true`) or exited (`false`).

#### `FlowerSdk.setIgnoreAdBreakInPIPMode`

Selects how ads are played. The default is `true`.

| **Value** | **Ad player** | **Ads in PIP mode** |
| ---| ---| --- |
| `true` (default) | The SDK plays VOD ads (pre-roll, mid-roll, post-roll) and inline ads in its own ad player, shown over the content. | Not supported. An ad playing when the app enters PIP is paused, and Mid-roll or Post-roll Ad Breaks are not requested while in PIP. |
| `false` | For supported players, the SDK plays VOD ads inside the app's own player, by inserting the ad items into its playlist in front of the content. Inline ads (`requestAd`) always play in the SDK's own ad player, regardless of this option. | Supported for VOD ads. Ads keep playing in PIP mode. |

Call `setIgnoreAdBreakInPIPMode` before requesting ads. The ad player is chosen when ads are requested.

:::caution
You must notify PIP mode transitions using `notifyPictureInPictureModeChanged`, on both entering and exiting PIP. The SDK does not detect PIP mode by itself. With Bitmovin Player, the SDK also listens for Bitmovin's `PictureInPictureEnter` / `PictureInPictureExit` events, so if PIP is entered through the Bitmovin player's own PIP handling, the SDK is notified automatically. Otherwise, for example when the app calls `Activity.enterPictureInPictureMode()` itself, notify the SDK yourself.
:::

## Ads in PIP Mode (Default)

Ads are not supported in PIP mode by default. Therefore, if an ad is playing, the app must notify the SDK of PIP mode changes through `notifyPictureInPictureModeChanged`. Only then is the ad paused when the app enters PIP, and resumed when the user returns to the app. In addition, while an ad is playing, the app must not switch the content player into PIP, even if the app goes into PIP mode, because PIP mode could otherwise be used to bypass the ad.

*   When the app calls `notifyPictureInPictureModeChanged(true)` while an ad is playing, the SDK pauses the ad and hides the ad UI. While the ad is paused, its progress does not advance and no quartile tracking events are sent.
*   When the app calls `notifyPictureInPictureModeChanged(false)`, the ad resumes from where it stopped and plays to completion.
*   While the app is in PIP mode, Mid-roll and Post-roll Ad Breaks are not requested.
*   Linear TV ads inserted into the stream are not affected by this option. They keep playing in PIP mode, and only the ad UI is hidden. A linear channel pre-roll (`prerollAdTagUrl`) is paused and resumed in the same way as VOD ads.

Which window goes into PIP is decided by the OS and the app, not by the SDK. On Android, the whole Activity goes into PIP, so the content player cannot be kept out of the PIP window. Do not start PIP yourself while an ad is playing (for example from `onUserLeaveHint()` or through `setAutoEnterEnabled(true)`), and do not resume the content player from the PIP window while an ad is paused. The SDK resumes the content itself after the break.

`Activity.enterPictureInPictureMode(PictureInPictureParams)` requires API level 26 (Android 8.0), and `PictureInPictureParams.Builder.setAutoEnterEnabled()` requires API level 31 (Android 12). The Flower SDK supports lower API levels, so check the API level before entering PIP.

**_Kotlin_**

```kotlin
class YourActivity : Activity() {
    private var isAdPlaying = false

    private val adsManagerListener = object : FlowerAdsManagerListener {
        override fun onPlay() { isAdPlaying = true }
        override fun onCompleted() { isAdPlaying = false }
        override fun onError(error: FlowerError?) { isAdPlaying = false }
        ...
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()

        // TODO GUIDE: Do not enter PIP while an ad is playing
        //             (enterPictureInPictureMode(PictureInPictureParams) requires API 26)
        if (!isAdPlaying && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            enterPictureInPictureMode(PictureInPictureParams.Builder().build())
        }
    }

    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration?) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)

        // TODO GUIDE: Notify Flower SDK about Picture-in-Picture mode changes
        FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode)
    }

    ...
}
```

**_Java_**

```java
public class YourActivity extends Activity {
    private boolean isAdPlaying = false;

    private final FlowerAdsManagerListener adsManagerListener = new FlowerAdsManagerListener() {
        @Override public void onPlay() { isAdPlaying = true; }
        @Override public void onCompleted() { isAdPlaying = false; }
        @Override public void onError(@Nullable FlowerError error) { isAdPlaying = false; }
        ...
    };

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();

        // TODO GUIDE: Do not enter PIP while an ad is playing
        //             (enterPictureInPictureMode(PictureInPictureParams) requires API 26)
        if (!isAdPlaying && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            enterPictureInPictureMode(new PictureInPictureParams.Builder().build());
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, @Nullable Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);

        // TODO GUIDE: Notify Flower SDK about Picture-in-Picture mode changes
        FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode);
    }

    ...
}
```

## Supporting Ads in PIP Mode

Conversely, to support ads in PIP mode as well for more ad inventory (`setIgnoreAdBreakInPIPMode(false)`), the app needs to pay attention to how it handles player events.

```kotlin
// TODO GUIDE: Play ads in the app's player so that they keep playing in PIP mode
FlowerSdk.setIgnoreAdBreakInPIPMode(false)
```

The following players play ads inside the app's player in this mode. Other players (including custom players) always use the SDK's own ad player.

*   Media3 ExoPlayer and `FlowerMedia3ExoPlayer`
*   ExoPlayer2 and `FlowerExoPlayer2`
*   Bitmovin Player and `FlowerBitmovinPlayer`

### How Ads Are Played in the App's Player

1. When an ad break starts, the SDK adds the ad items to the player's playlist in front of the content, and the player moves to the ads.
2. When the ad break ends, the SDK puts the content back at the resume point (the interrupted position minus `rewindDuration`). How it does this depends on the player:
    *   **Media3 ExoPlayer / ExoPlayer2:** The content comes back as a **new media item**. The original `MediaItem` is added again, clipped to start at the resume point. Because of this, `currentPosition` is counted from the resume point, and the position within the original content is the clipping start position plus `currentPosition`.
    *   **Bitmovin Player:** The content `Source` is loaded again with its `startOffset` set to the resume point. `currentTime` stays the position within the original content, so no conversion is needed.

```kotlin
// Media3 ExoPlayer / ExoPlayer2: position within the original content after a mid-roll
val contentPositionMs =
    (player.currentMediaItem?.clippingConfiguration?.startPositionMs ?: 0L) + player.currentPosition
```

### Handling Player Events

Because the current media item changes around every ad break, any app logic that detects media item changes or completion (end of playback, media item transitions, listeners attached to a specific item) must react only to the content URL, not to whichever item is current. Do not assume the media item the app created is still the one playing.

*   `Player.STATE_ENDED` and `onMediaItemTransition` also occur around ad breaks. Check that the current media item is the content before treating the event as the content's.
*   After the post-roll, the content is put back at its end, so `STATE_ENDED` may be reported again. Call `notifyContentEnded()` only once per content.
*   If an ad fails, the SDK drops the failed ad and puts the content back in the same way (rebuilding the playlist with your original `MediaItem`s) and plays it, before it calls `onError`. Do not stop, seek, or reload the content in `onError`, as in [VOD Pre-roll, Mid-roll, Post-roll Ad Implementation](./vod-ad-implementation). Because the ad player and the content player adapter share your player in this mode, one ad failure can be reported to `onError` twice.

**_Kotlin_**

```kotlin
private val contentUrl = "https://vod_content_url"
private var isContentEnd = false

private fun isPlayingContent(): Boolean =
    player.currentMediaItem?.localConfiguration?.uri?.toString() == contentUrl

player.addListener(object : Player.Listener {
    override fun onPlaybackStateChanged(playbackState: Int) {
        // TODO GUIDE: STATE_ENDED of an ad item is not the end of the content
        if (playbackState != Player.STATE_ENDED || !isPlayingContent()) return

        // TODO GUIDE: Notify the content end only once
        if (isContentEnd) return
        isContentEnd = true
        flowerAdView.adsManager.notifyContentEnded()
    }

    override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
        // OPTIONAL GUIDE: e.g. show your player controls only while the content is playing
        playerView.useController = mediaItem?.localConfiguration?.uri?.toString() == contentUrl
    }
})
```

For Bitmovin Player, check the current source in the same way, for example by comparing `player.source?.config?.url` with the content URL on `PlayerEvent.PlaybackFinished`.
