---
sidebar_position: 2
---

# 플레이어 수동 제어

본 가이드는 Flower SDK를 사용하여 실시간 TV 채널 및 FAST 스트림에 광고를 삽입하는 전체 과정을 안내합니다. 광고 연동은 다음 단계를 따릅니다:
1. **광고 UI 선언:** 광고를 표시하기 위해 화면에 `FlowerAdView`를 배치합니다.
2. **광고 이벤트 수신 구현:** 광고 재생 및 완료 시점의 로직 처리를 위해 `FlowerAdsManagerListener`를 구현합니다.
3. **플레이어 전달:** SDK가 콘텐츠 재생 상태를 인식할 수 있도록 `MediaPlayerHook`을 구현하여 플레이어 정보를 전달합니다.
4. **추가 파라미터 설정 (`extraParams`):** 광고 타겟팅에 필요한 추가 정보를 구성합니다.
5. **실시간 채널 URL 변경 (`changeChannelUrl`):** 광고 태그 URL, 채널 ID 등의 정보를 전달하여 스트림 URL을 변경합니다.
6. **재생 중 파라미터 업데이트:** 스트림 재생 중 `changeChannelExtraParams()`를 통해 타겟팅 정보를 업데이트합니다.

## 단계별 상세 설명

### 1. 광고 UI 선언

> 광고 UI 선언은 광고 삽입 메뉴 > 광고 UI 선언 섹션을 참고하세요.

### 2. 광고 이벤트 수신 -- `FlowerAdsManagerListener`

> **실시간 채널에 광고를 삽입하는 경우**, 광고 마커(예: SCTE-35)를 통해 본 스트림을 대체하는 광고가 재생됩니다. 광고 재생 시작/종료 시점에 **UI 제어 등의 로직이 필요할 수 있습니다.** 이를 위해 Flower SDK는 **광고 이벤트를 수신하는 리스너 인터페이스**를 제공하며, 아래와 같이 구현할 수 있습니다.

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

### 3. 플레이어 전달 -- `MediaPlayerHook`

> 실시간 채널의 경우 본 콘텐츠를 재생하는 플레이어를 SDK에 전달해야 합니다.

#### 지원 플레이어

*   ExoPlayer2
*   Media3 ExoPlayer
*   Bitmovin Player

위 플레이어들은 `MediaPlayerHook` 인터페이스를 구현하여 SDK에 현재 플레이어를 전달합니다.

#### 미지원 플레이어 사용 시

지원되지 않는 플레이어를 사용하는 경우 [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의해주세요.

### 4. 광고 요청 시 추가 파라미터 -- `extraParams`

> Flower SDK를 사용하여 광고를 요청할 때 추가 매개변수를 전달하면, SDK가 가장 적합한 광고를 제공하는 데 도움이 됩니다. 모바일 앱의 경우 SDK가 자체적으로 광고 제공 컨텍스트를 판단할 수 없으므로, 광고 요청 시 이러한 매개변수를 SDK에 반드시 전달해야 합니다.

#### 파라미터 목록

| 키<br/>(\* 표시는 모바일 앱 필수) | 값 | 예시 |
| ---| ---| --- |
| serviceId\* | 앱의 패키지 이름 | "tv.anypoint.service" |
| os\* | 앱이 실행되는 기기의 OS | "Android" |
| adId\* | 앱이 실행되는 기기의 광고 식별자 | Android: 구글의 GAID 값 |

### 5. 실시간 채널 광고 API 호출 -- `changeChannelUrl(...)`

#### FlowerAdsManager.changeChannelUrl()

실시간 방송의 스트림 URL을 변경할 때 사용하는 함수입니다. 다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| videoUrl | string | 원본 재생 URL |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| channelId | string | 고유 채널 ID<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _null_) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | map | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |
| prerollAdTagUrl | string | (Optional) 프리롤용 광고 서버 발급 광고 태그 URL |

#### FlowerAdsManager.changeChannelExtraParams()

추가 타겟팅 정보인 extraParams를 실시간 방송 도중에 변경할 때 사용하는 함수입니다. 다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보 |

#### FlowerAdsManager.stop()

실시간 방송을 중단할 때 사용하는 API입니다. 매개변수는 없습니다.

## 실시간 채널 광고 요청 예시

:::tip 프리롤 광고와 재생 시작
`changeChannelUrl()`을 호출하면 SDK가 광고 추적이 적용된 스트림 URL을 반환합니다. 반환된 URL을 플레이어에 설정한 뒤, `prerollAdTagUrl` 설정 여부에 따라 재생 시작 방식이 달라집니다.

- **`prerollAdTagUrl`을 설정하지 않은 경우:** `player.play()`를 직접 호출하여 콘텐츠 재생을 시작해야 합니다.
- **`prerollAdTagUrl`을 설정한 경우:** SDK가 프리롤 광고를 먼저 재생한 뒤 자동으로 콘텐츠 재생을 시작하므로, `player.play()`를 별도로 호출할 필요가 없습니다.
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

## MediaPlayerAdapter 사용

SDK가 공식적으로 지원하지 않는 플레이어를 사용하는 경우, `MediaPlayerAdapter` 인터페이스를 구현하여 플레이어를 직접 제어할 수 있습니다.

`MediaPlayerHook` 대신 `MediaPlayerAdapter` 구현체를 `changeChannelUrl()` 오버로드에 전달합니다.

### FlowerAdsManager.changeChannelUrl(...) with MediaPlayerAdapter

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| videoUrl | string | 원본 재생 URL |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| channelId | string | 고유 채널 ID<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _null_) |
| mediaPlayerAdapter | MediaPlayerAdapter | MediaPlayerAdapter 인터페이스 구현 객체<br/>자세한 내용은 [플레이어를 직접 제어하는 경우](../implement-interface-video-player/direct-player-control) 문서를 참고하세요. |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | map | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |
| prerollAdTagUrl | string | (Optional) 프리롤용 광고 서버 발급 광고 태그 URL |

### MediaPlayerAdapter 인터페이스

`MediaPlayerAdapter` 인터페이스에는 다음 메소드가 필요합니다:

| **메소드** | **반환 유형** | **설명** |
| ---| ---| --- |
| getCurrentMedia() | Media | 현재 재생 중인 미디어 정보를 반환합니다 (urlOrId, duration, position) |
| getVolume() | Float | 오디오 볼륨 레벨을 반환합니다 (0.0~1.0) |
| isPlaying() | Boolean | 플레이어가 현재 재생 중인지 여부를 반환합니다 |
| getHeight() | Int | 비디오 높이를 픽셀 단위로 반환합니다 (알 수 없으면 0) |
| pause() | Unit | 재생을 일시정지합니다 |
| stop() | Unit | 재생을 중지하고 리소스를 해제합니다 |
| resume() | Unit | 재생을 재개합니다 |
| enqueuePlayItem(playItem) | Unit | 새로운 재생 항목을 큐에 추가합니다 |
| removePlayItem(playItem) | Unit | 큐에 있는 재생 항목을 제거합니다 |
| playNextItem() | Unit | 큐의 다음 미디어 항목으로 이동합니다 |
| seekToPosition(...) | Unit | 지정된 위치로 이동합니다 |
| getCurrentAbsoluteTime(isPrintDetails) | Double | 현재 절대 재생 시간을 ms 단위로 반환합니다 |
| getPlayerType() | String? | 플레이어 타입 식별자를 반환합니다 (Google PAL SDK용) |
| getPlayerVersion() | String? | 플레이어 버전 문자열을 반환합니다 (Google PAL SDK용) |

### 예시

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
