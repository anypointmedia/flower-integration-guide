---
sidebar_position: 1
---

# Flower Player 사용

Flower Player를 사용하면 기존 VOD 재생 설정에 광고 재생을 간편하게 정합할 수 있습니다.
Flower Player에 대한 자세한 내용은 [Flower Player 소개](../about-flower-players)를 참고하세요.

## 작업 순서

이 다이어그램은 Flower Player를 사용한 VOD 광고 삽입 워크플로우를 보여줍니다.
![](/img/docs/4ceb1cda-a3b1-49cd-8b48-0418805f1875.png)
![](/img/docs/b59df566-85f0-49f6-96c4-261b3381303f.png)

## FlowerVodAdConfig

VOD 콘텐츠에 광고 삽입 시 필요한 정보를 지정할 때 사용되는 클래스입니다.
자세한 내용은 [FlowerAdConfig](../../api/flower-ad-config)를 참고하세요.

## 광고 이벤트 수신

VOD 콘텐츠에 광고를 삽입할 때, 광고 재생 시작/종료 시점에 UI 제어 로직이 필요할 수 있습니다. 이를 위해 Flower SDK는 광고 이벤트를 수신하는 리스너 인터페이스 **FlowerAdsManagerListener**를 제공하며, 아래와 같이 구현할 수 있습니다:

Flower Player는 프리롤이 끝나면 콘텐츠를 직접 시작하며, 미드롤 전후의 콘텐츠 일시정지와 재개는 SDK가 처리합니다. 광고가 실패하면(`onError`) 콘텐츠 상태에 따라 다음과 같이 처리하세요:

*   **프리롤 오류** (콘텐츠가 시작되지 않음): Flower Player는 콘텐츠를 직접 시작하지 않습니다. 광고 없이 콘텐츠를 시작하세요.
*   **미드롤 오류** (콘텐츠가 끝나지 않음): 할 일이 없습니다. SDK는 `onError`를 호출하기 전에 미드롤이 콘텐츠를 중단시킨 지점에서 `rewindDuration`만큼 앞선 위치로 콘텐츠를 되돌려 놓으므로, 콘텐츠는 이미 다시 재생 중입니다. 정지, 탐색(seek), 재로드하지 마세요.
*   **포스트롤 오류** (콘텐츠가 끝남): 재개하지 마세요. 재생 종료 시나리오를 실행하세요.
*   **콘텐츠 재생 오류** (메시지가 `playback unrecoverable`로 시작): 콘텐츠 재생이 중단되었고 SDK가 복구하지 않습니다. 콘텐츠를 다시 로드하거나 사용자에게 오류를 표시하세요. 이 오류가 보고되는 경우는 [VOD 광고 적용](./vod-ad-implementation)을 참고하세요.

실패한 Ad Break에 대해 `onCompleted`도 호출될 수 있으며, `onError`보다 먼저 올 수도 나중에 올 수도 있습니다.

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

## 관련 API

*   [FlowerAdConfig](../../api/flower-ad-config)
*   [FlowerExoPlayer2](../../api/flower-exo-player2)
*   [FlowerMedia3ExoPlayer](../../api/flower-media3-exo-player)
*   [FlowerBitmovinPlayer](../../api/flower-bitmovin-player)
