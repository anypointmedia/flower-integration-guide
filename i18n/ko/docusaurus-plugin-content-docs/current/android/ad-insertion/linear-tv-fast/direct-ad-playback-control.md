---
sidebar_position: 3
---

# 광고 재생 직접 제어

Flower SDK가 제공하는 플레이리스트 매니퓰레이션 기능을 사용하지 않고 채널 대체 광고를 직접 구현하는 경우에도, SDK의 실시간 TV 라이브 채널 광고 요청 기능을 활용하여 광고를 연동할 수 있습니다. 이 경우 광고 연동은 다음 단계를 따릅니다:
1. **라이브 채널 진입 알림 (`enterChannel`):** 스트림 재생을 시작할 때 광고 태그 URL, 채널 ID 등의 정보를 전달합니다.
2. **라이브 채널 광고 요청 (`requestChannelAd`):** 현재 채널에서 재생할 수 있는 광고 정보를 요청합니다.
3. **광고 재생:** SDK가 광고 목록을 반환하면, 호스트 앱의 로직에 따라 광고를 재생합니다.

## 단계별 상세 설명

### 1. 라이브 채널 진입 알림 -- `enterChannel`

#### FlowerAdsManager.enterChannel()

SDK에 실시간 방송 진입을 알리는 함수입니다. 다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | string | Flower 백엔드 시스템에서 발급된 광고 태그 URL<br/>Anypoint Media에 요청하여 adTagUrl을 발급받아야 합니다. |
| contentId | string | 고유 채널 ID<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | map | (Optional) 타겟팅을 위해 사전 협의된 추가 정보 |
| mediaPlayerAdapter | MediaPlayerAdapter | MediaPlayerAdapter 인터페이스 구현 객체<br/>자세한 내용은 [플레이어를 직접 제어하는 경우](../implement-interface-video-player/direct-player-control) 문서를 참고하세요. |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |

#### 예시

```kotlin
private fun playLinearTv() {
    // TODO GUIDE: Inform channel enter
    // arg0: adTagUrl, url from flower system
    //       You must file a request to Anypoint Media to receive an adTagUrl.
    // arg1: channelId, unique channel id in your service
    // arg2: extraParams, values you can provide for targeting
    // arg3: mediaPlayerAdapter, interface that provides methods to control playback,
    //       manage media items, and retrieve player state
    // arg4: adTagHeaders, (Optional) values included in headers for ad request
    flowerAdView.adsManager.enterChannel(
        "https://ad_request",
        "100",
        mapOf("custom-param" to "custom-param-value"),
        mediaPlayerAdapter,
        mapOf("custom-ad-header" to "custom-ad-header-value"),
    )
}
```

### 2. 라이브 채널 광고 요청 -- `requestChannelAd`

#### FlowerAdsManager.requestChannelAd()

현재 라이브 채널에 대한 광고를 요청하는 함수입니다. 이 메소드는 코루틴 `Flow<FlowerAd>`를 반환하며, 광고가 준비되는 대로 순차적으로 emit합니다. 다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| transactionId | Long | 고유 큐 이벤트 ID<br/>광고 요청마다 다른 값이어야 함 |
| adDuration | Long | 요청할 광고 길이 (밀리초) |
| uniqueProgramId | Int | 광고 요청에 사용할 고유 프로그램 ID<br/>Flower 백엔드 시스템에 등록되어야 함 |
| timeout | Long | 광고 요청 타임아웃 (밀리초)<br/>**중요:** 현재 재생 시점을 기준으로 광고 마커가 발생하는 시점까지의 시간 차이를 계산하여 설정해야 합니다. |

**반환값:** `Flow<FlowerAd>` — 재생 가능한 `FlowerAd` 객체를 emit하는 코루틴 Flow.

:::note 동작 방식
- 이전 요청과 동일한 `transactionId`로 요청하면 `emptyFlow()`를 반환합니다.
- 응답된 광고가 없거나 타임아웃이 발생하면 `FlowerError(message)`를 throw합니다.
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
val transactionId = parseScte35EventId()
val cueDuration = 30000L // 30 seconds
val uniqueProgramId = 1 // Unique program ID for the cue
val timeout = 5000L // 5 seconds timeout for ad request

// TODO GUIDE: Flow를 사용하여 linear tv 광고 요청
// Flow<FlowerAd>를 반환하며, 광고가 준비되는 대로 emit합니다.
// 응답된 광고가 없거나 타임아웃 시 FlowerError를 throw합니다.
// 동일한 transactionId로 중복 요청 시 emptyFlow()를 반환합니다.
lifecycleScope.launch {
    flowerAdView.adsManager.requestChannelAd(
        transactionId,
        cueDuration,
        uniqueProgramId,
        timeout,
    ).catch { e ->
        Log.e("FlowerSDK Example", "Ad request failed: ${e.message}")
    }.collect { flowerAd ->
        Log.i("FlowerSDK Example", "Received ad: ${flowerAd.id}")
        playFlowerAd(flowerAd)
    }
}
```

### 3. 광고 재생

반환된 광고 목록은 광고 마커(예: SCTE-35)에 따라 원본 스트림을 대체하여 재생해야 합니다. 각 `FlowerAd`를 재생할 때, 호스트 앱은 반드시 `FlowerAdTracker` 구현체와 함께 `FlowerAd.start()`를 호출하여 광고 서버에 보고해야 합니다.

반환된 광고 목록이 비어 있는 경우, 타임아웃 등의 사유로 광고가 없는 것으로 처리하고 광고 마커 구간에서 원본 스트림을 계속 재생해야 합니다.

광고 목록이 비어 있지 않은 경우, 원본 스트림의 광고 마커 시작 시점에 광고 소재를 순차적으로 재생해야 합니다. 광고 재생 방식은 호스트 앱의 로직에 따라 달라질 수 있습니다.

## 광고 재생 시간 감지 -- `MediaPlayerAdapter`

SDK는 `MediaPlayerAdapter`를 통해 광고의 재생 시간을 파악하여 광고 더보기, 스킵, 이벤트 트래킹 등을 처리합니다. 따라서 `enterChannel()`에 전달하는 `MediaPlayerAdapter`의 구현은 정확한 광고 동작을 위해 매우 중요합니다.

아래는 각 메소드별 구현 지침입니다:

| **메소드** | **반환 유형** | **설명** |
| ---| ---| --- |
| getCurrentMedia() | Media | 현재 재생 중인 광고 소재의 URL, duration, 현재 재생 시점을 반환합니다. **가장 중요한 메소드**이며, 정확한 값을 반환해야 광고 트래킹이 올바르게 동작합니다. |
| getVolume() | KotlinWrapped\<Float\> | 오디오 볼륨 레벨을 0.0~1.0 사이로 반환합니다 |
| isPlaying() | KotlinWrapped\<Boolean\> | 플레이어가 현재 재생 중인지 여부를 반환합니다 |
| getHeight() | KotlinWrapped\<Int\> | 비디오 높이를 픽셀 단위로 반환합니다 (알 수 없으면 0) |
| pause() | Unit | 재생을 일시정지합니다 |
| stop() | Unit | 플레이어를 종료 처리합니다 |
| resume() | Unit | 비디오 재생을 재개합니다 |
| enqueuePlayItem(playItem) | Unit | 다음 재생할 플레이 아이템을 큐에 추가합니다 |
| removePlayItem(playItem) | Unit | 일치하는 플레이 아이템을 큐에서 제거합니다 |
| playNextItem() | Unit | 큐의 다음 플레이 아이템을 재생합니다 |
| seekToPosition(...) | Unit | 특정 위치로 재생 시점을 이동합니다. 현재 방식에서는 구현할 필요가 없습니다. |
| getCurrentAbsoluteTime(isPrintDetails) | KotlinWrapped\<Double\> | 현재 절대 재생 시간을 ms 단위로 반환합니다. 현재 방식에서는 구현할 필요가 없습니다. |
| getPlayerType() | String? | 플레이어 타입 식별자를 반환합니다 (Google PAL SDK용) |
| getPlayerVersion() | String? | 플레이어 버전 문자열을 반환합니다 (Google PAL SDK용) |

:::tip getCurrentMedia()의 중요성
`getCurrentMedia()`는 SDK가 광고 재생 진행 상태를 파악하는 핵심 메소드입니다. 반환하는 `Media` 객체의 `urlOrId`, `duration`, `position` 값이 정확해야 광고 스킵, 더보기, 이벤트 트래킹이 올바르게 동작합니다.
:::

