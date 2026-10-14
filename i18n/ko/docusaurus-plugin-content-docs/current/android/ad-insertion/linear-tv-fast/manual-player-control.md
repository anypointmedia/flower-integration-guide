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
        // TODO GUIDE: on an error, stop the ads manager and the player, then restart the channel.
        //             Listeners are called off the main thread, so switch to the main thread first.
        CoroutineScope(Dispatchers.Main).launch {
            flowerAdView.adsManager.stop()
            player.stop()
            // Start the channel again in the same way as the first start: a new changeChannelUrl(...) call with the same
            // parameters, including prerollAdTagUrl. The SDK skips the pre-roll of the channel entered last.
            // OPTIONAL GUIDE: limit consecutive restarts (e.g., 3 in a row) so a persistent error does not loop.
            playLinearTv()
        }
    }

    override fun onAdBreakSkipped(reason: Int) {
        logger.info { "onAdBreakSkipped: $reason" }
    }
}
flowerAdView.adsManager.addListener(adsManagerListener)
```

:::info `onError` 복구
`onError`는 광고 재생에 실패했거나 채널 스트림을 더 이상 재생할 수 없을 때 호출됩니다. `stop()`으로 광고 매니저를 정지하고 콘텐츠 플레이어를 정지한 다음, 새 `changeChannelUrl(...)` 호출로 채널을 다시 시작하세요. `stop()` 이전에 반환된 URL은 재사용하지 마세요. `prerollAdTagUrl`을 포함해 처음 시작할 때와 완전히 같은 매개변수를 전달하고, 반환된 URL도 같은 방식으로 처리하세요. `prerollAdTagUrl`을 전달했다면 [프리롤 광고](#pre-roll-ads)에서 설명한 것처럼 `onCompleted()`까지 URL 로드를 미룹니다. 시청자가 프리롤을 다시 보지는 않습니다. SDK는 마지막으로 진입한 채널의 프리롤을 건너뛰고 `changeChannelUrl()`이 반환된 직후 `onCompleted()`를 보내기 때문입니다. 리스너는 등록된 상태로 유지되므로, 다시 시작된 채널의 이벤트도 같은 리스너가 수신합니다. `stop()`으로 중단된 광고 구간이 그 뒤에 `onCompleted`를 보낼 수 있으므로, `onCompleted`에는 여러 번 실행되어도 안전한 UI 작업만 두세요.

채널 스트림 재생이 중단되었고 SDK가 이를 복구하지 않을 때, 플레이어 어댑터가 장애 1건당 한 번 `playback unrecoverable (<reason>) - url: <url>` 메시지와 플레이어의 오류를 `cause`로 담아 `onError`를 호출합니다. Media3 ExoPlayer / ExoPlayer2는 SDK가 자동 복구하지 않는 치명적 플레이어 오류, SDK의 `BehindLiveWindow` 자동 복구가 꺼져 있을 때의 `BehindLiveWindow`, 3회 복구를 시도한 뒤에도 멈춰 있는 라이브 플레이리스트가 해당하며, Bitmovin은 3회 재로드 시도 후 또는 재로드할 소스가 없는 경우입니다. 같은 방법으로 복구하되, 가능하면 새로 발급받은 채널 URL을 사용하세요.
:::

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

## 프리롤 광고 {#pre-roll-ads}

채널 프리롤은 시청자가 채널에 진입할 때 실시간 스트림이 시작되기 전에 한 번 재생되는 광고입니다. 선택 사항이며, 스트림에 삽입되는 광고 구간과는 별개입니다.

### 프리롤 설정

Anypoint Media에서 발급받은 프리롤 광고 태그 URL을 `changeChannelUrl()`의 마지막 인자인 `prerollAdTagUrl`로 전달합니다. 프리롤이 없는 채널에는 `null`을 전달합니다. `changeChannelUrl()`의 `MediaPlayerAdapter` 오버로드도 같은 인자를 받습니다. Flower Player를 사용하는 경우에는 대신 `FlowerLinearTvAdConfig.prerollAdTagUrl`을 설정합니다. [Flower Player 사용](./using-flower-player#pre-roll-ads)을 참고하세요.

### 재생 흐름

`prerollAdTagUrl`을 설정해도 `changeChannelUrl()`은 스트림 URL을 바로 반환하며, SDK는 이와 함께 프리롤을 요청하고 `FlowerAdView` 위에서 자체 광고 플레이어로 재생합니다. 앱은 프리롤을 위해 `adsManager.play()`를 호출하지 않습니다. 앱은 프리롤이 끝난 뒤에 채널을 시작합니다:

1. 반환된 URL을 아직 로드하지 않습니다. 기존 `FlowerAdsManagerListener`를 제거하고 임시 리스너를 등록합니다.
2. 임시 리스너의 첫 `onCompleted()`(또는 `onError()`)에서 메인 스레드로 전환해 반환된 URL을 로드해 재생한 뒤, 임시 리스너를 제거하고 기존 리스너를 다시 등록합니다.

`prerollAdTagUrl`이 없으면 기존 리스너를 등록한 상태에서 반환된 URL을 바로 로드해 재생합니다. 스트림 로드를 미루면 프리롤 시작 전에 채널 영상이 보이거나 광고와 채널이 동시에 로딩되는 것을 막을 수 있습니다.

- **이벤트:** 임시 리스너는 `onPrepare()`, 프리롤이 시작될 때 `onPlay()`, 끝날 때 `onCompleted()`를 받습니다. 채널 프리롤에 대해서는 `onAdBreakPrepare()`, `onAdPlay()`, `onAdUserAction()`, `onAdBreakSkipped()`가 전달되지 않습니다.
- **광고 없음 또는 실패:** 프리롤 응답에 광고가 없거나, 요청이 실패하거나, 재생 중 프리롤이 실패하면 SDK는 `onError()`가 아니라 `onCompleted()`를 보내므로 채널은 평소처럼 시작됩니다. 만일에 대비해 임시 리스너의 `onError()`도 같은 방식으로 처리하세요.
- **PIP:** 기본값인 `FlowerSdk.setIgnoreAdBreakInPIPMode(true)`에서는 채널 프리롤도 VOD 광고와 마찬가지로 사용자가 앱을 떠나면 일시정지되고 돌아오면 재개됩니다. PIP 진입 여부와 관계없이 이를 `FlowerSdk.notifyUserLeftApp()`으로 알려야 합니다. [PIP 모드 지원](../../getting-started/pip-mode-support)을 참고하세요.
- **같은 채널에 다시 진입:** SDK는 마지막으로 진입한 채널(`channelId`)을 기억합니다. 같은 `channelId`로 `changeChannelUrl()`을 호출하면 `prerollAdTagUrl`을 전달하더라도 프리롤을 건너뛰고, 광고가 없는 프리롤과 같은 방식으로 `changeChannelUrl()`이 반환된 직후 `onCompleted()`를 보냅니다. 따라서 앱은 처음 시작할 때와 똑같이 채널을 시작하면 됩니다. 기억된 채널은 `stop()`으로는 지워지지 않으며, VOD 광고(`requestVodAd`)나 인라인 광고(`requestAd`)를 요청하면 지워집니다. 예를 들어 A → B → A로 전환하면 A의 프리롤이 다시 재생되고, A → VOD → A도 프리롤이 다시 재생됩니다. SDK가 화면과 관계없이 채널을 기억하므로, 그 사이에 VOD 광고나 인라인 광고 요청 없이 플레이어 화면을 나갔다가 같은 채널로 돌아와도 프리롤을 건너뜁니다.
- **`onError` 후 재시작:** 위의 "`onError` 복구"에서 설명한 것처럼 `prerollAdTagUrl`을 포함해 처음 시작할 때와 같은 매개변수로 `changeChannelUrl()`을 호출하고, 반환된 URL도 같은 방식으로 처리합니다. 마지막으로 진입한 채널이므로 시청자가 프리롤을 다시 보지 않습니다.
- **채널 전환:** `changeChannelUrl()`을 호출할 때마다 아직 재생 중인 프리롤을 포함해 이전 채널의 광고 세션이 정지되고, `prerollAdTagUrl`을 전달하면 새 채널의 프리롤을 요청합니다. 이렇게 정지되거나 `stop()`으로 정지된 프리롤은 `onCompleted()`를 보내지 않습니다. 다음 `changeChannelUrl()` 호출 전과 `stop()` 호출 전에, 아직 등록되어 있는 임시 리스너를 제거하고 기존 리스너를 다시 등록하세요. 그렇지 않으면 다음 프리롤이 끝날 때 임시 리스너가 이전 채널의 URL을 로드합니다.

## 실시간 채널 광고 요청 예시

아래 예시는 [프리롤 광고](#pre-roll-ads) 흐름을 따릅니다.

```kotlin
// 채널 프리롤 대기 중에 사용하는 임시 리스너 (대기 중이 아니면 null)
private var prerollListener: FlowerAdsManagerListener? = null

// 채널을 처음 시작할 때, 전환할 때, onError 후 재시작할 때 모두 사용합니다.
private fun playLinearTv() {
    // 채널 전환으로 정지된 프리롤은 onCompleted를 보내지 않으므로,
    // 남아 있는 임시 리스너를 제거하고 원래 리스너가 등록되어 있도록 합니다.
    prerollListener?.let { flowerAdView.adsManager.removeListener(it) }
    prerollListener = null
    flowerAdView.adsManager.addListener(adsManagerListener)

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
    // 재시작할 때도 전달합니다. SDK가 마지막으로 진입한 채널의 프리롤을 건너뛰고 onCompleted를 보냅니다.
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
    fun playStream() {
        player.setMediaItem(MediaItem.fromUri(changedChannelUrl))
        player.prepare()
        player.play()
    }

    if (prerollAdTagUrl == null) {
        // prerollAdTagUrl이 없으면 반환된 URL을 바로 설정하고 재생을 시작합니다.
        playStream()
    } else {
        // prerollAdTagUrl이 있으면 기존 리스너를 제거하고 임시 리스너를 등록합니다.
        // 프리롤 광고가 완료(onCompleted)된 시점에 스트림 URL을 설정하고 재생을 시작합니다.
        // 프리롤은 SDK가 직접 재생하므로 adsManager.play()를 호출하지 않습니다.
        flowerAdView.adsManager.removeListener(adsManagerListener)

        val listener = object : FlowerAdsManagerListener {
            override fun onPrepare(adDurationMs: Int) {}
            override fun onPlay() {}
            override fun onCompleted() {
                // 프리롤 광고가 없거나 프리롤이 실패한 경우에도 호출됩니다.
                finishPreroll()
            }
            override fun onError(error: FlowerError?) {
                // 프리롤 광고 에러 시에도 스트림 재생 시작 및 리스너 복원
                finishPreroll()
            }
            override fun onAdBreakSkipped(reason: Int) {}

            private fun finishPreroll() {
                val self = this
                // 리스너는 메인 스레드가 아닌 스레드에서 호출됩니다.
                CoroutineScope(Dispatchers.Main).launch {
                    // 대기 중인 프리롤에 대한 첫 호출에서만 스트림을 시작합니다.
                    if (prerollListener !== self) return@launch
                    prerollListener = null

                    // 프리롤 광고 완료 후 스트림 URL 설정 및 재생 시작
                    playStream()

                    // 임시 리스너를 제거하고 원래 리스너를 복원합니다.
                    flowerAdView.adsManager.removeListener(self)
                    flowerAdView.adsManager.addListener(adsManagerListener)
                }
            }
        }
        prerollListener = listener
        flowerAdView.adsManager.addListener(listener)
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

`prerollAdTagUrl`을 전달하는 경우 [프리롤 광고](#pre-roll-ads)에서 설명한 방식으로 채널을 시작하세요. SDK는 프리롤이 시작될 때 어댑터의 `pause()`를, 끝날 때 `resume()`을 호출하며, 이는 앱이 스트림을 로드하기 전입니다. 따라서 두 메서드는 아무것도 로드되지 않은 상태에서 호출되어도 안전해야 합니다.

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
| getPlayerType() | String? | 플레이어 구현을 식별하는 문자열을 반환합니다. SDK가 플레이어별 동작을 적용하고 광고 요청에 포함하는 데 사용합니다. |
| getPlayerVersion() | String? | 플레이어 버전 문자열을 반환합니다. SDK가 광고 요청에 포함합니다. |

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
