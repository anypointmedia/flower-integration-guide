---
sidebar_position: 2
---

# PIP 모드 지원

PIP 모드를 지원하기 위해 Flower SDK는 `MediaPlayerHook`을 통해 전달받은 플레이어를 사용하여 광고를 재생합니다.

PIP 모드와 관련해 아래의 두 가지 옵션을 제공합니다:

#### `FlowerSdk.notifyPictureInPictureModeChanged`

PIP 모드가 되거나 해제되면 이를 SDK에 알려주는 역할입니다.

#### `FlowerSdk.setIgnoreAdBreakInPIPMode`

`true`로 설정하면 PIP 모드에서 Mid-roll 또는 Post-roll Ad Break가 발생하더라도 이를 무시합니다. 즉, PIP 모드에서는 광고를 내보내지 않는 정책이며, 이 값이 `true`인 경우 SDK에서는 PIP 모드가 아닌 경우에 광고 재생 시 별도 플레이어를 사용하게 됩니다.

:::caution
`notifyPictureInPictureModeChanged`로 PIP 전환 여부를 반드시 알려주어야 합니다.
:::

## 광고 유형별 동작

### Pre-roll 광고

`setIgnoreAdBreakInPIPMode`가 `true`이고 PIP 모드로 진입 시 광고를 중지하게 됩니다. 이후 `onCompleted` 이벤트를 전달하게 되고, 앱에서는 이 때 시나리오에 맞는 동작을 하면 됩니다.

### Mid-roll 및 Post-roll 광고

PIP 모드에서 광고를 사용한다면, SDK는 광고 재생 시점이 되었을 때 현재 재생 중인 미디어 아이템과 재생 시점을 저장해 놓고, 광고 종료 후 해당 위치로 다시 재생을 시도합니다.

하지만 `setIgnoreAdBreakInPIPMode`가 `true`이면서 PIP 모드라면 Ad Break가 발생하더라도 무시됩니다. 또한 재생 중이던 광고도 종료됩니다.

## 예시

**_UIKit_**

```swift
class YourViewController: UIViewController {
    ...

    override func viewDidLoad() {
        super.viewDidLoad()

        // TODO GUIDE: PIP 모드에서 Ad Break 무시 설정
        FlowerSdk.setIgnoreAdBreakInPIPMode(true)
    }

    ...
}

extension YourViewController: AVPictureInPictureControllerDelegate {
    func pictureInPictureControllerWillStartPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        // TODO GUIDE: PIP 모드 전환을 Flower SDK에 알림
        FlowerSdk.notifyPictureInPictureModeChanged(true)
    }

    func pictureInPictureControllerDidStopPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        // TODO GUIDE: PIP 모드 전환을 Flower SDK에 알림
        FlowerSdk.notifyPictureInPictureModeChanged(false)
    }
}
```
