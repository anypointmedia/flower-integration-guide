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
        // TODO GUIDE: restart to play Linear TV on ad error
        releasePlayer()
        playLinearTv()
    }

    override fun onAdSkipped(reason: Int) {
        logger.info { "onAdSkipped: $reason" }
    }
}
flowerAdView.adsManager.addListener(adsManagerListener)
```

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

## Linear Channel Ad Request Example

:::tip Pre-roll Ads and Playback Start
When you call `changeChannelUrl()`, the SDK returns a stream URL with ad tracking applied. After setting the returned URL on the player, the playback start behavior differs depending on whether `prerollAdTagUrl` is set.

- **If `prerollAdTagUrl` is not set:** You must call `player.play()` directly to start content playback.
- **If `prerollAdTagUrl` is set:** The SDK plays the pre-roll ad first and then automatically starts content playback, so there is no need to call `player.play()` separately.
:::

```kotlin
private fun playLinearTv() {
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
    player.setMediaItem(MediaItem.fromUri(changedChannelUrl))

    // If prerollAdTagUrl is null, call player.play() directly to start playback immediately.
    // If prerollAdTagUrl is set, the SDK plays the pre-roll ad first
    // and then automatically starts content playback, so player.play() is not needed.
    if (prerollAdTagUrl == null) {
        player.prepare()
        player.play()
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
| getPlayerType() | String? | Returns the player type identifier (for Google PAL SDK) |
| getPlayerVersion() | String? | Returns the player version string (for Google PAL SDK) |

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
