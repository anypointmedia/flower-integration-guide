---
sidebar_position: 1
---

# Flower Player 사용

Flower Player를 사용하면 기존 VOD 재생 설정에 광고 재생을 간편하게 정합할 수 있습니다.
Flower Player에 대한 자세한 내용은 [Flower Player 소개](../player-and-ad-ui/about-flower-players)를 참고하세요.

## 작업 순서

이 다이어그램은 Flower Player를 사용한 VOD 광고 삽입 워크플로우를 보여줍니다.
![](/img/docs/4ceb1cda-a3b1-49cd-8b48-0418805f1875.png)
![](/img/docs/b59df566-85f0-49f6-96c4-261b3381303f.png)

## FlowerVodAdConfig

VOD 콘텐츠에 광고 삽입 시 필요한 정보를 지정할 때 사용되는 클래스입니다.
자세한 내용은 [FlowerAdConfig](../api/flower-ad-config)를 참고하세요.

## 광고 이벤트 수신

VOD 콘텐츠에 광고를 삽입할 때, 광고 재생 시작/종료 시점에 UI 제어 로직이 필요할 수 있습니다. 이를 위해 Flower SDK는 광고 이벤트를 수신하는 리스너 인터페이스 **FlowerAdsManagerListener**를 제공하며, 아래와 같이 구현할 수 있습니다:

```kotlin
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
        // OPTIONAL GUIDE: Additional actions on ad playback end
        hideYourAdIndicator()
    }

    override fun onError(error: FlowerError?) {
        // TODO GUIDE: restart to play Linear TV on ad error
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

## 전체 예시

아래는 VOD 콘텐츠에 광고를 삽입하는 예시입니다. FlowerExoPlayer2를 사용합니다.

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
        // arg1: contentId, Unique content ID
        //       Must be registered in Flower backend system.
        //       You must file a request to Anypoint Media to receive a adTagUrl.
        // arg2: contentDuration, Duration of VOD content in milliseconds
        // arg3: requestTimeout, Minimum timeout duration in milliseconds for requesting VOD ads
        //       Default is 5000.
        // arg4: minPrepareDuration, Minimum wait time in milliseconds from the onPrepare event until ad playback starts
        //       Default is 5000.
        // arg5: extraParams, (Optional) values you can provide for targeting
        // arg6: adTagHeaders, (Optional) values included in headers for ad request
        val adConfig = FlowerVodAdConfig(
            adTagUrl = "https://ad_request",
            contentId = "1",
            contentDuration = 3_600_000L,
            requestTimeout = 5_000L,
            minPrepareDuration = 5_000L,
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
        val mediaItem = MediaItem.fromUri(videoUrl)
        player.setMediaItem(mediaItem, adConfig)
        player.prepare()
        player.play()
    }
}
```

## 관련 API

*   [FlowerAdConfig](../api/flower-ad-config)
*   [FlowerExoPlayer2](../api/flower-exo-player2)
*   [FlowerMedia3ExoPlayer](../api/flower-media3-exo-player)
*   [FlowerBitmovinPlayer](../api/flower-bitmovin-player)
