---
sidebar_position: 2
---

# Manual Player Control

This guide walks you through the complete process of inserting ads into linear TV channels and FAST streams using the Flower SDK. Ad integration follows these steps:
1. **Declare the Ad UI:** Place `FlowerAdView` on the screen to display the ad.
2. **Implement Ad Event Reception:** Implement `FlowerAdsManagerListener` to handle logic at ad playback and completion points.
3. **Pass the Player:** Implement `MediaPlayerHook` to pass player information so the SDK can recognize content playback status.
4. **Configure Additional Parameters (`extraParams`):** Set up additional information required for ad targeting.
5. **Change Linear Channel URL (`changeChannelUrl`):** Change the stream URL by passing information such as ad tag URL and channel ID.
6. **Update Parameters During Playback:** Update targeting information through `changeChannelExtraParams()` during stream playback.

## Step-by-Step Details

### 1. Declare the Ad UI

> Please refer to the Ad Insertion menu > Declare the Ad UI section for ad UI declaration.

### 2. Receiving Ad Events – `FlowerAdsManagerListener`

> **When inserting ads into linear channels**, ads that replace the main stream are played through ad markers (e.g., SCTE-35). **UI control and other logic may be needed** at ad playback start/end points. For this purpose, the Flower SDK provides **a listener interface for receiving ad events**, which can be implemented as follows.

```kotlin
val adsManagerListener = object : FlowerAdsManagerListener {
    override fun onPrepare(adDurationMs: Int) {
        // TODO GUIDE: need nothing for linear tv
    }

    override fun onPlay() {
        // OPTIONAL GUIDE: enable additional actions for ad playback
        hidePlayerControls()
    }

    override fun onCompleted() {
        // OPTIONAL GUIDE: disable additional actions after ad complete
        showPlayerControls()
    }

    override fun onError(error: FlowerError?) {
        // TODO GUIDE: on an error, stop the ads manager and the player, then restart the channel.
        //             Listeners are called off the main thread, so switch to the main thread first.
        CoroutineScope(Dispatchers.Main).launch {
            flowerAdView.adsManager.stop()
            player.stop()
            // Start the channel again in the same way as the first start: a new changeChannelUrl(...) call with the same
            // parameters, including prerollAdTagUrl. The SDK skips the pre-roll of the channel entered last.
            // OPTIONAL GUIDE: limit consecutive restarts (e.g., 3 in a row) so a persistent error does not loop.
            playLinearTv()
        }
    }

    override fun onAdBreakSkipped(reason: Int) {
        logger.info { "onAdBreakSkipped: $reason" }
    }
}
flowerAdView.adsManager.addListener(adsManagerListener)
```

:::info Recovering from `onError`
`onError` is called when an ad fails to play or when the channel stream can no longer be played. Stop the ads manager with `stop()`, stop the content player, and start the channel again with a new `changeChannelUrl(...)` call. Do not reuse the URL returned before `stop()`. Pass exactly the same parameters as the first start, including `prerollAdTagUrl`, and handle the returned URL in the same way: with `prerollAdTagUrl`, hold it until `onCompleted()` as described in [Pre-roll Ads](#pre-roll-ads). The viewer does not see the pre-roll again: the SDK skips the pre-roll of the channel entered last and reports `onCompleted()` right after `changeChannelUrl()` returns. The listener stays registered, so it receives the events of the restarted channel. A break cut short by `stop()` may still report `onCompleted` afterwards, so keep `onCompleted` limited to UI work that is safe to run more than once.

When the channel stream stops and the SDK will not recover it, the player adapter calls `onError` once per incident with the message `playback unrecoverable (<reason>) - url: <url>` and the player's error as `cause`: for Media3 ExoPlayer / ExoPlayer2, a fatal player error that the SDK does not recover by itself, `BehindLiveWindow` when the SDK's automatic recovery from it is turned off, or a live playlist still stalled after 3 recovery attempts; for Bitmovin, after 3 reload attempts or with no source to reload. Recover in the same way, ideally with a fresh channel URL.
:::

### 3. Passing the Player – `MediaPlayerHook`

> For linear channels, you must pass the player that plays the main content to the SDK.

#### Supported Players

*   ExoPlayer2
*   Media3 ExoPlayer
*   Bitmovin Player

These players pass the current player to the SDK by implementing the `MediaPlayerHook` interface.

#### When Using Unsupported Players

If you are using an unsupported player, please contact [Helpdesk](mailto:dev-support@anypointmedia.com).

### 4. Additional Parameters for Ad Requests – `extraParams`

> When requesting ads using the Flower SDK, passing additional parameters helps the SDK provide the most suitable ads. For mobile apps, since the SDK cannot determine the ad serving context on its own, these parameters must be passed to the SDK when requesting ads.

#### Parameter List

| Key<br/>(\* indicates mobile app required) | Value | Example |
| ---| ---| --- |
| serviceId\* | App package name | "tv.anypoint.service" |
| os\* | OS of the device running the app | "Android" |
| adId\* | Ad identifier of the device running the app | Android: Google's GAID value |

### 5. Linear Channel Ad API Call – `changeChannelUrl(...)`

#### FlowerAdsManager.changeChannelUrl()

Function used to change the stream URL for live broadcasts. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | string | Original playback URL |
| adTagUrl | string | Ad tag URL issued by the ad server |
| channelId | string | Unique channel ID<br/>Must be registered in the Flower backend system |
| extraParams | map | Additional pre-agreed information for targeting (_null_ if none) |
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

## Pre-roll Ads {#pre-roll-ads}

A channel pre-roll is an ad that plays once when the viewer enters a channel, before the live stream starts. It is optional and separate from the ad breaks inserted into the stream.

### Enabling the Pre-roll

Pass the pre-roll ad tag URL issued by Anypoint Media as `prerollAdTagUrl`, the last argument of `changeChannelUrl()`. Pass `null` when the channel has no pre-roll. The `MediaPlayerAdapter` overload of `changeChannelUrl()` takes the same argument. With a Flower Player, set `FlowerLinearTvAdConfig.prerollAdTagUrl` instead; see [Using Flower Player](./using-flower-player#pre-roll-ads).

### Playback Flow

When `prerollAdTagUrl` is set, `changeChannelUrl()` still returns the stream URL right away, and the SDK also requests the pre-roll and plays it in its own ad player over `FlowerAdView`. The app does not call `adsManager.play()` for it. The app starts the channel only after the pre-roll ends:

1. Do not load the returned URL yet. Remove the main `FlowerAdsManagerListener` and register a temporary listener.
2. On the first `onCompleted()` (or `onError()`) of the temporary listener, switch to the main thread, load and play the returned URL, then remove the temporary listener and register the main listener again.

Without `prerollAdTagUrl`, load and play the returned URL right away, with the main listener registered. Holding the stream keeps the channel from showing before the pre-roll starts and from loading at the same time as the ad.

- **Events:** The temporary listener receives `onPrepare()`, `onPlay()` when the pre-roll starts, and `onCompleted()` when it ends. `onAdBreakPrepare()`, `onAdPlay()`, `onAdUserAction()`, and `onAdBreakSkipped()` are not reported for a channel pre-roll.
- **No ad or failure:** When the pre-roll response has no ad, the request fails, or the pre-roll fails while playing, the SDK reports `onCompleted()`, not `onError()`, so the channel starts as usual. Handle `onError()` on the temporary listener in the same way as a safeguard.
- **PIP:** With the default `FlowerSdk.setIgnoreAdBreakInPIPMode(true)`, a channel pre-roll is paused when the user leaves the app and resumed when the user comes back, in the same way as VOD ads. Report this with `FlowerSdk.notifyUserLeftApp()`, whether or not the app enters PIP; see [PIP Mode Support](../../getting-started/pip-mode-support).
- **Same channel again:** The SDK remembers the channel (`channelId`) entered last. When `changeChannelUrl()` is called with that same `channelId`, the SDK skips the pre-roll even if `prerollAdTagUrl` is passed, and reports `onCompleted()` shortly after `changeChannelUrl()` returns, in the same way as a pre-roll with no ad. The app therefore starts the channel exactly as on the first start. `stop()` does not clear the remembered channel; requesting VOD ads (`requestVodAd`) or inline ads (`requestAd`) does. For example, A → B → A plays A's pre-roll again, and A → VOD → A also plays it again. Because the SDK remembers the channel across screens, leaving the player screen and coming back to the same channel with no VOD or inline ad request in between also skips the pre-roll.
- **Restart after `onError`:** Call `changeChannelUrl()` with the same parameters as the first start, including `prerollAdTagUrl`, and handle the returned URL in the same way, as described in "Recovering from `onError`" above. Since the channel is the one entered last, the viewer does not see the pre-roll again.
- **Channel switch:** Each `changeChannelUrl()` call stops the previous channel's ad session, including a pre-roll that is still playing, and requests the new channel's pre-roll when `prerollAdTagUrl` is passed. A pre-roll stopped this way, or by `stop()`, does not report `onCompleted()`. Before the next `changeChannelUrl()` call and before `stop()`, remove a temporary listener that is still registered and register the main listener again; otherwise it would load the previous channel's URL when the next pre-roll ends.

## Linear Channel Ad Request Example

The example below follows the [Pre-roll Ads](#pre-roll-ads) flow.

```kotlin
// Temporary listener while a channel pre-roll is pending (null otherwise)
private var prerollListener: FlowerAdsManagerListener? = null

// Used for the first start of a channel, a channel switch, and a restart after onError
private fun playLinearTv() {
    // A pre-roll stopped by a channel switch does not report onCompleted:
    // drop its temporary listener and make sure the original listener is registered.
    prerollListener?.let { flowerAdView.adsManager.removeListener(it) }
    prerollListener = null
    flowerAdView.adsManager.addListener(adsManagerListener)

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
    // Pass it on a restart as well: the SDK skips the pre-roll of the channel entered last and reports onCompleted.
    val prerollAdTagUrl: String? = "https://ad_request?target=preroll"

    val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        "https://XXX",
        "https://ad_request",
        "100",
        mapOf("custom-param" to "custom-param-value"),
        mediaPlayerHook,
        mapOf("custom-ad-header" to "custom-ad-header-value"),
        mapOf("custom-stream-header" to "custom-stream-header-value"),
        prerollAdTagUrl
    )
    fun playStream() {
        player.setMediaItem(MediaItem.fromUri(changedChannelUrl))
        player.prepare()
        player.play()
    }

    if (prerollAdTagUrl == null) {
        // If prerollAdTagUrl is not set, set the returned URL directly and start playback.
        playStream()
    } else {
        // If prerollAdTagUrl is set, remove the existing listener and register a temporary one.
        // Set the stream URL and start playback after the pre-roll ad completes (onCompleted).
        // The SDK plays the pre-roll by itself: do not call adsManager.play().
        flowerAdView.adsManager.removeListener(adsManagerListener)

        val listener = object : FlowerAdsManagerListener {
            override fun onPrepare(adDurationMs: Int) {}
            override fun onPlay() {}
            override fun onCompleted() {
                // Also called when there is no pre-roll ad or the pre-roll fails
                finishPreroll()
            }
            override fun onError(error: FlowerError?) {
                // Start stream playback and restore listener even on pre-roll ad error
                finishPreroll()
            }
            override fun onAdBreakSkipped(reason: Int) {}

            private fun finishPreroll() {
                val self = this
                // Listeners are called off the main thread
                CoroutineScope(Dispatchers.Main).launch {
                    // Only the first call for the pending pre-roll starts the stream
                    if (prerollListener !== self) return@launch
                    prerollListener = null

                    // Set stream URL and start playback after pre-roll ad completes
                    playStream()

                    // Remove temporary listener and restore the original listener
                    flowerAdView.adsManager.removeListener(self)
                    flowerAdView.adsManager.addListener(adsManagerListener)
                }
            }
        }
        prerollListener = listener
        flowerAdView.adsManager.addListener(listener)
    }
}

// TODO GUIDE: change extraParams during stream playback
fun onStreamProgramChanged(targetingInfo: String) {
    flowerAdView.adsManager.changeChannelExtraParams(mapOf("myTargetingKey" to targetingInfo))
}
```

## Using MediaPlayerAdapter

If you are using a player that is not officially supported by the SDK, you can implement the `MediaPlayerAdapter` interface to directly control the player.

Instead of passing a `MediaPlayerHook`, you pass a `MediaPlayerAdapter` implementation to the `changeChannelUrl()` overload.

### FlowerAdsManager.changeChannelUrl(...) with MediaPlayerAdapter

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | string | Original playback URL |
| adTagUrl | string | Ad tag URL issued by the ad server |
| channelId | string | Unique channel ID<br/>Must be registered in the Flower backend system |
| extraParams | map | Additional pre-agreed information for targeting (_null_ if none) |
| mediaPlayerAdapter | MediaPlayerAdapter | MediaPlayerAdapter interface implementation object<br/>For more details, refer to the [In case of direct player control](../implement-interface-video-player/direct-player-control) documentation. |
| adTagHeaders | map | (Optional) HTTP header information to add when requesting ads |
| channelStreamHeaders | map | (Optional) HTTP header information to add when requesting the original stream |
| prerollAdTagUrl | string | (Optional) Ad tag URL issued by the ad server for pre-roll |

With `prerollAdTagUrl`, start the channel as described in [Pre-roll Ads](#pre-roll-ads). The SDK calls the adapter's `pause()` when the pre-roll starts and `resume()` when it ends, before the app loads the stream, so both must be safe to call while nothing is loaded.

### MediaPlayerAdapter Interface

The `MediaPlayerAdapter` interface requires the following methods:

| **Method** | **Return Type** | **Description** |
| ---| ---| --- |
| getCurrentMedia() | Media | Returns the currently playing media (urlOrId, duration, position) |
| getVolume() | Float | Returns the audio volume level (0.0–1.0) |
| isPlaying() | Boolean | Returns whether the player is currently playing |
| getHeight() | Int | Returns the video height in pixels (0 if unknown) |
| pause() | Unit | Pauses the playback |
| stop() | Unit | Stops the playback and releases resources |
| resume() | Unit | Resumes the playback |
| enqueuePlayItem(playItem) | Unit | Queues a new play item |
| removePlayItem(playItem) | Unit | Removes a queued play item |
| playNextItem() | Unit | Seeks to the next media item in the queue |
| seekToPosition(...) | Unit | Seeks to the specified position |
| getCurrentAbsoluteTime(isPrintDetails) | Double | Returns the current absolute playback time in ms |
| getPlayerType() | String? | Returns an identifier for the player implementation. The SDK uses it to apply player specific behavior and includes it in ad requests. |
| getPlayerVersion() | String? | Returns the player version string. The SDK includes it in ad requests. |

### Example

```kotlin
class MyPlayerAdapter(private val player: MyCustomPlayer) : MediaPlayerAdapter {

    override fun getCurrentMedia(): Media {
        return Media(
            urlOrId = player.currentUrl ?: "",
            duration = (player.duration * 1000).toLong(),
            position = (player.currentTime * 1000).toLong()
        )
    }

    override fun getVolume(): KotlinWrapped<Float> {
        return KotlinWrapped(player.volume)
    }

    override fun isPlaying(): KotlinWrapped<Boolean> {
        return KotlinWrapped(player.isPlaying)
    }

    override fun getHeight(): KotlinWrapped<Int> {
        return KotlinWrapped(player.videoHeight)
    }

    override fun pause() {
        player.pause()
    }

    override fun stop() {
        player.stop()
    }

    override fun resume() {
        player.play()
    }

    override fun enqueuePlayItem(playItem: PlayItem) {
        player.enqueue(playItem.url)
    }

    override fun removePlayItem(playItem: PlayItem) {
        player.removeFromQueue(playItem.url)
    }

    override fun playNextItem() {
        player.skipToNext()
    }

    override fun seekToPosition(
        absoluteStartTimeMs: Double?,
        relativeStartTimeMs: Double?,
        offsetMs: Double?,
        windowDurationMs: Double?,
        periodIndex: Int?
    ) {
        offsetMs?.let { player.seekTo((it / 1000.0).toLong()) }
    }

    override fun getCurrentAbsoluteTime(isPrintDetails: Boolean): KotlinWrapped<Double> {
        return KotlinWrapped(player.currentTime * 1000.0)
    }

    override fun getPlayerType(): String? {
        return "CustomPlayer"
    }

    override fun getPlayerVersion(): String? {
        return "1.0.0"
    }
}

// Usage
val adapter = MyPlayerAdapter(myCustomPlayer)
val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
    "https://XXX",
    "https://ad_request",
    "100",
    null,
    adapter,
    null,
    null,
    null
)
player.setMediaItem(MediaItem.fromUri(changedChannelUrl))
```
