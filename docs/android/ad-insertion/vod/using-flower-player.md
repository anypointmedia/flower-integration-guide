---
sidebar_position: 1
---

# Using Flower Player

Using Flower Player, you can simply integrate ad playback into your existing VOD playback setup.
See [About Flower Players](../about-flower-players) to read more about Flower Players.

## Workflow

This diagram illustrates the ad insertion workflow in VOD using Flower Player.
![](/img/docs/4ceb1cda-a3b1-49cd-8b48-0418805f1875.png)
![](/img/docs/b59df566-85f0-49f6-96c4-261b3381303f.png)

## FlowerVodAdConfig

Class used to specify information required for ad insertion in VOD contents.
For more information, see [FlowerAdConfig](../../api/flower-ad-config).

## Receiving Ad Events

When inserting ads into VOD contents, UI control logic may be needed at ad playback start/end points. For this, Flower SDK provides a listener interface **FlowerAdsManagerListener** for receiving ad events, which can be implemented as follows:

The Flower Player starts the content by itself after the pre-roll, and the SDK pauses and resumes the content around a mid-roll. When an ad fails (`onError`), handle it by where the content is:

*   **Pre-roll error** (the content has not started): the Flower Player does not start the content by itself. Start the content without ads.
*   **Mid-roll error** (the content has not ended): nothing to do. Before it calls `onError`, the SDK brings the content back `rewindDuration` before the point where the mid-roll interrupted it, so the content is already playing again. Do not stop, seek, or reload it.
*   **Post-roll error** (the content has ended): do not resume. Run the end-of-playback scenario.
*   **Content playback error** (message starting with `playback unrecoverable`): the content stopped and the SDK will not recover it. Reload the content or show an error to the user. See [VOD Ad Implementation](./vod-ad-implementation) for when this is reported.

`onCompleted` may also be called for a failed break, before or after `onError`.

```kotlin
// Set isContentEnd = true when the content ends (Player.STATE_ENDED, or PlayerEvent.PlaybackFinished for Bitmovin)
private var isContentStarted = false
private var isContentEnd = false

val adsManagerListener = object : FlowerAdsManagerListener {
    override fun onPrepare(adDurationMs: Int) {
        // OPTIONAL GUIDE: Additional actions on ad prepare
        displayYourAdNotice()
    }

    override fun onPlay() {
        // OPTIONAL GUIDE: Additional actions on ad playback start
        displayYourAdIndicator()
    }

    override fun onCompleted() {
        CoroutineScope(Dispatchers.Main).launch {
            // The first onCompleted() ends the pre-roll phase (also called when no pre-roll is served).
            // The Flower Player starts the content by itself.
            isContentStarted = true
            // OPTIONAL GUIDE: Additional actions on ad playback end
            hideYourAdIndicator()
        }
    }

    override fun onError(error: FlowerError?) {
        CoroutineScope(Dispatchers.Main).launch {
            if (!isContentStarted) {
                // TODO GUIDE: the pre-roll failed - start the content without ads.
                //             stop() also stops the ads manager, and setMediaItem() without an ad config plays the content as is.
                //             (FlowerBitmovinPlayer: destroy it, create a new one, and load the source without an ad config.)
                player.stop()
                player.setMediaItem(MediaItem.fromUri(videoUrl))
                player.prepare()
                player.play()
                isContentStarted = true
            } else if (error?.message?.startsWith("playback unrecoverable") == true) {
                // TODO GUIDE: the content stopped and the SDK will not recover it.
                //             Reload the content or show an error to the user.
            } else if (isContentEnd) {
                // TODO GUIDE: a post-roll failed - VOD playback is fully done. Do not resume.
                //             Run your end-of-playback actions.
            }
            // NOTE: a mid-roll failed - the SDK has already resumed the content.
            //       Do not stop, seek, or reload it.
        }
    }

    override fun onAdBreakSkipped(reason: Int) {
        // OPTIONAL GUIDE: Additional actions on ad skip
        logger.info { "onAdBreakSkipped: $reason" }
    }
}

// Register the listener to Flower Player
player.addAdListener(adsManagerListener)
```

## Full Example

The example shows an example to insert ads in VOD content. The example uses FlowerExoPlayer2.

```kotlin
class PlaybackActivity : Activity() {
    // TODO GUIDE: Replace your ExoPlayer with FlowerExoPlayer2 or FlowerMedia3ExoPlayer
    private lateinit var player: FlowerExoPlayer2
    private lateinit var playerView: SurfaceView

    // OPTIONAL GUIDE: Create FlowerAdsManagerListener instance
    private lateinit var flowerAdsManagerListener: FlowerAdsManagerListener

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_playback)

        playerView = findViewById(R.id.player_view)

        playVod()
    }

    override fun onDestroy() {
        super.onDestroy()
        player.stop()
        player.removeAdListener(flowerAdsManagerListener)
        player.release()
    }

    private fun playVod() {
        // TODO GUIDE: Create ExoPlayer using standard ExoPlayer.Builder
        val exoPlayer = ExoPlayer.Builder(this)
            .setLoadControl(
                DefaultLoadControl.Builder()
                    .setBufferDurationsMs(
                        DefaultLoadControl.DEFAULT_MIN_BUFFER_MS,
                        DefaultLoadControl.DEFAULT_MAX_BUFFER_MS,
                        DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_MS,
                        DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS
                    )
                    .build()
            )
            .build()

        // TODO GUIDE: Wrap your ExoPlayer with FlowerExoPlayer2
        player = FlowerExoPlayer2(exoPlayer, this)

        player.setVideoSurfaceView(playerView)

        val videoUrl = "https://video_url"

        // TODO GUIDE: Configure VOD ad
        // arg0: adTagUrl, Ad tag URL issued by Flower backend system
        //       You must file a request to Anypoint Media to receive a adTagUrl.
        // arg1: contentId, Unique content ID
        //       Must be registered in Flower backend system.
        //       You must file a request to Anypoint Media to receive a adTagUrl.
        // arg2: contentDuration, Duration of VOD content in milliseconds
        // arg3: requestTimeout, Minimum timeout duration in milliseconds for requesting VOD ads
        //       Default is 5000.
        // arg4: minPrepareDuration, Preparation lead time in milliseconds. A mid-roll ad is requested
        //       requestTimeout + minPrepareDuration before the mid-roll's position.
        //       Default is 5000.
        // arg5: rewindDuration, Duration in milliseconds to rewind the content when a mid-roll ad break ends
        //       Default is 5000.
        // arg6: extraParams, (Optional) values you can provide for targeting
        // arg7: adTagHeaders, (Optional) values included in headers for ad request
        val adConfig = FlowerVodAdConfig(
            adTagUrl = "https://ad_request",
            contentId = "1",
            contentDuration = 3_600_000L,
            requestTimeout = 5_000L,
            minPrepareDuration = 5_000L,
            rewindDuration = 5_000L,
            extraParams = mapOf(
                "title" to "My Summer Vacation",
                "genre" to "horror",
                "contentRating" to "PG-13"
            ),
            adTagHeaders = mapOf(
                "custom-ad-header" to "custom-ad-header-value"
            ),
        )

        // OPTIONAL GUIDE: Implement FlowerAdsManagerListener to receive ad events
        class FlowerAdsManagerListenerImpl : FlowerAdsManagerListener {
            override fun onPrepare(adDurationMs: Int) {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback is prepared
            }
            override fun onPlay() {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback starts
            }
            override fun onCompleted() {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback ends
            }
            override fun onError(error: FlowerError?) {
                // TODO GUIDE: Start, reload, or end the content as shown in Receiving Ad Events
            }
            override fun onAdBreakSkipped(reason: Int) {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback is skipped
            }
        }
        // OPTIONAL GUIDE: Register FlowerAdsManagerListener to receive ad events
        flowerAdsManagerListener = FlowerAdsManagerListenerImpl()
        player.addAdListener(flowerAdsManagerListener)

        // TODO GUIDE: FlowerAdConfig should be delivered in setMediaItem() method call
        val mediaItem = MediaItem.fromUri(videoUrl)
        player.setMediaItem(mediaItem, adConfig)
        player.prepare()
        player.play()
    }
}
```

## Related APIs

*   [FlowerAdConfig](../../api/flower-ad-config)
*   [FlowerExoPlayer2](../../api/flower-exo-player2)
*   [FlowerMedia3ExoPlayer](../../api/flower-media3-exo-player)
*   [FlowerBitmovinPlayer](../../api/flower-bitmovin-player)
