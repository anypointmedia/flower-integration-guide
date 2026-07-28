---
sidebar_position: 3
---

# 광고 재생 직접 제어

Flower SDK가 제공하는 플레이리스트 매니퓰레이션 기능을 사용하지 않고 채널 대체 광고를 직접 구현하는 경우에도, SDK의 실시간 TV 라이브 채널 광고 요청 기능을 활용하여 광고를 연동할 수 있습니다. 이 경우 광고 연동은 다음 단계를 따릅니다:
1. **라이브 채널 진입 알림 (`enterChannel`):** 스트림 재생을 시작할 때 광고 태그 URL, 채널 ID 등의 정보와 함께 광고를 재생할 플레이어의 어댑터를 전달합니다.
2. **라이브 채널 광고 요청 (`requestChannelAd`):** 현재 채널에서 재생할 수 있는 광고 정보를 요청합니다.
3. **광고 재생:** SDK가 광고를 반환하면 호스트 앱의 로직에 따라 앱이 소유한 플레이어로 광고를 재생하고, 광고 브레이크가 시작되었음을 SDK에 알립니다.

이 방식에서 호스트 앱은 **두 개의 플레이어**를 소유합니다. 하나는 채널 콘텐츠용이고, 다른 하나는 광고 소재용입니다. SDK는 광고 플레이어를 직접 제어하지 않으며, 앱이 전달한 `MediaPlayerAdapter`를 통해 플레이어 상태만 관찰합니다. 즉 재생 제어는 앱이 담당하고, SDK는 광고 진행 상태를 파악하여 트래킹 비콘을 전송합니다.

:::note
이 방식은 SDK 스트림 프록시를 경유하지 않으므로 `changeChannelUrl()`을 사용하지 않습니다. 앱이 원본 채널 URL을 직접 재생합니다.
:::

## 단계별 상세 설명

### 1. 라이브 채널 진입 알림 -- `enterChannel`

#### FlowerAdsManager.enterChannel()

SDK에 실시간 방송 진입을 알리는 함수입니다. 다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | string | Flower 백엔드 시스템에서 발급된 광고 태그 URL<br/>Anypoint Media에 요청하여 adTagUrl을 발급받아야 합니다. |
| channelId | string | 고유 채널 ID<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | map | (Optional) 타겟팅을 위해 사전 협의된 추가 정보 |
| mediaPlayerAdapter | MediaPlayerAdapter | **광고 플레이어**의 `MediaPlayerAdapter` 인터페이스 구현 객체<br/>자세한 내용은 [플레이어를 직접 제어하는 경우](../implement-interface-video-player/direct-player-control) 문서를 참고하세요. |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |

#### 예시

```kotlin
private fun prepareAd() {
    // 앱이 소유한 광고 플레이어입니다. 광고는 SDK가 아니라 이 플레이어에서 재생됩니다.
    adPlayer = ExoPlayer.Builder(this).build()
    adPlayer.setVideoSurfaceView(adPlayerView)
    adPlayer.playWhenReady = false
    adPlayer.addListener(
        object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState != Player.STATE_ENDED) {
                    return
                }

                // 플레이리스트가 모두 소진되었습니다. 광고 브레이크가 종료된 시점입니다.
                adPlayerView.visibility = View.GONE
                flowerAdView.visibility = View.GONE
                adPlayer.clearMediaItems()
            }
        }
    )

    val mediaPlayerAdapter = ExoPlayerAdapter(adPlayer)

    // TODO GUIDE: Inform channel enter
    // 이 함수는 실제로 광고를 재생할 플레이어의 MediaPlayerAdapter를 전달받습니다. 이를 통해
    // 앱이 재생을 제어하는 동안에도 SDK가 광고 진행 상태를 파악하여 트래킹 비콘을 전송할 수
    // 있습니다.
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

    // 채널 스트림은 그대로 재생됩니다. 이 방식은 SDK 프록시를 경유하지 않습니다.
    player = ExoPlayer.Builder(this).build()
    player.addListener(this)
    player.setVideoSurfaceView(playerView)
    player.setMediaItem(MediaItem.fromUri(videoUrl))
    player.playWhenReady = true
    player.prepare()
}
```

### 2. 라이브 채널 광고 요청 -- `requestChannelAd`

#### FlowerAdsManager.requestChannelAd()

현재 라이브 채널에 대한 광고를 요청하는 함수입니다. 이 메소드는 코루틴 `Flow<FlowerAd>`를 반환하며, 광고가 준비되는 대로 순차적으로 emit합니다. 다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| transactionId | Long | 고유 큐 이벤트 ID<br/>광고 요청마다 다른 값이어야 합니다. 동일한 광고 브레이크(큐)는 하나의 `transactionId`를 유지해야 하므로, SCTE-35 Splice Event ID를 사용하는 것을 권장합니다. |
| adDuration | Long | 요청할 광고 길이 (밀리초)<br/>Splice Event의 `breakDuration`(90kHz)을 밀리초로 변환한 값입니다. |
| uniqueProgramId | Int | 광고 요청에 사용할 고유 프로그램 ID<br/>Flower 백엔드 시스템에 등록되어야 함 |
| timeout | Long | 광고 요청 타임아웃 (밀리초)<br/>**중요:** 현재 재생 시점을 기준으로 광고 마커가 발생하는 시점까지의 시간 차이를 계산하여 설정해야 합니다. |

**반환값:** `Flow<FlowerAd>` — 재생 가능한 `FlowerAd` 객체를 emit하는 코루틴 Flow. 진행 중인 요청의 광고 수신을 중단하려면 collect 중인 코루틴을 취소(`Job.cancel()`)하세요.

:::note 동작 방식
- 이전 요청과 동일한 `transactionId`로 요청하면 `emptyFlow()`를 반환합니다.
- 응답된 광고가 없거나 타임아웃이 발생하면 `FlowerError(message)`를 throw합니다. 이 경우 광고 브레이크를 건너뛰고 콘텐츠를 계속 재생해야 합니다.
:::

#### FlowerAd

Flower SDK가 반환하는 광고 객체입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| id | String | 광고 ID |
| duration | Long | 광고 길이 (ms) |
| creatives | List\<FlowerCreative\> | 재생 가능한 광고 소재 목록 |

#### FlowerCreative

SDK가 반환하는 광고 소재 객체입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| type | String | 미디어 MIME 타입 |
| width | Int | 미디어 너비 (px) |
| height | Int | 미디어 높이 (px) |
| url | String | 미디어 URL |

#### 예시

```kotlin
private fun requestAd() {
    // TODO GUIDE:
    //  동일한 광고 브레이크(큐)는 같은 값을 사용해야 하므로 Splice Event ID를 권장합니다.
    val transactionId = parseScte35EventId()
    // TODO GUIDE:
    //  Splice Event의 breakDuration(초당 90kHz)을 밀리초로 변환한 값입니다.
    val cueDuration = 30000L // ex: 30 seconds
    // TODO GUIDE: Splice Event의 uniqueProgramId 값입니다.
    val uniqueProgramId = 1 // Unique program ID for the cue
    // TODO GUIDE:
    //  현재 시각과 광고 시작 시각의 차이에서 1초를 뺀 값을 사용하세요.
    val timeout = 5000L // ex: 5 seconds

    adPlayer.clearMediaItems()
    adPlayerView.visibility = View.GONE
    flowerAdView.visibility = View.GONE

    // TODO GUIDE: Flow를 사용하여 linear tv 광고 요청
    // Flow<FlowerAd>를 반환하며, 광고가 준비되는 대로 emit합니다.
    // 응답된 광고가 없거나 타임아웃 시 FlowerError를 throw합니다.
    // 동일한 transactionId로 중복 요청 시 emptyFlow()를 반환합니다.
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
            // NO_AD / TIMEOUT - 브레이크를 건너뛰고 콘텐츠를 계속 재생합니다.
            Log.e("FlowerSDK Example", "Ad request failed: ${e.message}")
        }.collect { flowerAd ->
            Log.d("FlowerSDK Example", "responded ad: $flowerAd")

            // TODO GUIDE: 수신한 광고를 광고 플레이어의 플레이리스트에 추가합니다.
            // 광고 플레이어 높이에 가장 적합한 소재를 선택합니다.
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

            // 브레이크의 첫 광고에서 한 번만 prepare합니다. 동일한 브레이크의 이후 광고는
            // 브레이크가 재생되는 동안에도 플레이리스트를 계속 채웁니다.
            if (isFirstAdResponse) {
                adPlayer.playWhenReady = false
                adPlayer.prepare()
                isFirstAdResponse = false
            }
        }
    }
}
```

### 3. 광고 재생

반환된 광고는 광고 마커(예: SCTE-35)에 따라 원본 스트림을 대체하여 재생해야 합니다. 광고 재생 방식은 호스트 앱의 로직에 따라 달라질 수 있지만, 다음 규칙은 반드시 지켜야 합니다:

- **소재 URL은 전달받은 그대로 사용해야 합니다.** URL의 트래킹 id 쿼리 파라미터가 SDK가 재생 중인 광고를 식별하는 수단입니다. URL을 정규화하거나 재서명하거나 쿼리 파라미터를 제거하지 마세요.
- **광고 브레이크 재생이 시작되면 `adsManager.play()`를 호출**하여 브레이크가 시작되었음을 SDK에 알려야 합니다. 그래야 SDK가 리포팅을 시작할 수 있습니다.
- **브레이크 재생 중에는 `FlowerAdView`를 노출**하여 광고 더보기, 스킵 등의 인터랙션이 표시되도록 하고, 브레이크가 종료되면 숨깁니다.
- **동일한 브레이크의 광고는 브레이크가 이미 재생되는 중에도 계속 도착할 수 있습니다.** 첫 광고가 준비되면 브레이크를 시작하고, 이후 도착하는 광고는 광고 플레이어의 플레이리스트에 계속 추가하세요.
- **응답된 광고가 없는 경우**(Flow가 `FlowerError`를 throw) 광고가 없는 것으로 처리하고, 광고 마커 구간에서 원본 스트림을 계속 재생해야 합니다.

#### 예시

```kotlin
uiScope.launch {
    // TODO GUIDE: 광고 시작 시점에 flowerAdView.adsManager.play()를 호출하고 adPlayer를 노출합니다.
    delay(timeUntilAdMarker)

    adPlayerView.visibility = View.VISIBLE
    flowerAdView.visibility = View.VISIBLE
    adPlayer.playWhenReady = true
    player.volume = 0.0f

    // TODO GUIDE: 광고 브레이크 재생이 시작되었음을 SDK에 알립니다.
    flowerAdView.adsManager.play()
}
```

광고 브레이크의 종료는 앱의 플레이어에서 직접 감지할 수도 있고(위 `prepareAd()` 예시처럼 광고 플레이리스트가 모두 소진되면 `Player.STATE_ENDED`가 전달됩니다), `FlowerAdsManagerListener`를 통해 SDK로부터 전달받을 수도 있습니다:

```kotlin
// TODO GUIDE: Implement FlowerAdsManagerListener
private class FlowerAdsManagerListenerImpl(
    private val activity: PlaybackActivity,
) : FlowerAdsManagerListener {
    override fun onPrepare(adDurationMs: Int) {
        // OPTIONAL GUIDE: 실시간 TV에서는 처리할 내용이 없습니다.
    }

    override fun onPlay() {
        // OPTIONAL GUIDE: 광고 재생이 시작될 때 필요한 동작을 구현합니다.
    }

    override fun onCompleted() {
        CoroutineScope(Main).launch {
            // OPTIONAL GUIDE: 광고 재생이 종료될 때 필요한 동작을 구현합니다.
            activity.player.volume = 1.0f
        }
    }

    override fun onError(error: FlowerError?) {
        Log.e("FlowerSDK Example", "Flower onError", error)
        CoroutineScope(Main).launch {
            // TODO GUIDE:
            //  SDK 내부에서 오류가 발생한 경우입니다.
            //  광고 플레이어를 정리하고 메인 콘텐츠를 정상 상태로 복구합니다.
            activity.flowerAdView.adsManager.removeListener(this@FlowerAdsManagerListenerImpl)
            activity.flowerAdView.adsManager.stop()
            activity.adPlayer.stop()
            activity.adPlayer.release()

            activity.player.volume = 1.0f
        }
    }

    override fun onAdBreakSkipped(reason: Int) {
        // OPTIONAL GUIDE: 실시간 TV에서는 처리할 내용이 없습니다.
        Log.i("FlowerSDK Example", "Ad skipped - reason: $reason")
    }

    override fun onAdUserAction(action: String, adInfo: AdInfo) = Unit
}
```

### 4. 채널 이탈 처리

채널 화면을 벗어날 때는 진행 중인 광고 요청을 취소하고 SDK를 종료해야 합니다:

```kotlin
override fun onBackPressed() {
    super.onBackPressed()

    player.stop()
    player.release()
    adPlayer.stop()
    adPlayer.release()

    // 스코프를 취소하면 아직 진행 중인 요청의 collect가 중단됩니다.
    uiScope.cancel()

    // TODO GUIDE: Stop Flower SDK
    flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
    flowerAdView.adsManager.stop()
}
```

## 광고 재생 시간 감지 -- `MediaPlayerAdapter`

SDK는 `MediaPlayerAdapter`를 통해 광고의 재생 시간을 파악하여 광고 더보기, 스킵, 이벤트 트래킹 등을 처리합니다. 따라서 `enterChannel()`에 전달하는 `MediaPlayerAdapter`의 구현은 정확한 광고 동작을 위해 매우 중요합니다.

이 방식에서 SDK는 광고 플레이어를 직접 제어하지 않으며, `isPlaying()`과 `getCurrentMedia()`만 폴링하여 광고 진행 상태를 파악합니다. 아래는 각 메소드별 구현 지침입니다:

| **메소드** | **반환 유형** | **설명** |
| ---| ---| --- |
| getCurrentMedia() | Media | 현재 재생 중인 광고 소재의 URL, duration, 현재 재생 시점을 반환합니다. `position`은 **광고 단위**로 계산해야 합니다. 각 광고 소재의 재생이 시작될 때 0부터 시작하여 해당 소재의 duration까지만 증가해야 하며, 브레이크 내 광고들의 누적 시간이나 채널 전체의 재생 시간이어서는 안 됩니다. **가장 중요한 메소드**이며, 정확한 값을 반환해야 광고 트래킹이 올바르게 동작합니다. |
| getVolume() | KotlinWrapped\<Float\> | 오디오 볼륨 레벨을 0.0~1.0 사이로 반환합니다 |
| isPlaying() | KotlinWrapped\<Boolean\> | 플레이어가 현재 재생 중인지 여부를 반환합니다 |
| getHeight() | KotlinWrapped\<Int\> | 비디오 높이를 픽셀 단위로 반환합니다 (알 수 없으면 0) |
| pause() | Unit | 재생을 일시정지합니다 |
| stop() | Unit | 플레이어를 종료 처리합니다 |
| resume() | Unit | 비디오 재생을 재개합니다 |
| enqueuePlayItem(playItem) | Unit | 다음 재생할 플레이 아이템을 큐에 추가합니다. 이 방식에서는 앱이 직접 광고 플레이어에 소재를 추가하므로 구현할 필요가 없습니다. |
| removePlayItem(playItem) | Unit | 일치하는 플레이 아이템을 큐에서 제거합니다. 현재 방식에서는 구현할 필요가 없습니다. |
| playNextItem() | Unit | 큐의 다음 플레이 아이템을 재생합니다 |
| seekToPosition(...) | Unit | 특정 위치로 재생 시점을 이동합니다. 현재 방식에서는 구현할 필요가 없습니다. |
| getCurrentAbsoluteTime(isPrintDetails) | KotlinWrapped\<Double\> | 현재 절대 재생 시간을 ms 단위로 반환합니다. 현재 방식에서는 구현할 필요가 없습니다. |
| getPlayerType() | String? | 플레이어 구현을 식별하는 문자열을 반환합니다. SDK가 플레이어별 동작을 적용하고 광고 요청에 포함하는 데 사용합니다. |
| getPlayerVersion() | String? | 플레이어 버전 문자열을 반환합니다. SDK가 광고 요청에 포함합니다. |

:::tip getCurrentMedia()의 중요성
`getCurrentMedia()`는 SDK가 광고 재생 진행 상태를 파악하는 핵심 메소드입니다. 반환하는 `Media` 객체의 `urlOrId`, `duration`, `position` 값이 정확해야 광고 스킵, 더보기, 이벤트 트래킹이 올바르게 동작합니다.

- `urlOrId`에는 `requestChannelAd`로 **전달받은 그대로의** 소재 URL을 반환해야 합니다.
- `duration`은 브레이크 전체 길이가 아니라 현재 재생 중인 광고 소재의 길이여야 합니다.
- `position`은 **현재 재생 중인 광고의 경과 시간이며, 반드시 0부터 시작**해야 합니다. 브레이크의 다음 광고가 시작되면 다시 0부터 계산됩니다. SDK는 이 값을 기준으로 광고 quartile 이벤트(start, 25%, 50%, 75%, complete)를 발생시키므로, 누적 시간을 반환하면 트래킹이 잘못된 시점에 전송됩니다.

`ExoPlayer.currentPosition`은 현재 미디어 아이템 내에서의 재생 시점을 반환하므로, 각 소재를 개별 `MediaItem`으로 추가한다면 이 요건을 만족합니다.
:::

ExoPlayer 기반의 전체 `MediaPlayerAdapter` 구현 예시는 [플레이어를 직접 제어하는 경우](../implement-interface-video-player/direct-player-control) 문서를 참고하세요.
