---
sidebar_position: 2
sidebar_label: "플레이어 수동 제어"
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
        // TODO GUIDE: on an ad error, stop the ads manager and restart the channel
        //             (see restartLinearTvAfterError() below).
        //             The SDK calls this off the main thread, so hop to main first.
        DispatchQueue.main.async {
            restartLinearTvAfterError()
        }
    }

    func onAdBreakSkipped(reason: Int32) {
        os_log(OSLogType.info, log: .default, "onAdBreakSkipped: %d", reason)
    }
}
flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
```

:::note `onError` 시 채널 재시작
`onError`가 호출되면 `adsManager.stop()`으로 광고 매니저를 중지하고, 콘텐츠 플레이어 아이템을 해제한 뒤, 처음 시작했을 때와 같은 방식으로 채널을 다시 시작합니다. 즉, `prerollAdTagUrl`을 포함해 처음 시작할 때와 똑같은 매개변수로 새로 `changeChannelUrl(...)`을 호출하고, 반환된 URL도 같은 방식으로 처리합니다(프리롤 URL을 전달했다면 `onCompleted`까지 보류). SDK는 마지막으로 진입한 채널의 프리롤을 건너뛰고 `changeChannelUrl()`이 반환된 직후 `onCompleted`를 호출하므로, 시청자는 프리롤을 다시 보지 않고 보류한 URL이 바로 재생됩니다. `changeChannelUrl()`이 반환한 URL은 SDK 스트림 프록시를 거치는데 `stop()`이 이 프록시를 종료하므로, 이전 URL을 재사용하지 마세요. SDK는 리스너를 메인 스레드가 아닌 곳에서 호출하므로, 플레이어를 다루기 전에 메인 스레드로 전환해야 합니다. `stop()`으로 중단된 광고 구간이 그 뒤에 `onCompleted`를 보낼 수 있으므로, `onCompleted`에는 여러 번 실행되어도 안전한 UI 작업만 두세요. [아래 예시](#실시간-채널-광고-요청-예시)의 `restartLinearTvAfterError()`를 참고하세요.

채널 스트림 재생이 중단되고 SDK가 3회 복구 시도 후 포기한 경우에도, 장애 1건당 한 번 `playback unrecoverable after 3 recovery attempts (<trigger>) - url: <url>` 메시지로 `onError`가 호출됩니다. 같은 방법으로 채널을 다시 시작하되, 가능하면 새로 발급받은 채널 URL을 사용하세요.
:::

### 3. 플레이어 전달 -- `MediaPlayerHook`

> 실시간 채널의 경우 본 콘텐츠를 재생하는 플레이어를 SDK에 전달해야 합니다.

#### 지원 플레이어

*   AVPlayer
*   AVQueuePlayer

위 플레이어들은 `MediaPlayerHook` 인터페이스를 구현하여 SDK에 현재 플레이어를 전달합니다.

#### 미지원 플레이어 사용 시

지원되지 않는 플레이어를 사용하는 경우 [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의해주세요.

### 4. 광고 요청 시 추가 파라미터 -- `extraParams`

> Flower SDK를 사용하여 광고를 요청할 때 추가 매개변수를 전달하면, SDK가 가장 적합한 광고를 제공하는 데 도움이 됩니다. 모바일 앱의 경우 SDK가 자체적으로 광고 제공 컨텍스트를 판단할 수 없으므로, 광고 요청 시 이러한 매개변수를 SDK에 반드시 전달해야 합니다.

#### 파라미터 목록

| 키<br/>(\* 표시는 모바일 앱 필수) | 값 | 예시 |
| ---| ---| --- |
| serviceId\* | 앱의 패키지 이름 | "tv.anypoint.service" |
| os\* | 앱이 실행되는 기기의 OS | "iOS" |
| adId\* | 앱이 실행되는 기기의 광고 식별자 | iOS: Apple의 IDFA 값 |

### 5. 실시간 채널 광고 API 호출 -- `changeChannelUrl(...)`

#### FlowerAdsManager.changeChannelUrl()

실시간 방송의 스트림 URL을 변경할 때 사용하는 함수입니다. 다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| videoUrl | String | 원본 재생 URL |
| adTagUrl | String | 광고 서버에서 발급된 광고 태그 URL |
| channelId | String | 고유 채널 ID<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | \[String: String\] | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _nil_) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | \[String: String\] | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | \[String: String\] | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |
| prerollAdTagUrl | String | (Optional) 프리롤용 광고 서버 발급 광고 태그 URL. [프리롤 광고](#프리롤-광고)를 참고하세요. |

#### FlowerAdsManager.changeChannelExtraParams()

추가 타겟팅 정보인 extraParams를 실시간 방송 도중에 변경할 때 사용하는 함수입니다. 다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| extraParams | \[String: String\] | 타겟팅을 위해 사전 협의된 추가 정보 |

#### FlowerAdsManager.stop()

실시간 방송을 중단할 때 사용하는 API입니다. 매개변수는 없습니다.

## 프리롤 광고

채널 프리롤은 시청자가 채널에 진입할 때 라이브 스트림보다 먼저 한 번 재생되는 광고입니다. 스트림에 표시된 광고 구간과 달리 별도의 광고 태그로 요청되며, SDK가 자체 광고 플레이어로 재생하여 플레이어 위의 `FlowerAdView`에 표시합니다.

### 프리롤 사용 설정

`changeChannelUrl(...)`의 `prerollAdTagUrl`에 프리롤 광고 태그 URL을 전달합니다. 프리롤 없이 채널을 시작하려면 `nil`을 전달합니다. `FlowerAVPlayer`를 사용하는 경우에는 대신 `FlowerLinearTvAdConfig.prerollAdTagUrl`을 설정하며, 아래 흐름 전체를 플레이어가 직접 처리합니다([확장 AVPlayer 사용](./using-extended-avplayer#프리롤-광고) 참고).

### 재생 흐름

`changeChannelUrl()`은 스트림 URL을 바로 반환하고, 백그라운드에서 프리롤을 요청합니다. `prerollAdTagUrl` 설정 여부에 따라 재생 시작 방식이 달라집니다.

- **`prerollAdTagUrl`을 설정하지 않은 경우:** 반환된 URL을 플레이어에 설정한 뒤 `player.play()`를 직접 호출하여 콘텐츠 재생을 시작합니다.
- **`prerollAdTagUrl`을 설정한 경우:** 스트림 재생을 보류합니다. 반환된 URL은 보관하되 아직 플레이어에 설정하지 않습니다.
  1. 기존 `FlowerAdsManagerListener`를 제거하고 임시 프리롤 리스너를 등록합니다.
  2. 프리롤이 준비되면 SDK가 프리롤을 재생하고, 등록된 리스너의 `onPrepare`와 `onPlay`를 호출합니다.
  3. 프리롤이 끝나면 SDK가 `onCompleted`를 호출합니다. 임시 리스너의 첫 번째 `onCompleted`(또는 `onError`)에서 메인 스레드로 전환한 뒤, 보관한 URL을 플레이어에 설정하고 재생을 시작합니다. 그다음 임시 리스너를 제거하고 원래 리스너를 다시 등록합니다.

스트림 재생을 보류하면 프리롤이 시작되기 전에 본 콘텐츠가 화면에 잠깐 보이는 것을 막고, 광고와 본 콘텐츠를 동시에 로딩하지 않아도 됩니다.

### 프리롤이 없거나 실패한 경우

응답에 프리롤 광고가 없거나, 광고 요청이 실패하거나, 프리롤을 재생할 수 없으면 SDK가 프리롤을 종료하고 `onCompleted`를 호출하므로 채널은 그대로 시작됩니다. 임시 리스너의 `onError`도 같은 방식으로 처리하세요. 즉, 보관한 URL을 로드하고 리스너를 원래대로 되돌립니다. 채널 스트림이 아직 시작되지 않았으므로 여기서 채널을 재시작하지 마세요.

### 채널 전환, 재시작, PIP

- **채널 전환:** 프리롤은 채널이 시작될 때마다 적용되며, 사용자가 다른 채널로 전환할 때도 마찬가지입니다. `changeChannelUrl(...)`을 호출할 때마다 SDK는 아직 재생 중인 프리롤을 포함해 이전 세션을 먼저 중지하고, 새 채널의 프리롤을 요청합니다. 이렇게 또는 `stop()`으로 중지된 프리롤은 임시 리스너를 호출하지 않으므로, 리스너가 등록된 채로 남아 다음 프리롤이 끝날 때 이전 채널의 URL을 로드할 수 있습니다. 다음 `changeChannelUrl(...)` 호출 전과 `stop()` 호출 전에, 대기 중인 임시 리스너를 제거하고 원래 리스너를 복원하세요(아래 예시의 `cancelPendingPreroll()`).
- **`onError` 후 재시작:** `prerollAdTagUrl`을 포함해 처음 시작할 때와 똑같은 매개변수로 `changeChannelUrl(...)`을 다시 호출하고, 반환된 URL도 같은 방식으로 처리합니다. SDK는 `changeChannelUrl(...)` 또는 `enterChannel(...)`로 마지막에 진입한 채널(`channelId`)을 기억합니다. 같은 `channelId`로 `changeChannelUrl(...)`이 호출되면 `prerollAdTagUrl`이 전달되어도 SDK는 프리롤을 건너뛰고, 광고가 없는 프리롤과 같은 방식으로 `changeChannelUrl()`이 반환된 직후 `onCompleted`를 호출합니다. 그러면 임시 리스너가 처음 시작할 때처럼 보류한 URL을 로드하며, 시청자는 프리롤을 다시 보지 않습니다. 아래 예시에서는 `restartLinearTvAfterError()`가 `playLinearTv()`를 그대로 다시 호출합니다.
- **프리롤을 건너뛰는 경우:** `stop()`은 기억한 채널을 지우지 않으며, `requestVodAd(...)`와 `requestAd(...)`가 지웁니다. 따라서 A → B → A는 A의 프리롤을 다시 재생하고, A → (`onError`) `stop()` → A는 프리롤을 건너뛰며, VOD 광고나 인라인 광고를 거쳐 A로 돌아오면 다시 재생합니다. 기억한 채널은 SDK 전체에서 공유되므로, 그 사이에 다른 채널이나 광고 요청 없이 플레이어 화면을 나갔다가 같은 채널로 돌아와도 프리롤을 건너뜁니다.
- **사용자가 앱을 떠난 경우:** 기본 모드(`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`)에서는 사용자가 앱을 떠날 때(`FlowerSdk.notifyUserLeftApp(true)`) 재생 중인 프리롤이 일시 정지되고, 사용자가 돌아오면 VOD 광고와 같은 방식으로 다시 재생됩니다. [PIP 모드 지원](../../getting-started/pip-mode-support)을 참고하세요.

## 실시간 채널 광고 요청 예시

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
    // 재시작할 때도 전달합니다. SDK는 마지막으로 진입한 채널의 프리롤을 건너뜁니다.
    let prerollAdTagUrl: String? = "https://ad_request?target=preroll"

    // 프리롤 도중 채널을 전환하는 경우: 이전 채널의 임시 리스너를 먼저 제거합니다.
    // changeChannelUrl()은 그 프리롤을 리스너 호출 없이 중지하므로, 제거하지 않으면 리스너가
    // 등록된 채로 남아 다음 프리롤이 끝날 때 이전 채널의 URL을 로드합니다.
    cancelPendingPreroll()

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
    if prerollAdTagUrl == nil {
        // prerollAdTagUrl이 없으면 반환된 URL을 바로 설정하고 재생을 시작합니다.
        player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: changedChannelUrl)!))
        player.play()
    } else {
        // prerollAdTagUrl이 있으면 기존 리스너를 제거하고 임시 리스너를 등록합니다.
        // 프리롤 광고가 완료(onCompleted)된 시점에 스트림 URL을 설정하고 재생을 시작합니다.
        flowerAdView.adsManager.removeListener(adsManagerListener: adsManagerListener)

        let listener = PrerollAdsManagerListener(
            onCompletedHandler: { [weak self] listener in
                guard let self = self, prerollListener === listener else { return }
                prerollListener = nil
                // 프리롤 광고 완료 후 스트림 URL 설정 및 재생 시작
                player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: changedChannelUrl)!))
                player.play()

                // 임시 리스너를 제거하고 원래 리스너를 복원합니다.
                flowerAdView.adsManager.removeListener(adsManagerListener: listener)
                flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
            },
            onErrorHandler: { [weak self] listener, _ in
                guard let self = self, prerollListener === listener else { return }
                prerollListener = nil
                // 프리롤 광고 에러 시에도 스트림 재생 시작 및 리스너 복원
                // 채널 스트림이 아직 시작되지 않았으므로 여기서는 stop()이 필요 없습니다.
                player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: changedChannelUrl)!))
                player.play()

                flowerAdView.adsManager.removeListener(adsManagerListener: listener)
                flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
            }
        )
        prerollListener = listener
        flowerAdView.adsManager.addListener(adsManagerListener: listener)
    }
}

// 프리롤이 아직 끝나지 않은 현재 채널의 임시 프리롤 리스너
private var prerollListener: PrerollAdsManagerListener?

// TODO GUIDE: 다음 changeChannelUrl() 호출 전과 adsManager.stop() 호출 전에 호출하세요.
private func cancelPendingPreroll() {
    guard let listener = prerollListener else { return }
    prerollListener = nil
    // 임시 리스너를 제거하고 원래 리스너를 복원합니다.
    flowerAdView.adsManager.removeListener(adsManagerListener: listener)
    flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
}

// TODO GUIDE: restart the channel after an ad error (called on the main thread from onError)
private var errorRestartCount = 0

private func restartLinearTvAfterError() {
    // 계속 실패하는 채널이 끝없이 재시작되지 않도록 하는 간단한 재시도 제한입니다.
    // 사용자가 채널을 바꾸면 errorRestartCount를 0으로 초기화하세요.
    guard errorRestartCount < 3 else { return }
    errorRestartCount += 1

    // 1. 먼저 광고 매니저를 중지합니다. 현재 스트림 URL이 가리키는
    //    SDK 스트림 프록시도 함께 종료됩니다.
    cancelPendingPreroll()
    flowerAdView.adsManager.stop()

    // 2. changeChannelUrl()이 반환한 URL을 재생하던 콘텐츠 아이템을 해제합니다.
    player.pause()
    player.replaceCurrentItem(with: nil)

    // 3. 처음 시작했을 때와 같은 방식으로 채널을 다시 시작합니다:
    //    prerollAdTagUrl을 포함해 같은 매개변수로 새 changeChannelUrl(...)을 호출합니다.
    //    SDK가 마지막으로 진입한 채널의 프리롤을 건너뛰고 onCompleted를 호출하므로,
    //    임시 리스너가 새 URL을 바로 로드합니다.
    playLinearTv()
}

// TODO GUIDE: change extraParams during stream playback
func onStreamProgramChanged(targetingInfo: String) {
    flowerAdView.adsManager.changeChannelExtraParams(extraParams: ["myTargetingKey": targetingInfo])
}

// 프리롤 광고 완료를 수신하기 위한 임시 리스너
// SDK는 메인 스레드가 아닌 곳에서 리스너를 호출하므로 메인 스레드로 전환하며,
// 첫 번째 onCompleted/onError에만 반응합니다.
class PrerollAdsManagerListener: FlowerAdsManagerListener {
    private let onCompletedHandler: (PrerollAdsManagerListener) -> Void
    private let onErrorHandler: (PrerollAdsManagerListener, FlowerError?) -> Void
    private var isFinished = false

    init(
        onCompletedHandler: @escaping (PrerollAdsManagerListener) -> Void,
        onErrorHandler: @escaping (PrerollAdsManagerListener, FlowerError?) -> Void
    ) {
        self.onCompletedHandler = onCompletedHandler
        self.onErrorHandler = onErrorHandler
    }

    func onPrepare(adDurationMs: Int32) {}
    func onPlay() {}
    func onCompleted() {
        DispatchQueue.main.async {
            guard !self.isFinished else { return }
            self.isFinished = true
            self.onCompletedHandler(self)
        }
    }
    func onError(error: FlowerError?) {
        DispatchQueue.main.async {
            guard !self.isFinished else { return }
            self.isFinished = true
            self.onErrorHandler(self, error)
        }
    }
    func onAdBreakSkipped(reason: Int32) {}
    func onAdBreakPrepare(adInfos: NSMutableArray) {}
    func onAdPlay(adInfo: AdInfo) {}
    func onAdUserAction(action: String, adInfo: AdInfo) {}
}
```

## MediaPlayerAdapter 사용

SDK에서 공식적으로 지원하지 않는 플레이어를 사용하는 경우, `MediaPlayerAdapter` 프로토콜을 구현하여 플레이어를 직접 제어할 수 있습니다.

`MediaPlayerHook` 대신 `MediaPlayerAdapter` 구현을 `changeChannelUrl()` 오버로드에 전달합니다.

### FlowerAdsManager.changeChannelUrl(...) with MediaPlayerAdapter

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| videoUrl | String | 원본 재생 URL |
| adTagUrl | String | 광고 서버에서 발급된 광고 태그 URL |
| channelId | String | 고유 채널 ID<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | \[String: String\] | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _nil_) |
| mediaPlayerAdapter | MediaPlayerAdapter | MediaPlayerAdapter 프로토콜 구현 객체 |
| adTagHeaders | \[String: String\] | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | \[String: String\] | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |
| prerollAdTagUrl | String | (Optional) 프리롤용 광고 서버 발급 광고 태그 URL |

:::note MediaPlayerAdapter와 프리롤
프리롤은 `MediaPlayerHook`을 사용할 때와 같은 방식으로 동작합니다. 반환된 URL을 보관했다가 프리롤이 끝나면 로드하세요([프리롤 광고](#프리롤-광고) 참고). SDK는 프리롤이 준비되면 어댑터의 `pause()`를, 프리롤이 끝나면 `resume()`을 호출하므로, 두 메서드는 채널 URL이 아직 로드되지 않은 상태에서 호출되어도 안전해야 합니다.
:::

### MediaPlayerAdapter 프로토콜

`MediaPlayerAdapter` 프로토콜은 다음 메소드가 필요합니다:

| **메소드** | **반환 유형** | **설명** |
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
