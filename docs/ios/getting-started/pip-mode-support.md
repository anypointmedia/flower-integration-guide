---
sidebar_position: 4
---

# PIP Mode Support

> This API is available in Flower iOS SDK version 2.2.0 and later.

Flower SDK restricts CTA (Call To Action) functionality in PIP (Picture-in-Picture) mode. To ensure correct behavior, the application must notify the SDK about state changes using the following API. For PIP mode handling specific to VOD, please refer to the [VOD PIP Mode Support](../ad-insertion/vod/pip-mode-support) page.

```swift
FlowerSdk.notifyPictureInPictureModeChanged(_ isInPictureInPictureMode: Bool)
```

Below is an iOS source code example:

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
