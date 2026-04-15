---
sidebar_position: 1
sidebar_label: "VOD Pre-roll, Mid-roll, Post-roll 광고 적용"
---

# VOD Pre-roll, Mid-roll, Post-roll 광고 적용

본 가이드는 Flower SDK를 활용하여 VOD 콘텐츠에 광고를 삽입하는 전체 과정을 안내합니다. 광고 연동은 다음 순서에 따라 진행됩니다.
1. **광고 UI 선언:** 광고 노출을 위한 `FlowerAdView`를 화면에 배치합니다.
2. **광고 이벤트 수신 구현:** 광고 재생 및 종료 시점의 로직 처리를 위해 `FlowerAdsManagerListener`를 구현합니다.
3. **플레이어 전달:** SDK가 콘텐츠 재생 상태를 인식할 수 있도록 `MediaPlayerHook`를 구현하여 플레이어 정보를 전달합니다.
4. **추가 파라미터 설정 (`extraParams`):** 광고 타겟팅에 필요한 추가 정보를 구성합니다.
5. **VOD 광고 요청 (`requestVodAd`):** 광고 태그 URL, 콘텐츠 ID 등의 정보를 전달하여 VOD 광고를 요청합니다.
6. **재생 상태 제어**: 콘텐츠 재생 흐름에 맞추어 SDK의 `pause()`, `resume()`, `stop()` 메소드를 호출합니다.

## 단계별 상세 설명

### 1. 광고 UI 선언

> 광고 UI 선언은 광고 삽입 메뉴 > 광고 UI 선언 섹션을 참고해주세요.

### 2. 광고 이벤트 수신 -- `FlowerAdsManagerListener`

> VOD 콘텐츠의 광고 이벤트에 대응하여 재생을 제어하려면 `FlowerAdsManagerListener` 인터페이스를 구현합니다.
> 이를 통해 광고 재생 중 메인 콘텐츠를 일시정지하거나 재개하고, 재생 오류나 스킵 이벤트를 처리할 수 있습니다. 아래와 같이 구현할 수 있습니다.

#### _SwiftUI_
```swift
// TODO GUIDE: Implement FlowerAdsManagerListener
class FlowerAdsManagerListenerImpl: FlowerAdsManagerListener {
    var playbackView: PlaybackView

    init(_ playbackView: PlaybackView) {
        self.playbackView = playbackView
    }

    func onPrepare(adDurationMs: Int32) {
        DispatchQueue.main.async {
            if (self.playbackView.player.rate != 0.0) {
                Task {
                    // OPTIONAL GUIDE: additional actions before ad playback
                    self.playbackView.showNotification("Ads will start in a moment.")
                    try await Task.sleep(nanoseconds: 5_000_000_000)

                    // TODO GUIDE: play midroll ad
                    self.playbackView.flowerAdView.adsManager.play()
                }
            } else {
                // TODO GUIDE: play preroll ad
                self.playbackView.flowerAdView.adsManager.play()
            }
        }
    }

    func onPlay() {
        DispatchQueue.main.async {
            // TODO GUIDE: pause VOD content
            self.playbackView.player.pause()
        }
    }

    func onCompleted() {
        DispatchQueue.main.async {
            // TODO GUIDE: resume VOD content after ad complete
            if !self.playbackView.isContentEnd {
                self.playbackView.player.play()
            }
        }
    }

    func onError(error: FlowerError?) {
        DispatchQueue.main.async {
            // TODO GUIDE: resume VOD content on ad error
            if !self.playbackView.isContentEnd {
                self.playbackView.player.play()
            }
        }
    }

    func onAdSkipped(reason: Int32) {
        os_log(OSLogType.info, log: .default, "onAdSkipped: %d", reason)
    }
}

let adsManagerListener = FlowerAdsManagerListenerImpl(self)
flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
```

#### _UIKit_
```swift
// TODO GUIDE: Implement FlowerAdsManagerListener
extension PlayerViewController: FlowerAdsManagerListener {
    func onPrepare(adDurationMs: Int32) {
        DispatchQueue.main.async {
            if (self.player.rate != 0.0) {
                Task {
                    // OPTIONAL GUIDE: additional actions before ad playback
                    self.showNotification("Ads will start in a moment.")
                    try await Task.sleep(nanoseconds: 5_000_000_000)

                    // TODO GUIDE: play midroll ad
                    self.flowerAdView.adsManager.play()
                }
            } else {
                // TODO GUIDE: play preroll ad
                self.flowerAdView.adsManager.play()
            }
        }
    }

    func onPlay() {
        DispatchQueue.main.async {
            // TODO GUIDE: pause VOD content
            self.player.pause()
        }
    }

    func onCompleted() {
        DispatchQueue.main.async {
            // TODO GUIDE: resume VOD content after ad complete
            if !self.isContentEnd {
                self.player.play()
            }
        }
    }

    func onError(error: FlowerError?) {
        DispatchQueue.main.async {
            // TODO GUIDE: resume VOD content on ad error
            if !self.isContentEnd {
                self.player.play()
            }
        }
    }

    func onAdSkipped(reason: Int32) {
        os_log(OSLogType.info, log: .default, "onAdSkipped: %d", reason)
    }
}

flowerAdView.adsManager.addListener(adsManagerListener: self)
```

### 3. 플레이어 전달 -- `MediaPlayerHook`

> 재생 상태에 기반한 광고 추적을 활성화하려면, 현재 플레이어 인스턴스를 SDK에 제공해야 합니다.
> `MediaPlayerHook` 인터페이스를 구현하여 Flower SDK가 재생 상태 및 타이밍 정보에 접근할 수 있도록 합니다.

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

### 5. VOD 광고 API 호출 -- `requestVodAd(...)`

#### FlowerAdsManager.requestVodAd()

VOD 콘텐츠 진입 전 광고를 요청하는 데 사용하는 함수입니다.

다음은 매개변수에 대한 설명입니다.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | String | 광고 서버에서 발급된 광고 태그 URL |
| contentId | String | 콘텐츠의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| durationMs | Int64 | VOD 콘텐츠의 전체 재생 시간(ms) |
| extraParams | \[String: String\] | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _nil_) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | \[String: String\] | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |


#### FlowerAdsManager.notifyContentEnded()

VOD 콘텐츠 재생이 완료되었을 때(예: `AVPlayerItemDidPlayToEndTime`) 이 API를 호출합니다. 이를 통해 포스트롤 광고 로딩이 트리거됩니다. 매개변수는 없습니다.

```swift
// Register observer (target-action pattern)
NotificationCenter.default.addObserver(self, selector: #selector(onEnded), name: .AVPlayerItemDidPlayToEndTime, object: playerItem)

// Handler
@objc private func onEnded() {
    isContentEnd = true
    flowerAdView.adsManager.notifyContentEnded()
}
```
####  FlowerAdsManager.stop()

VOD 콘텐츠를 나갈 때 이 API를 호출합니다. 매개변수는 없습니다.

#### FlowerAdsManager.pause()

VOD 콘텐츠를 일시정지할 때 이 API를 호출합니다. 매개변수는 없습니다.

#### FlowerAdsManager.resume()

VOD 콘텐츠를 재개할 때 이 API를 호출합니다. 매개변수는 없습니다.

## VOD 광고 요청 예시

```swift
// TODO GUIDE: request vod ad
// arg0: adTagUrl, url from flower system.
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: contentId, unique content id in your service
// arg2: durationMs, duration of vod content in milliseconds
// arg3: extraParams, values you can provide for targeting
// arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
// arg5: adTagHeaders, (Optional) values included in headers for ad request
flowerAdView.adsManager.requestVodAd(
    adTagUrl: "https://ad_request",
    contentId: "100",
    durationMs: 3600000,
    extraParams: nil,
    mediaPlayerHook: mediaPlayerHook,
    adTagHeaders: ["custom-ad-header": "custom-ad-header-value"]
)
```
