---
sidebar_position: 1
---

# Using Flower Player

Using Flower Player, you can simply integrate ad playback into your existing linear tv playback setup.

See [About Flower Players](../about-flower-players) to read more about Flower Players.

## Workflow

This diagram illustrates the ad insertion workflow in linear tv using Flower Player.
![](/img/docs/a1d85d95-eea9-4dd9-9ade-dfb83220e169.png)
![](/img/docs/1f582e96-3472-4888-9bed-2b42fdb0060d.png)

## FlowerLinearTvAdConfig

Class used to specify information required for ad insertion in live broadcasts.

For more information, see [FlowerAdConfig](../../api/flower-ad-config).

## Receiving Ad Events

When inserting ads into linear channels, UI control logic may be needed at ad playback start/end points. For this, Flower SDK provides a listener interface **FlowerAdsManagerListener** for receiving ad events, which can be implemented as follows.

For more information, see [FlowerAdsManagerListener](../../api/flower-ads-manager-listener).

```kotlin
val adsManagerListener = object : FlowerAdsManagerListener {
    override fun onPrepare(adDurationMs: Int) {
        // Nothing for linear tv
    }

    override fun onPlay() {
        // OPTIONAL GUIDE: Additional actions on ad playback start
        displayYourAdIndicator()
    }

    override fun onCompleted() {
        // OPTIONAL GUIDE: Additional actions on ad playback end
        hideYourAdIndicator()
    }

    override fun onError(error: FlowerError?) {
        // TODO GUIDE: Restart to play Linear TV on ad error
        releasePlayer()
        playLinearTv()
    }

    override fun onAdSkipped(reason: Int) {
        // OPTIONAL GUIDE: Additional actions on ad skip
        logger.info { "onAdSkipped: $reason" }
    }
}

// Register the listener to Flower Player
player.addAdListener(adsManagerListener)
```

## Full Example

The example shows an example to insert ads in linear tv stream. The example uses FlowerExoPlayer2.

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

        playLinearTv()
    }

    override fun onDestroy() {
        super.onDestroy()
        player.stop()
        player.removeAdListener(flowerAdsManagerListener)
        player.release()
    }

    private fun playLinearTv() {
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

        // TODO GUIDE: Configure linear tv ad
        // arg0: adTagUrl, Ad tag URL issued by Flower backend system
        //       You must file a request to Anypoint Media to receive a adTagUrl.
        // arg1: prerollAdTagUrl, (Optional) Pre-roll ad tag URL issued by Flower backend system
        //       You must file a request to Anypoint Media to receive a prerollAdTagUrl.
        // arg2: channelId, Unique channel ID
        //       Must be registered in Flower backend system.
        // arg3: extraParams, (Optional) Additional information pre-agreed for targeting
        // arg4: adTagHeaders, (Optional) HTTP header information to add for ad requests
        // arg5: channelStreamHeaders, (Optional) HTTP header information to add for original stream requests
        val adConfig = FlowerLinearTvAdConfig(
            adTagUrl = "https://ad_request",
            prerollAdTagUrl = "https://preroll_ad_request",
            channelId = "1",
            extraParams = mapOf(
                "title" to "My Summer Vacation",
                "genre" to "horror",
                "contentRating" to "PG-13"
            ),
            adTagHeaders = mapOf(
                "custom-ad-header" to "custom-ad-header-value"
            ),
            channelStreamHeaders = mapOf(
                "custom-stream-header" to "custom-stream-header-value"
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
                // OPTIONAL GUIDE: Implement custom actions for when the error occurs in Flower SDK
            }
            override fun onAdSkipped(reason: Int) {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback is skipped
            }
        }
        // OPTIONAL GUIDE: Register FlowerAdsManagerListener to receive ad events
        flowerAdsManagerListener = FlowerAdsManagerListenerImpl()
        player.addAdListener(flowerAdsManagerListener)

        // TODO GUIDE: FlowerAdConfig should be delivered in setMediaItem() method call
        val mediaItem = MediaItem.fromUri(videoUrl, adConfig)
        player.setMediaItem(mediaItem)
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
