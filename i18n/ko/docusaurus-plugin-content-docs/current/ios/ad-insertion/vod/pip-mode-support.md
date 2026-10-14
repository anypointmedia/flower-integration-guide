---
sidebar_position: 2
---

# PIP 모드 지원

PIP(Picture-in-Picture) 모드와 관련해 아래의 두 가지 옵션을 제공합니다:

#### `FlowerSdk.notifyUserLeftApp`

사용자가 앱을 떠나거나(`true`) 앱으로 돌아오면(`false`) 이를 SDK에 알려주는 역할입니다. 앱을 떠난 경우는 홈 화면이나 다른 앱으로 이동했거나, 앱의 영상이 PIP 창으로 옮겨진 경우입니다.

`FlowerSdk.notifyPictureInPictureModeChanged`는 deprecated 되었으며 `notifyUserLeftApp`으로 대체되었습니다. 기존 호출도 계속 동작합니다.

#### `FlowerSdk.setIgnoreAdBreakInPIPMode`

광고 재생 방식을 선택합니다. 기본값은 `true`입니다.

| **값** | **광고 플레이어** | **PIP 모드에서의 광고** |
| ---| ---| --- |
| `true` (기본값) | VOD 광고(프리롤, Mid-roll, Post-roll)와 인라인 광고를 SDK의 별도 광고 플레이어에서 재생하며, 본편 위에 표시합니다. | 지원하지 않습니다. 사용자가 앱을 떠날 때(`notifyUserLeftApp(true)`) 재생 중이던 광고는 일시정지되며, 사용자가 앱을 떠나 있는 동안에는 Mid-roll 또는 Post-roll Ad Break를 요청하지 않습니다. |
| `false` | 지원하는 플레이어의 경우, 플레이어의 현재 아이템을 광고 아이템으로 교체해(AVQueuePlayer는 큐에서 본편 앞에 광고 아이템을 넣어) 앱의 플레이어 안에서 광고를 재생합니다. | 지원합니다. PIP 모드에서도 광고가 계속 재생됩니다. |

`setIgnoreAdBreakInPIPMode`는 광고를 요청하기 전에 호출하세요. 광고 플레이어는 광고를 요청할 때 결정됩니다.

:::caution
`notifyUserLeftApp`로 사용자가 앱을 떠날 때와 돌아올 때를 모두 반드시 알려주어야 합니다. SDK는 이를 스스로 감지하지 않습니다. PIP 진입 여부와 관계없이 앱 생명주기에서 알려주세요.
:::

## PIP 모드에서의 광고 (기본값)

PIP 모드에서는 기본적으로 광고를 지원하지 않습니다. 따라서 앱에서는 사용자가 앱을 떠날 때와 돌아올 때 `notifyUserLeftApp`를 통해 반드시 알려주어야 합니다. 그래야 사용자가 앱을 떠나면 광고가 일시정지되고, 다시 앱으로 돌아오면 광고가 재개됩니다. 또한 앱에서는 광고가 재생 중일 때 사용자가 앱을 떠나더라도 본편 플레이어를 PIP로 전환하지 않아야 합니다. 광고 재생 중 PIP 모드를 이용해 광고를 우회할 수 있기 때문입니다.

광고 재생 중에는 본편 플레이어가 PIP로 전환되지 않으므로, 광고 재생 중 사용자가 앱을 떠나도 PIP 콜백(`AVPictureInPictureControllerDelegate` 등)은 호출되지 않습니다. 대신 앱 생명주기에서 알려주세요. 앱이 백그라운드로 전환되면 `notifyUserLeftApp(true)`를, 다시 포그라운드로 돌아오면 `notifyUserLeftApp(false)`를 호출합니다.

*   광고 재생 중 앱이 `notifyUserLeftApp(true)`를 호출하면 SDK는 광고를 일시정지하고 광고 UI를 숨깁니다.
*   앱이 `notifyUserLeftApp(false)`를 호출하면 광고는 멈췄던 위치부터 다시 재생되어 끝까지 재생됩니다.
*   사용자가 앱을 떠나 있는 동안에는 Mid-roll 및 Post-roll Ad Break를 요청하지 않습니다.
*   스트림에 삽입되는 Linear TV 광고는 이 옵션의 영향을 받지 않습니다. 사용자가 앱을 떠나 있는 동안에도 계속 재생되며 광고 UI만 숨겨집니다. 단, Linear 채널의 프리롤(`prerollAdTagUrl`)은 VOD 광고와 동일하게 일시정지 및 재개됩니다.

어떤 영상이 PIP로 전환되는지는 SDK가 아니라 앱이 결정합니다. iOS에서는 앱이 PIP 컨트롤러를 연결한 `AVPlayerLayer` 또는 `AVPlayerViewController`, 즉 본편 플레이어가 PIP로 전환됩니다. 광고 재생 중에는 본편 플레이어의 PIP를 시작하지 말고, 광고 구간이 끝날 때까지 자동 PIP 전환도 꺼 두세요.

**_UIKit_**

```swift
class YourViewController: UIViewController {
    var pipController: AVPictureInPictureController?
    var isAdPlaying = false
    ...

    override func viewDidLoad() {
        super.viewDidLoad()
        // TODO GUIDE: PIP 진입 여부와 관계없이,
        //             사용자가 앱을 떠날 때와 돌아올 때 Flower SDK에 알림
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
    }

    @objc private func onDidEnterBackground() {
        FlowerSdk.notifyUserLeftApp(true)
    }

    @objc private func onWillEnterForeground() {
        FlowerSdk.notifyUserLeftApp(false)
    }
}

extension YourViewController: FlowerAdsManagerListener {
    func onPlay() {
        DispatchQueue.main.async {
            self.isAdPlaying = true
            // TODO GUIDE: 광고 재생 중에는 본편 플레이어가 PIP로 전환되지 않도록 함
            self.pipController?.canStartPictureInPictureAutomaticallyFromInline = false
        }
    }

    func onCompleted() {
        DispatchQueue.main.async {
            self.isAdPlaying = false
            self.pipController?.canStartPictureInPictureAutomaticallyFromInline = true
        }
    }

    func onError(error: FlowerError?) {
        DispatchQueue.main.async {
            self.isAdPlaying = false
            self.pipController?.canStartPictureInPictureAutomaticallyFromInline = true
            // TODO GUIDE: VOD 가이드와 같이 본편도 처리합니다:
            //             pre-roll 오류 -> 본편 시작, mid-roll 오류 -> player.play(),
            //             post-roll 오류 -> 재개하지 않음.
        }
    }
    ...
}

extension YourViewController {
    // TODO GUIDE: 사용자가 앱의 PIP 버튼을 누르더라도 광고 재생 중에는 PIP를 시작하지 않음
    @objc func onPipButtonTapped() {
        guard !isAdPlaying else { return }
        pipController?.startPictureInPicture()
    }
}
```

:::note 본편을 `AVPlayerViewController`로 표시하는 경우
`canStartPictureInPictureAutomaticallyFromInline`(iOS 14.2 이상)은 자동 PIP 전환만 끄며, 앱의 PIP 버튼을 막더라도 `AVPlayerViewController`의 기본 PIP 버튼은 비활성화되지 않습니다. 본편을 `AVPlayerViewController`에서 재생한다면 광고 재생 중(`onPlay`)에는 `allowsPictureInPicturePlayback`도 `false`로 설정하고, `onCompleted`와 `onError`에서 다시 `true`로 설정하세요. 사용자가 앱을 떠나고 돌아오는 것은 `AVPlayerViewControllerDelegate`가 아니라 같은 방식으로 앱 생명주기에서 알려주세요.
:::

앱에서 scene delegate를 사용한다면 대신 `sceneDidEnterBackground(_:)`에서 `FlowerSdk.notifyUserLeftApp(true)`를, `sceneWillEnterForeground(_:)`에서 `FlowerSdk.notifyUserLeftApp(false)`를 호출해도 됩니다. SwiftUI에서는 `@Environment(\.scenePhase)`를 관찰해 `.background`일 때 `notifyUserLeftApp(true)`를, `.active`일 때 `notifyUserLeftApp(false)`를 호출하세요.

## PIP 모드에서 광고 지원하기

반대로 더 많은 광고 인벤토리를 위해 PIP 모드에서도 광고를 지원하려면(`setIgnoreAdBreakInPIPMode(false)`) 앱에서 이벤트 처리에 신경 써야 합니다.

```swift
// TODO GUIDE: PIP 모드에서도 광고가 재생되도록 앱의 플레이어에서 광고 재생
FlowerSdk.setIgnoreAdBreakInPIPMode(false)
```

이 모드에서 앱의 플레이어 안에서 광고를 재생하는 플레이어는 아래와 같습니다. 그 외의 플레이어(`MediaPlayerAdapter`로 전달하는 커스텀 플레이어 포함)는 항상 SDK의 별도 광고 플레이어를 사용합니다.

*   AVQueuePlayer (`FlowerAVPlayer` 포함)
*   AVPlayer

### 앱의 플레이어에서 광고가 재생되는 방식

1. Ad Break가 시작되면 SDK는 플레이어의 현재 아이템을 광고 아이템으로 교체하고(AVQueuePlayer는 큐에서 본편 앞에 광고 아이템을 넣고), 플레이어는 광고로 이동합니다.
2. Ad Break가 끝나면 SDK는 본편 URL로 만든 **새로운 `AVPlayerItem`**을 재개 지점, 즉 중단된 위치에서 `rewindDuration`(5초, `FlowerAVPlayer`를 사용할 때만 `FlowerVodAdConfig`로 변경 가능)만큼 앞선 위치에 다시 넣습니다.
3. 광고가 실패하면 SDK는 `onError`를 호출하기 전에 2단계와 같은 방식으로 본편을 되돌려 놓습니다. 기본 모드와 마찬가지로 `onError`에서 본편을 정지, 탐색(seek), 재로드하지 마세요. Mid-roll 오류 후에는 안전장치로 `player.play()`를 호출하세요. [`onError`가 호출될 때](./vod-ad-implementation#onerror가-호출될-때)를 참고하세요.

:::caution 아이템 단위 설정은 이어지지 않습니다
SDK가 다시 넣는 `AVPlayerItem`은 본편 URL만으로 생성됩니다. 앱이 자신의 아이템에 적용한 설정은 이어지지 않습니다. 예:

*   HTTP 헤더나 쿠키 등 `AVURLAsset` 옵션
*   FairPlay 키 로딩 등 `resourceLoader` delegate
*   `preferredForwardBufferDuration`, `preferredPeakBitRate` 등 버퍼 및 비트레이트 제한
*   선택한 오디오 및 자막 트랙
*   기존 아이템에 등록한 KVO 및 Notification 옵저버

앱이 이 중 하나라도 사용한다면 기본 모드(`setIgnoreAdBreakInPIPMode(true)`)를 사용하세요.
:::

### 플레이어 이벤트 처리

Ad Break 전후마다 현재 아이템이 바뀌므로, 아이템 변경이나 재생 완료를 감지하는 앱의 로직(재생 종료, 현재 아이템 변경, 특정 아이템에 등록한 status 또는 KVO 옵저버 등)은 현재 아이템이 무엇이든 반응하지 말고 본편 URL일 때만 반응해야 합니다. 앱이 생성한 `AVPlayerItem`이 계속 재생 중이라고 가정하지 마세요.

*   `.AVPlayerItemDidPlayToEndTime`은 `object: nil`로 등록하고, 종료된 아이템의 URL을 확인하세요. `object: playerItem`으로 등록한 옵저버는 첫 Ad Break 이후 해당 아이템이 더 이상 재생되지 않으므로 호출되지 않습니다.
*   Post-roll이 끝나면 본편이 끝 위치로 다시 들어와 다시 종료될 수 있습니다. `notifyContentEnded()`는 본편당 한 번만 호출하세요.

**_UIKit_**

```swift
class YourViewController: UIViewController {
    let contentURL = URL(string: "https://vod_content_url")!
    var isContentEnd = false
    ...

    func observeContentEnd() {
        // TODO GUIDE: 앱이 생성한 아이템뿐 아니라 모든 아이템의 종료를 관찰
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onItemDidPlayToEnd(_:)),
            name: .AVPlayerItemDidPlayToEndTime,
            object: nil
        )
    }

    @objc private func onItemDidPlayToEnd(_ notification: Notification) {
        // TODO GUIDE: 광고 아이템의 재생 종료는 본편 종료가 아님
        guard let item = notification.object as? AVPlayerItem,
              (item.asset as? AVURLAsset)?.url == contentURL else { return }

        // TODO GUIDE: 본편 종료는 한 번만 알림
        guard !isContentEnd else { return }
        isContentEnd = true
        flowerAdView.adsManager.notifyContentEnded()
    }
}
```

자신이 로드한 아이템에 옵저버를 연결하는 라이브러리도 마찬가지입니다. 플레이어 라이브러리의 재생 종료 콜백과 같은 옵저버는 이 모드에서 Ad Break 이후 호출되지 않습니다.
