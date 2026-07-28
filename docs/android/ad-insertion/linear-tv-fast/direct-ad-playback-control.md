---
sidebar_position: 3
---

# Direct Ad Playback Control

Even when implementing channel replacement ads without utilizing the playlist manipulation features provided by the Flower SDK, you can still integrate ads by using the SDK's linear TV live channel ad request functionality. In this case, ad integration follows these steps:
1. **Inform Entering a Live Channel (`enterChannel`):** Pass information such as the ad tag URL and channel ID when starting stream playback, together with the adapter of the player that will play the ads.
2. **Request a Live Channel Ad (`requestChannelAd`):** Request information about ads that can be played in the current channel.
3. **Play the Ad:** When the SDK returns ads, play them on your own player according to the host application's logic and notify the SDK that the ad break started.

In this approach the host application owns **two players**: one for the channel content and one for the ad creatives. The SDK never drives the ad player — it only observes the player through the `MediaPlayerAdapter` you provide, so that it can follow ad progress and fire tracking beacons while your application controls playback.

:::note
Because this flow does not go through the SDK stream proxy, `changeChannelUrl()` is not used. The application plays the original channel URL directly.
:::

## Step-by-Step Details

### 1. Inform Entering a Live Channel – `enterChannel`

#### FlowerAdsManager.enterChannel()

Notifies the SDK of live broadcast entry. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | Ad tag URL issued by the Flower backend system<br/>You must file a request to Anypoint Media to receive an adTagUrl. |
| channelId | string | Unique channel ID<br/>Must be registered in the Flower backend system |
| extraParams | map | (Optional) Additional pre-agreed information for targeting |
| mediaPlayerAdapter | MediaPlayerAdapter | `MediaPlayerAdapter` interface implementation object for the **ad player**<br/>For more details, refer to the [Direct Player Control](../implement-interface-video-player/direct-player-control) documentation. |
| adTagHeaders | map | (Optional) HTTP header information to add when requesting ads |

#### Example

```kotlin
private fun prepareAd() {
    // The ad player owned by the application. Ads are played on this player, not by the SDK.
    adPlayer = ExoPlayer.Builder(this).build()
    adPlayer.setVideoSurfaceView(adPlayerView)
    adPlayer.playWhenReady = false
    adPlayer.addListener(
        object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState != Player.STATE_ENDED) {
                    return
                }

                // The playlist drained: the ad break is over.
                adPlayerView.visibility = View.GONE
                flowerAdView.visibility = View.GONE
                adPlayer.clearMediaItems()
            }
        }
    )

    val mediaPlayerAdapter = ExoPlayerAdapter(adPlayer)

    // TODO GUIDE: Inform channel enter
    // This method takes the MediaPlayerAdapter of the player that will actually play the ads,
    // so the SDK can follow the ad progress and fire the tracking beacons while the application
    // drives playback.
    // arg0: adTagUrl, url from flower system
    //       You must file a request to Anypoint Media to receive an adTagUrl.
    // arg1: channelId, unique channel id in your service
    // arg2: extraParams, values you can provide for targeting
    // arg3: mediaPlayerAdapter, adapter of the ad player owned by the application
    // arg4: adTagHeaders, (Optional) values included in headers for ad request
    flowerAdView.adsManager.enterChannel(
        "https://ad_request",
        "100",
        mapOf("custom-param" to "custom-param-value"),
        mediaPlayerAdapter,
        mapOf("custom-ad-header" to "custom-ad-header-value"),
    )
}

private fun playLinearTv() {
    flowerAdView.adsManager.addListener(flowerAdsManagerListener)

    // The channel stream is played as it is: this flow does not go through the SDK proxy.
    player = ExoPlayer.Builder(this).build()
    player.addListener(this)
    player.setVideoSurfaceView(playerView)
    player.setMediaItem(MediaItem.fromUri(videoUrl))
    player.playWhenReady = true
    player.prepare()
}
```

### 2. Request a Live Channel Ad – `requestChannelAd`

#### FlowerAdsManager.requestChannelAd()

Requests ads for the current live channel. This method returns a coroutine `Flow<FlowerAd>` that emits each ad sequentially as it becomes available. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| transactionId | Long | Unique cue event ID<br/>Must be different for each ad request. The same ad break (cue) must keep one `transactionId`, so the SCTE-35 Splice Event ID is the recommended source. |
| adDuration | Long | Requested ad duration in milliseconds<br/>Convert the Splice Event's `breakDuration` (90 kHz) to milliseconds. |
| uniqueProgramId | Int | Unique program ID for the ad request<br/>Must be registered in the Flower backend system |
| timeout | Long | Ad request timeout in milliseconds<br/>**Important:** Must be set to the time difference between the current playback position and the point at which the ad marker occurs. |

**Return value:** `Flow<FlowerAd>` — a coroutine Flow that emits playable `FlowerAd` objects. Cancel the collecting coroutine (`Job.cancel()`) to stop receiving ads for a request that is still open.

:::note Behavior
- If a request is made with the same `transactionId` as a previous request, the method returns `emptyFlow()`.
- If no ads are available or a timeout occurs, the Flow throws `FlowerError(message)`. In that case the ad break must be skipped so that the content keeps playing.
:::

#### FlowerAd

Represents an ad returned by the Flower SDK:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| id | String | Ad ID |
| duration | Long | Duration of the ad (ms) |
| creatives | List\<FlowerCreative\> | List of playable creative media |

#### FlowerCreative

Represents ad creative assets returned by the SDK:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| type | String | Media MIME type |
| width | Int | Media width (px) |
| height | Int | Media height (px) |
| url | String | Media URL |

#### Example

```kotlin
private fun requestAd() {
    // TODO GUIDE:
    //  The same ad break(cue) should have the same value.
    //  Therefore, we recommend using the Splice Event ID.
    val transactionId = parseScte35EventId()
    // TODO GUIDE:
    //  This is the value converted to milliseconds from the breakDuration (90 kHz per second)
    //  in the Splice Event.
    val cueDuration = 30000L // ex: 30 seconds
    // TODO GUIDE: This is the uniqueProgramId of Splice Event.
    val uniqueProgramId = 1 // Unique program ID for the cue
    // TODO GUIDE:
    //  Use the value obtained by subtracting 1 second from the time difference between the
    //  current time and the ad start time.
    val timeout = 5000L // ex: 5 seconds

    adPlayer.clearMediaItems()
    adPlayerView.visibility = View.GONE
    flowerAdView.visibility = View.GONE

    // TODO GUIDE: Request linear tv ad using Flow
    // Returns Flow<FlowerAd> that emits each ad as it becomes available.
    // Throws FlowerError if no ads are available or a timeout occurs.
    // Returns emptyFlow() if a duplicate transactionId is used.
    val adFlow = flowerAdView.adsManager.requestChannelAd(
        transactionId,
        cueDuration,
        uniqueProgramId,
        timeout,
    )

    var isFirstAdResponse = true
    adRequestJob?.cancel()
    adRequestJob = uiScope.launch {
        adFlow.catch { e ->
            // NO_AD / TIMEOUT - the break is skipped and the content keeps playing.
            Log.e("FlowerSDK Example", "Ad request failed: ${e.message}")
        }.collect { flowerAd ->
            Log.d("FlowerSDK Example", "responded ad: $flowerAd")

            // TODO GUIDE: Add the received ad to the ad player's playlist
            // Select the best fit creative based on ad player height
            val playerHeight = adPlayerView.height
            val bestFitCreative = flowerAd.creatives
                .filter { it.url.contains(".mpd") || it.url.contains(".m3u8") }
                .ifEmpty { flowerAd.creatives }
                .minByOrNull { abs(it.height - playerHeight) }
            if (bestFitCreative == null) {
                Log.w("FlowerSDK Example", "No creatives available for ad; skipping")
                return@collect
            }

            adPlayer.addMediaItem(MediaItem.fromUri(bestFitCreative.url))

            // Prepare once, on the first ad of the break. Later ads of the same break keep
            // filling the playlist while it is already playing.
            if (isFirstAdResponse) {
                adPlayer.playWhenReady = false
                adPlayer.prepare()
                isFirstAdResponse = false
            }
        }
    }
}
```

### 3. Play the Ad

The returned ads should be played replacing the original stream according to the ad marker (such as SCTE-35). The method of playing the ads may vary depending on the host application's logic, but the following rules must be observed:

- **Use the creative URL exactly as it was received.** Its tracking id query parameter is how the SDK recognizes the playing ad. Do not normalize, re-sign, or strip query parameters from it.
- **Call `adsManager.play()` when the ad break playback starts** so that the SDK knows the break began and can start reporting.
- **Show `FlowerAdView` while the break is playing** so that ad interactions such as "more info" and skip can be rendered, and hide it when the break is over.
- **Ads of the same break may keep arriving while the break is already playing.** Start the break once the first ad is available and keep appending later ads to the ad player's playlist.
- **If no ad is returned** (the Flow throws `FlowerError`), treat it as a no-ad scenario and keep playing the original stream during the ad marker.

#### Example

```kotlin
uiScope.launch {
    // TODO GUIDE: Call flowerAdView.adsManager.play() at the ad start time and show adPlayer
    delay(timeUntilAdMarker)

    adPlayerView.visibility = View.VISIBLE
    flowerAdView.visibility = View.VISIBLE
    adPlayer.playWhenReady = true
    player.volume = 0.0f

    // TODO GUIDE: Notify the SDK that the ad break playback started.
    flowerAdView.adsManager.play()
}
```

The end of the ad break can be detected either from your own player — `Player.STATE_ENDED` is reported when the ad playlist drains, as shown in the `prepareAd()` example above — or from the SDK through `FlowerAdsManagerListener`:

```kotlin
// TODO GUIDE: Implement FlowerAdsManagerListener
private class FlowerAdsManagerListenerImpl(
    private val activity: PlaybackActivity,
) : FlowerAdsManagerListener {
    override fun onPrepare(adDurationMs: Int) {
        // OPTIONAL GUIDE: Need nothing to do for linear TV
    }

    override fun onPlay() {
        // OPTIONAL GUIDE: Implement custom actions for when the ad playback starts
    }

    override fun onCompleted() {
        CoroutineScope(Main).launch {
            // OPTIONAL GUIDE: Implement custom actions for when the ad playback ends
            activity.player.volume = 1.0f
        }
    }

    override fun onError(error: FlowerError?) {
        Log.e("FlowerSDK Example", "Flower onError", error)
        CoroutineScope(Main).launch {
            // TODO GUIDE:
            //  This is the case where an error occurs inside the SDK.
            //  Remove the ad player and restore the main content to its normal state
            activity.flowerAdView.adsManager.removeListener(this@FlowerAdsManagerListenerImpl)
            activity.flowerAdView.adsManager.stop()
            activity.adPlayer.stop()
            activity.adPlayer.release()

            activity.player.volume = 1.0f
        }
    }

    override fun onAdBreakSkipped(reason: Int) {
        // OPTIONAL GUIDE: Need nothing to do for linear TV
        Log.i("FlowerSDK Example", "Ad skipped - reason: $reason")
    }

    override fun onAdUserAction(action: String, adInfo: AdInfo) = Unit
}
```

### 4. Leaving the Channel

When leaving the channel view, cancel any open ad request and stop the SDK:

```kotlin
override fun onBackPressed() {
    super.onBackPressed()

    player.stop()
    player.release()
    adPlayer.stop()
    adPlayer.release()

    // Cancelling the scope stops the collection of a request that is still open.
    uiScope.cancel()

    // TODO GUIDE: Stop Flower SDK
    flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
    flowerAdView.adsManager.stop()
}
```

## Ad Playback Time Detection – `MediaPlayerAdapter`

The SDK uses the `MediaPlayerAdapter` to detect ad playback time and handle ad interactions such as "more info", skip, and event tracking. Therefore, the implementation of the `MediaPlayerAdapter` passed to `enterChannel()` is critical for accurate ad behavior.

In this flow the SDK never drives the ad player: it only polls `isPlaying()` and `getCurrentMedia()` to follow ad progress. The following describes the implementation guidelines for each method:

| **Method** | **Return Type** | **Description** |
| ---| ---| --- |
| getCurrentMedia() | Media | Returns the URL, duration, and current playback position of the currently playing ad creative. The `position` is measured **per ad**: it must start at 0 when each ad creative begins and count up only to that creative's own duration. It must never be a cumulative time across the ads of the break or across the channel. **This is the most important method** — accurate values are required for ad tracking to work correctly. |
| getVolume() | KotlinWrapped\<Float\> | Returns the audio volume level (0.0–1.0) |
| isPlaying() | KotlinWrapped\<Boolean\> | Returns whether the player is currently playing |
| getHeight() | KotlinWrapped\<Int\> | Returns the video height in pixels (0 if unknown) |
| pause() | Unit | Pauses the playback |
| stop() | Unit | Stops the player and releases resources |
| resume() | Unit | Resumes the playback |
| enqueuePlayItem(playItem) | Unit | Queues the next play item. No implementation is required for this approach, because the application adds the creatives to the ad player itself. |
| removePlayItem(playItem) | Unit | Removes a matching play item from the queue. No implementation is required for this approach. |
| playNextItem() | Unit | Plays the next item in the queue |
| seekToPosition(...) | Unit | Seeks to the specified position. No implementation is required for this approach. |
| getCurrentAbsoluteTime(isPrintDetails) | KotlinWrapped\<Double\> | Returns the current absolute playback time in ms. No implementation is required for this approach. |
| getPlayerType() | String? | Returns an identifier for the player implementation. The SDK uses it to apply player specific behavior and includes it in ad requests. |
| getPlayerVersion() | String? | Returns the player version string. The SDK includes it in ad requests. |

:::tip Importance of getCurrentMedia()
`getCurrentMedia()` is the core method the SDK uses to track ad playback progress. The `urlOrId`, `duration`, and `position` values in the returned `Media` object must be accurate for ad skip, "more info", and event tracking to function correctly.

- `urlOrId` must be the creative URL **exactly as it was received** from `requestChannelAd`.
- `duration` must be the duration of the currently playing ad creative, not the total duration of the break.
- `position` must be the elapsed playback time **of the currently playing ad only, starting from 0**. When the next ad in the break starts, it goes back to 0. The SDK derives the ad quartile events (start, 25%, 50%, 75%, complete) from this value, so a cumulative position makes the tracking fire at the wrong times.

`ExoPlayer.currentPosition` already reports the position within the current media item, so it satisfies this requirement as long as each creative is added as its own `MediaItem`.
:::

For a full `MediaPlayerAdapter` implementation based on ExoPlayer, refer to the [Direct Player Control](../implement-interface-video-player/direct-player-control) documentation.
