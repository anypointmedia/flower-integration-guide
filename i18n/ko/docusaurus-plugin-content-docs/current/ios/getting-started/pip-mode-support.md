---
sidebar_position: 4
---

# PIP 모드 지원

> 이 API는 Flower iOS SDK 버전 2.2.0 이상에서 사용할 수 있습니다.

Flower SDK는 PIP(Picture-in-Picture) 모드에서는 CTA(Call To Action) 기능을 제한합니다. 따라서 올바른 동작을 보장하기 위해서는 애플리케이션에서 다음 API를 사용하여 상태 변경을 알려야 합니다. VOD일 때 PIP 모드 처리에 따른 사용 여부는 [VOD PIP 모드 지원](../ad-insertion/vod/pip-mode-support) 페이지를 참고하세요.

```swift
FlowerSdk.notifyPictureInPictureModeChanged(_ isInPictureInPictureMode: Bool)
```

아래는 iOS 소스 코드 예시입니다:

**_UIKit_**

```swift
extension YourViewController: AVPictureInPictureControllerDelegate {
    func pictureInPictureControllerWillStartPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        FlowerSdk.notifyPictureInPictureModeChanged(true)
    }

    func pictureInPictureControllerDidStopPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        FlowerSdk.notifyPictureInPictureModeChanged(false)
    }
}
```
