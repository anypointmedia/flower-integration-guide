---
sidebar_position: 2
---

# VOD Pre-roll, Mid-roll, Post-roll 광고 적용

본 가이드는 Flower SDK를 사용하여 VOD 콘텐츠에 광고를 삽입하는 전체 과정을 안내합니다. 광고 연동은 다음 단계를 따릅니다:
1. **광고 UI 선언:** 광고를 표시하기 위해 화면에 `FlowerAdView`를 배치합니다.
2. **광고 이벤트 수신 구현:** 광고 재생 및 완료 시점의 로직 처리를 위해 `FlowerAdsManagerListener`를 구현합니다.
3. **플레이어 전달:** SDK가 콘텐츠 재생 상태를 인식할 수 있도록 `MediaPlayerHook`을 구현하여 플레이어 정보를 전달합니다.
4. **추가 파라미터 설정 (`extraParams`):** 광고 타겟팅에 필요한 추가 정보를 구성합니다.
5. **VOD 광고 요청 (`requestVodAd`):** 광고 태그 URL, 콘텐츠 ID 등의 정보를 전달하여 VOD 광고를 요청합니다.
6. **재생 상태 제어**: 콘텐츠 재생 흐름에 맞추어 SDK의 `pause()`, `resume()`, `stop()` 메소드를 호출합니다.

## 단계별 상세 설명

### 1. 광고 UI 선언

> 광고 UI 선언은 광고 삽입 메뉴 > 광고 UI 선언 섹션을 참고하세요.

### 2. 광고 이벤트 수신 -- `FlowerAdsManagerListener`

> VOD 콘텐츠 재생 중 광고 이벤트에 대응하여 재생을 제어하려면 `FlowerAdsManagerListener` 인터페이스를 구현합니다.
> 이를 통해 광고 재생 중 본편을 일시정지하거나 재개하고, 재생 오류 또는 스킵 이벤트를 처리할 수 있습니다. 아래와 같이 구현할 수 있습니다:

```kotlin
val adsManagerListener = object : FlowerAdsManagerListener {
    override fun onPrepare(adDurationMs: Int) {
        CoroutineScope(Dispatchers.Main).launch {
            if (player.isPlaying) {
                // OPTIONAL GUIDE: additional actions before ad playback
                showNotification("Ads will start in a moment.")
                delay(5000)

                // TODO GUIDE: play midroll ad
                flowerAdView.adsManager.play()
            } else {
                // TODO GUIDE: play preroll ad
                flowerAdView.adsManager.play()
            }
        }
    }

    override fun onPlay() {
        // TODO GUIDE: pause VOD content
        CoroutineScope(Dispatchers.Main).launch {
            player.playWhenReady = false
        }
    }

    override fun onCompleted() {
        // TODO GUIDE: resume VOD content after ad complete
        CoroutineScope(Dispatchers.Main).launch {
            if (!isContentEnd) {
                player.playWhenReady = true
            }
        }
    }

    override fun onError(error: FlowerError?) {
        // TODO GUIDE: resume VOD content on ad error
        CoroutineScope(Dispatchers.Main).launch {
            if (!isContentEnd) {
                player.playWhenReady = true
            }
        }
    }

    override fun onAdSkipped(reason: Int) {
        logger.info { "onAdSkipped: $reason" }
    }
}
flowerAdView.adsManager.addListener(adsManagerListener)
```

### 3. 플레이어 전달 -- `MediaPlayerHook`

> 광고 재생 상태 기반 트래킹을 위해 현재 플레이어 인스턴스를 SDK에 제공해야 합니다.
> Flower SDK가 재생 상태 및 타이밍 정보에 접근할 수 있도록 `MediaPlayerHook` 인터페이스를 구현합니다.

#### 지원 플레이어

*   ExoPlayer2
*   Media3 ExoPlayer
*   Bitmovin Player

위 플레이어들은 `MediaPlayerHook` 인터페이스를 구현하여 SDK에 현재 플레이어를 전달합니다.

#### 미지원 플레이어 사용 시

지원되지 않는 플레이어를 사용하는 경우 [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의해주세요.

### 4. 광고 요청 시 추가 파라미터 -- `extraParams`

> Flower SDK를 사용하여 광고를 요청할 때 추가 매개변수를 전달하면, SDK가 가장 적합한 광고를 제공하는 데 도움이 됩니다. 웹 앱의 경우 SDK가 자체적으로 광고 제공 컨텍스트를 판단할 수 없으므로, 광고 요청 시 이러한 매개변수를 SDK에 반드시 전달해야 합니다.

#### 파라미터 목록

| 키<br/>(\* 표시는 웹앱 필수) | 값 | 예시 |
| ---| ---| --- |
| serviceId\* | 앱의 패키지 이름 | "tv.anypoint.service" |
| os\* | 앱이 실행되는 기기의 OS | "Web" |
| adId\* | 앱이 실행되는 기기의 광고 식별자 | Web: 사용자 식별자 또는 세션 ID |

### 5. VOD 광고 API 호출 -- `requestVodAd(...)`

#### FlowerAdsManager.requestVodAd()

VOD 콘텐츠 진입 전 광고를 요청하는 데 사용하는 함수입니다.

다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | string | Flower 백엔드 시스템에서 발급된 광고 태그 URL.<br/>Anypoint Media에 요청하여 adTagUrl을 발급받아야 합니다. |
| contentId | string | 고유 콘텐츠 ID.<br/>Flower 백엔드 시스템에 등록되어야 합니다. |
| durationMs | long | VOD 콘텐츠의 전체 재생 시간(밀리초). |
| extraParams | map | (Optional) 타겟팅을 위해 사전 협의된 추가 정보. |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체. |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보. |

#### FlowerAdsManager.notifyContentEnded()

VOD 콘텐츠 재생이 완료되었을 때(예: `Player.STATE_ENDED`) 이 API를 호출합니다. post-roll 광고 로딩을 트리거합니다. 매개변수는 없습니다.

```kotlin
// Detect content end
player.addListener(object : Player.Listener {
    override fun onPlaybackStateChanged(playbackState: Int) {
        if (playbackState == Player.STATE_ENDED) {
            isContentEnd = true
            flowerAdView.adsManager.notifyContentEnded()
        }
    }
})
```

#### FlowerAdsManager.stop()

VOD 콘텐츠를 나갈 때 이 API를 호출합니다. 매개변수는 없습니다.

#### FlowerAdsManager.pause()

VOD 콘텐츠를 일시정지할 때 사용하는 API입니다. 매개변수는 없습니다.

#### FlowerAdsManager.resume()

VOD 콘텐츠를 재개할 때 사용하는 API입니다. 매개변수는 없습니다.

## VOD 광고 요청 예시

```kotlin
// TODO GUIDE: request vod ad
// arg0: adTagUrl, url from flower system.
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: contentId, unique content id in your service
// arg2: durationMs, duration of vod content in milliseconds
// arg3: extraParams, values you can provide for targeting
// arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
// arg5: adTagHeaders, (Optional) values included in headers for ad request
flowerAdView.adsManager.requestVodAd(
    adTagUrl = "https://ad_request",
    contentId = "100",
    durationMs = 3_600_000L,
    extraParams = mapOf("custom-param" to "custom-param-value"),
    mediaPlayerHook = { player },
    adTagHeaders = mapOf("custom-ad-header" to "custom-ad-header-value"),
)

// TODO GUIDE: stop SDK when exiting VOD
fun onVodExit() {
    flowerAdView.adsManager.stop()
}
```
