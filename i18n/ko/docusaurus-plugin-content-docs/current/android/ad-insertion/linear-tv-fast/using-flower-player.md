---
sidebar_position: 1
---

# Flower Player 사용

Flower Player를 사용하면 기존 실시간 TV 재생 설정에 광고 재생을 간편하게 정합할 수 있습니다.

Flower Player에 대한 자세한 내용은 [Flower Player 소개](../about-flower-players)를 참고하세요.

## 작업 순서

이 다이어그램은 Flower Player를 사용한 실시간 TV 광고 삽입 워크플로우를 보여줍니다.
![](/img/docs/a1d85d95-eea9-4dd9-9ade-dfb83220e169.png)
![](/img/docs/1f582e96-3472-4888-9bed-2b42fdb0060d.png)

## FlowerLinearTvAdConfig

실시간 방송에서 광고 삽입 시 필요한 정보를 지정할 때 사용되는 클래스입니다.

자세한 내용은 [FlowerAdConfig](../../api/flower-ad-config)를 참고하세요.

## 프리롤 광고 {#pre-roll-ads}

채널 프리롤은 시청자가 채널에 진입할 때 실시간 스트림이 시작되기 전에 한 번 재생되는 광고입니다. 사용하려면 Anypoint Media에서 발급받은 프리롤 광고 태그 URL을 `FlowerLinearTvAdConfig`의 `prerollAdTagUrl`로 설정하세요. 프리롤을 사용하지 않으면 `null`로 둡니다.

프리롤은 Flower Player가 직접 처리합니다. 광고 설정과 함께 채널을 로드하면 Flower Player가 프리롤을 요청해 재생하고, 프리롤이 끝난 뒤에만 채널 스트림을 로드합니다. `prepare()`와 `play()`는 평소처럼 호출하세요. Flower Player가 프리롤이 준비될 때까지 이를 보류합니다. `changeChannelUrl()`이나 `adsManager.play()`를 직접 호출하지 마세요.

- **이벤트:** `addAdListener()`로 등록한 리스너는 다른 광고와 같은 방식으로 프리롤 이벤트를 받습니다. 프리롤이 시작될 때 `onPlay()`, 끝날 때 `onCompleted()`가 호출됩니다.
- **광고 없음 또는 요청 실패:** 프리롤 응답에 광고가 없거나(`onAdBreakSkipped()`) 요청이 실패하면 리스너는 `onCompleted()`를 받고 Flower Player가 채널을 시작합니다.
- **재생 중 실패:** 재생 중 프리롤이 실패하면 리스너는 `onError()`를 받으며, Flower Player는 채널을 직접 로드하지 않습니다. [광고 이벤트 수신](#광고-이벤트-수신)에서 설명한 대로 채널을 다시 시작하세요.
- **PIP:** 기본값인 `FlowerSdk.setIgnoreAdBreakInPIPMode(true)`에서는 채널 프리롤도 VOD 광고와 마찬가지로 사용자가 앱을 떠나면 일시정지되고 돌아오면 재개됩니다. 이를 `FlowerSdk.notifyUserLeftApp()`으로 알려야 합니다. [PIP 모드 지원](../../getting-started/pip-mode-support)을 참고하세요.
- **채널 전환:** 새 `FlowerLinearTvAdConfig`로 다른 채널을 로드하면 이전 채널의 광고 세션이 정지되고 새 채널의 프리롤을 요청합니다.
- **같은 채널에 다시 진입:** SDK는 마지막으로 진입한 채널(`channelId`)을 기억합니다. 같은 채널의 광고 설정을 다시 설정하면 `prerollAdTagUrl`이 설정되어 있더라도 Flower Player는 프리롤을 건너뛰고 채널을 재생합니다. 기억된 채널은 `stop()`이나 `release()`로는 지워지지 않으며, VOD 광고나 인라인 광고를 요청하면 지워집니다. 예를 들어 A → B → A로 전환하면 A의 프리롤이 다시 재생되고, A → VOD → A도 마찬가지입니다. SDK가 화면과 관계없이 채널을 기억하므로, 그 사이에 VOD 광고나 인라인 광고 요청 없이 플레이어 화면을 나갔다가 같은 채널로 돌아와도 프리롤을 건너뜁니다.

## 광고 이벤트 수신

실시간 채널에 광고를 삽입할 때, 광고 재생 시작/종료 시점에 UI 제어 로직이 필요할 수 있습니다. 이를 위해 Flower SDK는 광고 이벤트를 수신하는 리스너 인터페이스 **FlowerAdsManagerListener**를 제공하며, 아래와 같이 구현할 수 있습니다.

자세한 내용은 [FlowerAdsManagerListener](../../api/flower-ads-manager-listener)를 참고하세요.

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
        // TODO GUIDE: on an error, stop the ads manager and the player, then restart the channel.
        //             Listeners are called off the main thread, so switch to the main thread first.
        CoroutineScope(Dispatchers.Main).launch {
            // FlowerExoPlayer2 / FlowerMedia3ExoPlayer: stop() and release() also stop the ads manager.
            // FlowerBitmovinPlayer: destroy() does, or call player.flowerAdView.adsManager.stop() first.
            player.stop()
            player.release()
            // Start the channel again: a Flower Player, then setMediaItem with FlowerLinearTvAdConfig, prepare, and play.
            // Use the same FlowerLinearTvAdConfig as the first start, including prerollAdTagUrl.
            // OPTIONAL GUIDE: limit consecutive restarts (e.g., 3 in a row) so a persistent error does not loop.
            playLinearTv()
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

재시작용 `FlowerLinearTvAdConfig`는 `prerollAdTagUrl`을 포함해 처음 시작할 때와 완전히 같은 값으로 만드세요. 시청자가 프리롤을 다시 보지는 않습니다. 재시작하는 채널이 마지막으로 진입한 채널이므로 Flower Player가 프리롤을 건너뛰고 채널을 재생하기 때문입니다. 채널을 처음 시작할 때와 다른 채널로 전환할 때는 설정한 대로 프리롤을 사용합니다.

## 전체 예시

아래는 실시간 TV 스트림에 광고를 삽입하는 예시입니다. FlowerExoPlayer2를 사용합니다.

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

    // Used for the first start of a channel and a restart after onError
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
        // Use the same values on a restart: the Flower Player skips the pre-roll of the channel entered last.
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
                // TODO GUIDE: Stop the player (and the ads manager) and restart the channel as shown in Receiving Ad Events,
                //            with playLinearTv()
            }
            override fun onAdBreakSkipped(reason: Int) {
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

## 관련 API

*   [FlowerAdConfig](../../api/flower-ad-config)
*   [FlowerExoPlayer2](../../api/flower-exo-player2)
*   [FlowerMedia3ExoPlayer](../../api/flower-media3-exo-player)
*   [FlowerBitmovinPlayer](../../api/flower-bitmovin-player)
