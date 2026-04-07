---
sidebar_position: 1
sidebar_label: "확장 AVPlayer 사용"
---

# 확장 AVPlayer 사용

Flower SDK는 AVPlayer를 사용하는 서비스를 대상으로 광고를 삽입할 수 있는 FlowerAVPlayer 래퍼 클래스를 제공합니다. 기존 AVPlayer와 호환성을 유지하며 최소한의 변경을 통해 광고를 적용할 수 있게 합니다.

래퍼 플레이어를 사용하면 수동으로 광고 삽입을 제어하는 것보다 편리하며, 정합 과정을 간소화합니다. 또한 이 플레이어를 서브클래싱하여 추가 커스터마이징이 가능합니다. 단, 메서드를 오버라이딩할 때는 올바른 동작을 보장하기 위해 **반드시 상위 클래스의 구현을 호출해야 합니다.**

## 작업 순서

![](/img/docs/7bac2173-923b-43de-95a8-bfefa6919b5e.png)
![](/img/docs/4fb986e7-d50d-416a-9c14-6bd7a1621c72.png)
1. 기존에 AVPlayer를 사용하던 코드에서 플레이어의 타입과 생성자를 AVPlayer에서 FlowerAVPlayer로 교체합니다.
2. 사전에 발급받은 Tag URL 등 적절한 값으로 광고 설정 객체를 생성합니다. 이 때 사용하는 클래스는 아래와 같습니다.
    1. 실시간 채널 / FAST의 경우: FlowerLinearTvAdConfig
3. 본 컨텐츠를 재생하기 전, `replaceCurrentItem(with:adConfig:)`를 사용하여 광고 설정 객체를 플레이어에 전달합니다.

    참고: 이 단계는 광고를 활성화하기 위해 필수입니다.

4. 필요한 경우 광고 이벤트 리스너를 플레이어에 등록합니다. 광고 이벤트 리스너는 "광고 이벤트 수신" 문서의 FlowerAdsManagerListener 인터페이스를 구현하여 생성할 수 있습니다.
5. 플레이어를 재생합니다.

아래는 예제 코드에서 사용된 Flower SDK의 API입니다.

## FlowerAVPlayer

기존 AVFoundation의 AVPlayer 클래스를 확장하여 Flower 백엔드 시스템과 연동을 통해 광고를 적용할 수 있는 플레이어 클래스입니다.

### FlowerAVPlayer.replaceCurrentItem(with:adConfig:)

현재 플레이어 아이템을 교체하고 광고 설정을 한 번의 호출로 설정합니다. 광고와 함께 재생을 시작하는 데 권장되는 방법입니다.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| item | AVPlayerItem? | 재생할 플레이어 아이템 |
| adConfig | FlowerAdConfig | 광고 설정 (FlowerLinearTvAdConfig 또는 FlowerVodAdConfig) |

### FlowerAVPlayer.addAdListener

플레이어에 광고 이벤트 리스너를 추가합니다. 이미 등록된 리스너일 경우 아무 일도 일어나지 않습니다.

다음은 매개변수에 대한 설명입니다.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| listener | FlowerAdsManagerListener | 추가할 광고 이벤트 리스너 |

### FlowerAVPlayer.removeAdListener

플레이어에서 광고 이벤트 리스너를 제거합니다. 등록되지 않은 리스너일 경우 아무 일도 일어나지 않습니다.

다음은 매개변수에 대한 설명입니다.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| listener | FlowerAdsManagerListener | 제거할 광고 이벤트 리스너 |

## FlowerLinearTvAdConfig

실시간 방송에 광고 삽입 시 필요한 정보를 지정할 때 사용되는 클래스입니다.

### FlowerLinearTvAdConfig.init

다음은 생성자 매개변수에 대한 설명입니다.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | String | Flower 백엔드 시스템에서 발급된 광고 태그 URL |
| prerollAdTagUrl | String? | (Optional) Flower 백엔드 시스템에서 발급된 프리롤용 광고 태그 URL |
| channelId | String | 채널의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | \[String: String\] | (Optional) 타겟팅을 위해 사전 협의된 추가 정보 |
| adTagHeaders | \[String: String\] | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | \[String: String\] | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |

## 광고 이벤트 수신 -- FlowerAdsManagerListener

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
// Register the listener with FlowerAVPlayer
player.addAdListener(listener: adsManagerListener)
```

## 실시간 채널 광고 요청 예시

### _SwiftUI_
```swift
struct PlaybackView: View {
    // TODO GUIDE: Replace your AVPlayer with FlowerAVPlayer
    private var player = FlowerAVPlayer()

    // OPTIONAL GUIDE: Create FlowerAdsManagerListener instance
    @State private var flowerListener: FlowerAdsManagerListener!

    var body: some View {
        FlowerVideoPlayer(player: player)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .onAppear {
                self.playLinearTv()
            }
            .onDisappear {
                player.removeAdListener(listener: flowerListener)
                player.pause()
                player.replaceCurrentItem(with: nil)
            }
    }

    private func playLinearTv() {
        let videoUrl = "https://video_url"

        // TODO GUIDE: Configure linear tv ad
        let adConfig = FlowerLinearTvAdConfig(
            adTagUrl: "https://ad_request",
            prerollAdTagUrl: "https://preroll_ad_request",
            channelId: "1",
            extraParams: [
                "title": "My Summer Vacation",
                "genre": "horror",
                "contentRating": "PG-13"
            ],
            adTagHeaders: [
                "custom-ad-header": "custom-ad-header-value"
            ],
            channelStreamHeaders: [
                "custom-stream-header": "custom-stream-header-value"
            ]
        )
        // TODO GUIDE: Pass ad config together with the player item
        player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: videoUrl)!), adConfig: adConfig)

        // OPTIONAL GUIDE: Implement FlowerAdsManagerListener to receive ad events
        class FlowerAdsManagerListenerImpl: FlowerAdsManagerListener {
            func onPrepare(adDurationMs: Int32) {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback is prepared
            }
            func onPlay() {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback starts
            }
            func onCompleted() {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback ends
            }
            func onError(error: FlowerError?) {
                // OPTIONAL GUIDE: Implement custom actions for when the error occurs in Flower SDK
            }
            func onAdSkipped(reason: Int32) {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback is skipped
            }
            func onAdBreakPrepare(adInfos: NSMutableArray) {
                // Not used in live streams. Required for VOD/Interstitial ad breaks only.
            }
        }
        // OPTIONAL GUIDE: Register FlowerAdsManagerListener to receive ad events
        flowerListener = FlowerAdsManagerListenerImpl()
        player.addAdListener(listener: flowerListener)

        player.play()
    }
}
```

### _UIKit_
```swift
class PlaybackViewController: UIViewController {
    // TODO GUIDE: Replace your AVPlayer with FlowerAVPlayer
    private var player = FlowerAVPlayer()

    // OPTIONAL GUIDE: Create FlowerAdsManagerListener instance
    private var flowerListener: FlowerAdsManagerListener!

    override func viewDidLoad() {
        super.viewDidLoad()

        let playerViewController = FlowerAVPlayerViewController()
        playerViewController.player = player
        view.addSubview(playerViewController.view)
        addChild(playerViewController)
        playerViewController.didMove(toParent: self)

        NSLayoutConstraint.activate([
            playerViewController.view.topAnchor.constraint(equalTo: view.topAnchor),
            playerViewController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            playerViewController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            playerViewController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        playLinearTv()
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        player.removeAdListener(listener: flowerListener)
        player.pause()
        player.replaceCurrentItem(with: nil)
    }

    private func playLinearTv() {
        let videoUrl = "https://video_url"

        // TODO GUIDE: Configure linear tv ad
        let adConfig = FlowerLinearTvAdConfig(
            adTagUrl: "https://ad_request",
            prerollAdTagUrl: "https://preroll_ad_request",
            channelId: "1",
            extraParams: [
                "title": "My Summer Vacation",
                "genre": "horror",
                "contentRating": "PG-13"
            ],
            adTagHeaders: [
                "custom-ad-header": "custom-ad-header-value"
            ],
            channelStreamHeaders: [
                "custom-stream-header": "custom-stream-header-value"
            ]
        )
        // TODO GUIDE: Pass ad config together with the player item
        player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: videoUrl)!), adConfig: adConfig)

        // OPTIONAL GUIDE: Implement FlowerAdsManagerListener to receive ad events
        class FlowerAdsManagerListenerImpl: FlowerAdsManagerListener {
            func onPrepare(adDurationMs: Int32) {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback is prepared
            }
            func onPlay() {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback starts
            }
            func onCompleted() {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback ends
            }
            func onError(error: FlowerError?) {
                // OPTIONAL GUIDE: Implement custom actions for when the error occurs in Flower SDK
            }
            func onAdSkipped(reason: Int32) {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback is skipped
            }
            func onAdBreakPrepare(adInfos: NSMutableArray) {
                // Not used in live streams. Required for VOD/Interstitial ad breaks only.
            }
        }
        // OPTIONAL GUIDE: Register FlowerAdsManagerListener to receive ad events
        flowerListener = FlowerAdsManagerListenerImpl()
        player.addAdListener(listener: flowerListener)

        player.play()
    }
}
```
