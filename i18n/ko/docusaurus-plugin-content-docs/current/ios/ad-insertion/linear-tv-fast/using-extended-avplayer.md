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
2. 사전에 발급받은 Tag URL 등 적절한 값으로 광고 설정 객체를 생성합니다. 이 때 사용하는 클래스는 아래와 같습니다:
    1. 실시간 채널 / FAST의 경우: FlowerLinearTvAdConfig
    2. VOD의 경우: FlowerVodAdConfig
3. 본 콘텐츠를 재생하기 전, `replaceCurrentItem(with:adConfig:)`를 사용하여 광고 설정 객체를 플레이어에 전달합니다.

    참고: 이 단계는 광고를 활성화하기 위해 필수입니다.

4. 필요한 경우 광고 이벤트 리스너를 플레이어에 등록합니다. 광고 이벤트 리스너는 "광고 이벤트 수신" 문서의 FlowerAdsManagerListener 인터페이스를 구현하여 생성할 수 있습니다.
5. 플레이어를 재생합니다.

아래는 예제 코드에서 사용된 Flower SDK의 API입니다.

## FlowerAVPlayer

기존 AVFoundation의 AVPlayer 클래스를 확장하여 Flower 백엔드 시스템과 연동을 통해 광고를 적용할 수 있는 플레이어 클래스입니다.

### FlowerAVPlayer.replaceCurrentItem(with:adConfig:)

현재 플레이어 아이템을 교체하고 광고 설정을 한 번의 호출로 설정합니다. 광고와 함께 재생을 시작하는 데 권장되는 방법입니다.

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| item | AVPlayerItem? | 재생할 플레이어 아이템 |
| adConfig | FlowerAdConfig | 광고 설정 (FlowerLinearTvAdConfig 또는 FlowerVodAdConfig) |

### FlowerAVPlayer.addAdListener

플레이어에 광고 이벤트 리스너를 추가합니다. 이미 등록된 리스너일 경우 아무 일도 일어나지 않습니다.

다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| listener | FlowerAdsManagerListener | 추가할 광고 이벤트 리스너 |

### FlowerAVPlayer.removeAdListener

플레이어에서 광고 이벤트 리스너를 제거합니다. 등록되지 않은 리스너일 경우 아무 일도 일어나지 않습니다.

다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| listener | FlowerAdsManagerListener | 제거할 광고 이벤트 리스너 |

## FlowerLinearTvAdConfig

실시간 방송에 광고 삽입 시 필요한 정보를 지정할 때 사용되는 클래스입니다.

### FlowerLinearTvAdConfig.init

다음은 생성자 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | String | Flower 백엔드 시스템에서 발급된 광고 태그 URL |
| prerollAdTagUrl | String? | (Optional) Flower 백엔드 시스템에서 발급된 프리롤용 광고 태그 URL |
| channelId | String | 채널의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | \[String: String\] | (Optional) 타겟팅을 위해 사전 협의된 추가 정보 |
| adTagHeaders | \[String: String\] | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | \[String: String\] | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |

## 프리롤 광고

채널 프리롤은 시청자가 채널에 진입할 때 라이브 스트림보다 먼저 한 번 재생되는 광고입니다. 사용하려면 `FlowerLinearTvAdConfig`의 `prerollAdTagUrl`을 설정합니다. 프리롤 흐름은 `FlowerAVPlayer`가 직접 처리하므로 앱에서 임시 리스너를 둘 필요가 없습니다.

1. `replaceCurrentItem(with:adConfig:)`가 프리롤을 요청하고 채널 아이템 로드를 보류합니다.
2. `play()`를 호출하면 프리롤이 SDK의 광고 플레이어에서 재생되어 콘텐츠 위에 표시됩니다. `addAdListener`로 추가한 리스너는 프리롤의 `onPrepare`, `onPlay`, `onCompleted`를 받습니다.
3. 프리롤이 끝나면 플레이어가 채널을 로드하고 재생을 시작합니다.

- **프리롤 광고가 없거나 요청이 실패한 경우:** SDK가 `onCompleted`를 호출하고 채널이 평소대로 시작됩니다.
- **프리롤 재생 오류:** `onError`로 전달되며, `FlowerAVPlayer`는 채널을 로드하지 않습니다. 새 `FlowerAVPlayer` 인스턴스에서 채널을 다시 시작하세요(아래 "`onError` 시 채널 재시작" 참고).
- **채널 전환:** 다음 채널의 설정으로 `replaceCurrentItem(with:adConfig:)`를 호출하면 이전 세션이 중지되고 새 채널의 프리롤이 요청됩니다.
- **`onError` 후 재시작:** 재시작할 때는 채널 프리롤을 넣지 않습니다(`prerollAdTagUrl` 생략). 시청자가 이미 프리롤을 봤기 때문입니다.
- **PIP 모드:** 기본 모드(`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`)에서는 앱이 PIP에 진입할 때 재생 중인 프리롤이 일시 정지되고, 앱이 돌아오면 VOD 광고와 같은 방식으로 다시 재생됩니다.

## FlowerVodAdConfig

`FlowerAVPlayer`로 재생하는 VOD 콘텐츠에 광고 삽입 시 필요한 정보를 지정할 때 사용되는 클래스입니다. VOD 광고의 동작은 [VOD 프리롤, Mid-roll, Post-roll 광고 구현](../vod/vod-ad-implementation) 페이지를 참고하세요.

### FlowerVodAdConfig.init

다음은 생성자 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | String | Flower 백엔드 시스템에서 발급된 광고 태그 URL |
| contentId | String | 콘텐츠의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| contentDuration | Int64 | VOD 콘텐츠의 총 재생 시간(ms) |
| extraParams | \[String: String\] | (Optional) 타겟팅을 위해 사전 협의된 추가 정보 |
| adTagHeaders | \[String: String\] | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| requestTimeout | Int64? | (Optional) VOD 광고 요청과 각 Mid-roll 광고 요청의 타임아웃(ms). 기본값: 5000 |
| minPrepareDuration | Int64? | (Optional) Mid-roll을 위한 추가 준비 시간(ms). Mid-roll은 해당 위치보다 `requestTimeout + minPrepareDuration`만큼 먼저 요청됨. 기본값: 5000 |
| rewindDuration | Int64? | (Optional) Mid-roll 이후 본편이 중단된 위치보다 얼마나 앞에서 재개될지(ms). 기본값: 5000 |

:::note
`requestTimeout`, `minPrepareDuration`, `rewindDuration`은 `FlowerVodAdConfig`를 통해서만 설정할 수 있습니다. `FlowerAdsManager.requestVodAd(...)`에는 이 매개변수가 없으므로, 이를 직접 호출하는 경우(예: `MediaPlayerHook` 사용 시) SDK는 항상 기본값을 사용합니다.
:::

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
        // TODO GUIDE: on an ad error, stop the ads manager and restart the channel
        //             (see restartLinearTvAfterError() in the examples below).
        //             The SDK calls this off the main thread, so hop to main first.
        DispatchQueue.main.async {
            restartLinearTvAfterError()
        }
    }

    func onAdBreakSkipped(reason: Int32) {
        os_log(OSLogType.info, log: .default, "onAdBreakSkipped: %d", reason)
    }
}
// Register the listener with FlowerAVPlayer
player.addAdListener(listener: adsManagerListener)
```

:::note `onError` 시 채널 재시작
실시간 채널에서 `onError`가 호출되면 `player.flowerAdView.adsManager.stop()`으로 광고 매니저를 중지하고, `player.replaceCurrentItem(with: nil)`로 현재 아이템을 해제한 뒤, 처음 시작했을 때와 같은 방식으로 채널을 다시 시작합니다. 즉, 원본 스트림 URL로 만든 새 `AVPlayerItem`과 `FlowerLinearTvAdConfig`를 `replaceCurrentItem(with:adConfig:)`에 전달하고 `play()`를 호출합니다. `replaceCurrentItem(with: nil)`은 `FlowerAVPlayer`가 가진 광고 설정도 지우므로, 광고 설정을 항상 다시 전달해야 합니다. 재시작할 때는 채널 프리롤을 넣지 않습니다(`prerollAdTagUrl` 생략). 시청자가 이미 프리롤을 봤기 때문입니다. 재시작용 `FlowerLinearTvAdConfig`는 처음 시작할 때와 같은 값으로 만들되 `prerollAdTagUrl`은 빼세요. 그러면 `FlowerAVPlayer`가 채널을 바로 로드하여 재생합니다. 이 작업은 메인 스레드에서 수행하세요.

프리롤(`prerollAdTagUrl`) 재생 오류도 `onError`로 전달됩니다. 이 경우 `FlowerAVPlayer`는 채널을 로드하지 않으며, 내부 프리롤 리스너가 해당 플레이어에 등록된 채로 남습니다. 채널 아이템이 로드되기 전(`player.currentItem == nil`)에 `onError`가 오면, 같은 인스턴스 대신 새 `FlowerAVPlayer` 인스턴스로 채널을 다시 시작하세요.
:::

## 실시간 채널 광고 요청 예시

### _SwiftUI_
```swift
struct PlaybackView: View {
    // TODO GUIDE: Replace your AVPlayer with FlowerAVPlayer
    private var player = FlowerAVPlayer()

    // OPTIONAL GUIDE: Create FlowerAdsManagerListener instance
    @State private var flowerListener: FlowerAdsManagerListener!

    // Number of restarts after an ad error (simple retry limit)
    @State private var errorRestartCount = 0

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

    // withPreroll: true when a channel starts, false when it is restarted after onError.
    private func playLinearTv(withPreroll: Bool = true) {
        let videoUrl = "https://video_url"

        // TODO GUIDE: Configure linear tv ad
        let adConfig = FlowerLinearTvAdConfig(
            adTagUrl: "https://ad_request",
            prerollAdTagUrl: withPreroll ? "https://preroll_ad_request" : nil,
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
            private let onAdError: () -> Void

            init(onAdError: @escaping () -> Void) {
                self.onAdError = onAdError
            }

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
                // TODO GUIDE: on an ad error, stop the ads manager and restart the channel.
                //             The SDK calls this off the main thread, so hop to main first.
                DispatchQueue.main.async { self.onAdError() }
            }
            func onAdBreakSkipped(reason: Int32) {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback is skipped
            }
            func onAdBreakPrepare(adInfos: NSMutableArray) {
                // Not used in live streams. Required for VOD/Interstitial ad breaks only.
            }
        }
        // OPTIONAL GUIDE: Register FlowerAdsManagerListener to receive ad events
        flowerListener = FlowerAdsManagerListenerImpl(onAdError: { restartLinearTvAfterError() })
        player.addAdListener(listener: flowerListener)

        player.play()
    }

    // TODO GUIDE: restart the channel after an ad error (called on the main thread)
    private func restartLinearTvAfterError() {
        // Simple retry limit so that a channel that keeps failing is not restarted forever.
        guard errorRestartCount < 3 else { return }
        errorRestartCount += 1

        // 1. Stop the ads manager first.
        player.flowerAdView.adsManager.stop()

        // 2. Release the current item. This also clears the ad config held by FlowerAVPlayer.
        player.removeAdListener(listener: flowerListener)
        player.pause()
        player.replaceCurrentItem(with: nil)

        // 3. Start the channel again the same way it was first started:
        //    replaceCurrentItem(with:adConfig:) with a new AVPlayerItem -> play().
        //    A restart leaves the channel pre-roll out (prerollAdTagUrl omitted): the viewer
        //    has already seen it.
        //    NOTE: if onError came during the pre-roll (player.currentItem was nil),
        //          restart in a new FlowerAVPlayer instead (see the note above).
        playLinearTv(withPreroll: false)
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

    // withPreroll: true when a channel starts, false when it is restarted after onError.
    private func playLinearTv(withPreroll: Bool = true) {
        let videoUrl = "https://video_url"

        // TODO GUIDE: Configure linear tv ad
        let adConfig = FlowerLinearTvAdConfig(
            adTagUrl: "https://ad_request",
            prerollAdTagUrl: withPreroll ? "https://preroll_ad_request" : nil,
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
            private let onAdError: () -> Void

            init(onAdError: @escaping () -> Void) {
                self.onAdError = onAdError
            }

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
                // TODO GUIDE: on an ad error, stop the ads manager and restart the channel.
                //             The SDK calls this off the main thread, so hop to main first.
                DispatchQueue.main.async { self.onAdError() }
            }
            func onAdBreakSkipped(reason: Int32) {
                // OPTIONAL GUIDE: Implement custom actions for when the ad playback is skipped
            }
            func onAdBreakPrepare(adInfos: NSMutableArray) {
                // Not used in live streams. Required for VOD/Interstitial ad breaks only.
            }
        }
        // OPTIONAL GUIDE: Register FlowerAdsManagerListener to receive ad events
        flowerListener = FlowerAdsManagerListenerImpl(onAdError: { [weak self] in
            self?.restartLinearTvAfterError()
        })
        player.addAdListener(listener: flowerListener)

        player.play()
    }

    // Number of restarts after an ad error (simple retry limit)
    private var errorRestartCount = 0

    // TODO GUIDE: restart the channel after an ad error (called on the main thread)
    private func restartLinearTvAfterError() {
        // Simple retry limit so that a channel that keeps failing is not restarted forever.
        guard errorRestartCount < 3 else { return }
        errorRestartCount += 1

        // 1. Stop the ads manager first.
        player.flowerAdView.adsManager.stop()

        // 2. Release the current item. This also clears the ad config held by FlowerAVPlayer.
        player.removeAdListener(listener: flowerListener)
        player.pause()
        player.replaceCurrentItem(with: nil)

        // 3. Start the channel again the same way it was first started:
        //    replaceCurrentItem(with:adConfig:) with a new AVPlayerItem -> play().
        //    A restart leaves the channel pre-roll out (prerollAdTagUrl omitted): the viewer
        //    has already seen it.
        //    NOTE: if onError came during the pre-roll (player.currentItem was nil),
        //          restart in a new FlowerAVPlayer instead (see the note above).
        playLinearTv(withPreroll: false)
    }
}
```
