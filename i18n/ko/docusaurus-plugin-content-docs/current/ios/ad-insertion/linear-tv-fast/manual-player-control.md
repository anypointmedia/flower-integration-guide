---
sidebar_position: 2
sidebar_label: "플레이어 수동 제어"
---

# 플레이어 수동 제어

본 가이드는 Flower SDK를 활용하여 실시간 TV 채널 및 FAST 스트림에 광고를 삽입하는 전체 과정을 안내합니다. 광고 연동은 다음 순서에 따라 진행됩니다.
1. **광고 UI 선언:** 광고 노출을 위한 `FlowerAdView`를 화면에 배치합니다.
2. **광고 이벤트 수신 구현:** 광고 재생 및 종료 시점의 로직 처리를 위해 `FlowerAdsManagerListener`를 구현합니다.
3. **플레이어 전달:** SDK가 콘텐츠 재생 상태를 인식할 수 있도록 `MediaPlayerHook`를 구현하여 플레이어 정보를 전달합니다.
4. **추가 파라미터 설정 (`extraParams`):** 광고 타겟팅에 필요한 추가 정보를 구성합니다.
5. **실시간 채널 URL 변경 (`changeChannelUrl`):** 광고 태그 URL, 채널 ID 등의 정보를 전달하여 스트림 URL을 변경합니다.
6. **재생 중 파라미터 업데이트:** 스트림 재생 중 `changeChannelExtraParams()`를 통해 타겟팅 정보를 업데이트합니다.

## 단계별 상세 설명

### 1. 광고 UI 선언

> 광고 UI 선언은 광고 삽입 메뉴 > 광고 UI 선언 섹션을 참고해주세요.

### 2. 광고 이벤트 수신 -- `FlowerAdsManagerListener`

> **실시간 채널에 광고를 삽입하는 경우**, 광고 마커(예: SCTE-35)를 통해 본 스트림을 대체하는 광고가 재생됩니다. 광고 재생 시작/종료 시점에 **UI 제어 등의 로직이 필요할 수 있습니다.** 이를 위해 Flower SDK는 **광고 이벤트를 수신하는 리스너 인터페이스**를 제공하며, 아래와 같이 구현할 수 있습니다.

```swift
class FlowerAdsManagerListenerImpl: FlowerAdsManagerListener {
    func onPrepare(adDurationMs: Int32) {
        // TODO GUIDE: need nothing for linear tv
    }

    func onPlay() {
        // OPTIONAL GUIDE: enable additional actions for ad playback
        hidePlayerControls()
    }

    func onCompleted() {
        // OPTIONAL GUIDE: disable additional actions after ad complete
        showPlayerControls()
    }

    func onError(error: FlowerError?) {
        // TODO GUIDE: restart to play Linear TV on ad error
        releasePlayer()
        playLinearTv()
    }

    func onAdSkipped(reason: Int32) {
        os_log(OSLogType.info, log: .default, "onAdSkipped: %d", reason)
    }
}
flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
```

### 3. 플레이어 전달 -- `MediaPlayerHook`

> 실시간 채널의 경우 본 콘텐츠를 재생하는 플레이어를 SDK에 전달해야 합니다.

#### 지원 플레이어

*   AVPlayer
*   AVQueuePlayer

위 플레이어들은 `MediaPlayerHook` 인터페이스를 구현하여 SDK에 현재 플레이어를 전달합니다.

#### 미지원 플레이어 사용 시

지원되지 않는 플레이어를 사용하는 경우 [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의해주세요.

### 4. 광고 요청 시 추가 파라미터 -- `extraParams`

> Flower SDK를 사용하여 광고를 요청하는 시점에 추가적인 매개변수를 전달하면, SDK에서 가장 적합한 광고를 제공하는데 도움이 됩니다. 모바일 웹 앱의 경우 SDK 스스로 광고 제공 컨텍스트를 판단할 수 없으므로, 광고 요청 시 이러한 매개변수를 SDK에 반드시 전달해주어야 합니다.

#### 파라미터 목록

| Key<br/>(\* 표시는 웹앱 필수) | Value | Example |
| ---| ---| --- |
| serviceId\* | 앱의 패키지 이름 | "tv.anypoint.service" |
| os\* | 앱이 실행되는 기기의 OS | "Android" |
| adId\* | 앱이 실행되는 기기의 광고 식별자 | Android: Google의 GAID 값 |

### 5. 실시간 채널 광고 API 호출 -- `changeChannelUrl(...)`

#### FlowerAdsManager.changeChannelUrl()

실시간 방송의 스트림 URL을 변경할 때 사용하는 함수입니다. 다음은 매개변수에 대한 설명입니다.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | String | 원본 재생 URL |
| adTagUrl | String | 광고 서버에서 발급된 광고 태그 URL |
| channelId | String | 채널의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | \[String: String\] | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _nil_) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | \[String: String\] | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | \[String: String\] | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |
| prerollAdTagUrl | String | (Optional) 광고 서버에서 발급된 프리롤용 광고 태그 URL |

#### FlowerAdsManager.changeChannelExtraParams()

추가 타겟팅 정보인 extraParams를 실시간 방송 도중에 변경할 때 사용하는 함수입니다. 다음은 매개변수에 대한 설명입니다.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| extraParams | \[String: String\] | 타겟팅을 위해 사전 협의된 추가 정보 |

#### FlowerAdsManager.stop()

실시간 방송을 중단할 때 사용하는 API입니다. 매개변수는 없습니다.

## 실시간 채널 광고 요청 예시

:::tip 프리롤 광고와 재생 시작
`changeChannelUrl()`을 호출하면 SDK가 광고 추적이 적용된 스트림 URL을 반환합니다. 반환된 URL을 플레이어에 설정한 뒤, `prerollAdTagUrl` 설정 여부에 따라 재생 시작 방식이 달라집니다.

- **`prerollAdTagUrl`을 설정하지 않은 경우:** `player.play()`를 직접 호출하여 콘텐츠 재생을 시작해야 합니다.
- **`prerollAdTagUrl`을 설정한 경우:** SDK가 프리롤 광고를 먼저 재생한 뒤 자동으로 콘텐츠 재생을 시작하므로, `player.play()`를 별도로 호출할 필요가 없습니다.
:::

```swift
private func playLinearTv() {
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
    // (Optional) Set to nil if pre-roll ads are not needed
    let prerollAdTagUrl: String? = "https://ad_request?target=preroll"

    let changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        videoUrl: "https://XXX",
        adTagUrl: "https://ad_request",
        channelId: "100",
        extraParams: ["custom-param": "custom-param-value"],
        mediaPlayerHook: mediaPlayerHook,
        adTagHeaders: ["custom-ad-header": "custom-ad-header-value"],
        channelStreamHeaders: ["custom-stream-header": "custom-stream-header-value"],
        prerollAdTagUrl: prerollAdTagUrl
    )
    player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: changedChannelUrl)!))

    // If prerollAdTagUrl is nil, call player.play() directly to start playback immediately.
    // If prerollAdTagUrl is set, the SDK plays the pre-roll ad first
    // and then automatically starts content playback, so player.play() is not needed.
    if prerollAdTagUrl == nil {
        player.play()
    }
}

// TODO GUIDE: change extraParams during stream playback
func onStreamProgramChanged(targetingInfo: String) {
    flowerAdView.adsManager.changeChannelExtraParams(extraParams: ["myTargetingKey": targetingInfo])
}
```

## MediaPlayerAdapter 사용

SDK에서 공식적으로 지원하지 않는 플레이어를 사용하는 경우, `MediaPlayerAdapter` 프로토콜을 구현하여 플레이어를 직접 제어할 수 있습니다.

`MediaPlayerHook` 대신 `MediaPlayerAdapter` 구현을 `changeChannelUrl()` 오버로드에 전달합니다.

### FlowerAdsManager.changeChannelUrl(...) with MediaPlayerAdapter

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | String | 원본 재생 URL |
| adTagUrl | String | 광고 서버에서 발급된 광고 태그 URL |
| channelId | String | 채널의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | \[String: String\] | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _nil_) |
| mediaPlayerAdapter | MediaPlayerAdapter | MediaPlayerAdapter 프로토콜 구현 객체 |
| adTagHeaders | \[String: String\] | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | \[String: String\] | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |
| prerollAdTagUrl | String | (Optional) 광고 서버에서 발급된 프리롤용 광고 태그 URL |

### MediaPlayerAdapter 프로토콜

`MediaPlayerAdapter` 프로토콜은 다음 메서드를 구현해야 합니다.

| **Method** | **Return Type** | **Description** |
| ---| ---| --- |
| getCurrentMedia() | Media | 현재 재생 중인 미디어(URL, 길이, 위치)를 반환합니다 |
| getVolume() | Float | 오디오 볼륨 레벨(0.0~1.0)을 반환합니다 |
| isPlaying() | Bool | 플레이어가 현재 재생 중인지 여부를 반환합니다 |
| getHeight() | Int32 | 비디오 높이(픽셀)를 반환합니다 (알 수 없는 경우 0) |
| pause() | Void | 재생을 일시정지합니다 |
| stop() | Void | 재생을 중지하고 리소스를 해제합니다 |
| resume() | Void | 재생을 재개합니다 |
| enqueuePlayItem(playItem:) | Void | 새 재생 항목을 큐에 추가합니다 |
| removePlayItem(playItem:) | Void | 큐에 있는 재생 항목을 제거합니다 |
| playNextItem() | Void | 큐의 다음 미디어 항목으로 이동합니다 |
| seekToPosition(...) | Void | 지정된 위치로 이동합니다 |
| getCurrentAbsoluteTime(isPrintDetails:) | Double | 현재 절대 재생 시간(ms)을 반환합니다 |

### 예시

```swift
class MyPlayerAdapter: MediaPlayerAdapter {
    private let player: MyCustomPlayer

    init(player: MyCustomPlayer) {
        self.player = player
    }

    func getCurrentMedia() throws -> Media {
        return Media(
            urlOrId: player.currentUrl ?? "",
            duration: Int32(player.duration * 1000),
            position: Int32(player.currentTime * 1000)
        )
    }

    func getVolume() throws -> Float {
        return player.volume
    }

    func isPlaying() throws -> Bool {
        return player.isPlaying
    }

    func getHeight() throws -> Int32 {
        return Int32(player.videoHeight)
    }

    func pause() throws {
        player.pause()
    }

    func stop() throws {
        player.stop()
    }

    func resume() throws {
        player.play()
    }

    func enqueuePlayItem(playItem: PlayItem) throws {
        player.enqueue(url: playItem.url)
    }

    func removePlayItem(playItem: PlayItem) throws {
        player.removeFromQueue(url: playItem.url)
    }

    func playNextItem() throws {
        player.skipToNext()
    }

    func seekToPosition(absoluteStartTimeMs: Double?, relativeStartTimeMs: Double?, offsetMs: Double?, windowDurationMs: Double?, periodIndex: Int32?) throws {
        if let offset = offsetMs {
            player.seek(to: offset / 1000.0)
        }
    }

    func getCurrentAbsoluteTime(isPrintDetails: Bool) throws -> Double {
        return player.currentTime * 1000.0
    }
}

// Usage
let adapter = MyPlayerAdapter(player: myCustomPlayer)
let changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
    videoUrl: "https://XXX",
    adTagUrl: "https://ad_request",
    channelId: "100",
    extraParams: nil,
    mediaPlayerAdapter: adapter,
    adTagHeaders: nil,
    channelStreamHeaders: nil,
    prerollAdTagUrl: nil
)
```
