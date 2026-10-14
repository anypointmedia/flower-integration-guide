---
sidebar_position: 4
---

# PIP 모드 지원

> 이 API는 Flower iOS SDK 버전 2.2.0 이상에서 사용할 수 있습니다.

Flower SDK는 사용자가 앱을 떠나 있는 동안, 즉 PIP(Picture-in-Picture) 모드이거나 홈 화면 또는 다른 앱으로 이동한 동안에는 CTA(Call To Action) 기능과 광고 재생을 제한합니다. 따라서 올바른 동작을 보장하기 위해서는 애플리케이션에서 다음 API를 사용하여 사용자가 앱을 떠날 때와 다시 돌아올 때를 알려야 합니다. VOD일 때 PIP 모드 처리에 따른 사용 여부는 [VOD PIP 모드 지원](../ad-insertion/vod/pip-mode-support) 페이지를 참고하세요.

```swift
FlowerSdk.notifyUserLeftApp(_ hasLeftApp: Bool)
```

*   `true`: 사용자가 앱을 떠났습니다. 홈 화면이나 다른 앱으로 이동했거나, 앱의 영상이 PIP 창으로 옮겨진 경우입니다.
*   `false`: 사용자가 앱으로 돌아왔습니다.

PIP 모드에서는 기본적으로 광고를 지원하지 않습니다(`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`). VOD 광고, 인라인 광고 또는 Linear 채널의 프리롤(`prerollAdTagUrl`)이 재생 중일 때 사용자가 앱을 떠나면 SDK는 광고를 일시정지하고, 사용자가 앱으로 돌아오면 광고를 재개합니다. Linear TV 스트림에 삽입되는 광고는 일시정지되지 않으며, 계속 재생되고 광고 UI만 숨겨집니다. SDK는 이를 스스로 감지하지 않으므로, 앱이 떠남과 돌아옴을 모두 알려주어야 이렇게 동작합니다.

또한 앱에서는 광고가 재생 중일 때 본편 플레이어를 PIP로 전환하지 않아야 합니다. 광고 재생 중 PIP 모드를 이용해 광고를 우회할 수 있기 때문입니다. 즉 광고 재생 중에는 PIP가 시작되지 않으므로, PIP delegate 콜백으로는 광고 재생 중 사용자가 앱을 떠난 것을 SDK에 알릴 수 없습니다. PIP 진입 여부와 관계없이, 사용자가 앱을 떠난 것은 앱 생명주기(앱이 백그라운드로 전환될 때)에서 알려주세요. 자세한 내용과 PIP 모드에서 광고를 지원하는 방법은 [VOD PIP 모드 지원](../ad-insertion/vod/pip-mode-support) 페이지를 참고하세요.

:::note
`FlowerSdk.notifyPictureInPictureModeChanged(_:)`는 deprecated 되었으며 `notifyUserLeftApp(_:)`로 대체되었습니다. 기존 호출도 계속 동작하며, 같은 값을 `notifyUserLeftApp`에 전달합니다.
:::

아래는 iOS 소스 코드 예시입니다:

**_UIKit_**

```swift
class YourViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        // TODO GUIDE: 사용자가 앱을 떠날 때와 돌아올 때 Flower SDK에 알림
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
```

앱에서 scene delegate를 사용한다면 대신 `sceneDidEnterBackground(_:)`에서 `FlowerSdk.notifyUserLeftApp(true)`를, `sceneWillEnterForeground(_:)`에서 `FlowerSdk.notifyUserLeftApp(false)`를 호출해도 됩니다. SwiftUI에서는 `@Environment(\.scenePhase)`를 관찰해 `.background`일 때 `notifyUserLeftApp(true)`를, `.active`일 때 `notifyUserLeftApp(false)`를 호출하세요.
