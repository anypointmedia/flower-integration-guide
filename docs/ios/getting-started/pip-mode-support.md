---
sidebar_position: 4
---

# PIP Mode Support

> This API is available in Flower iOS SDK version 2.2.0 and later.

Flower SDK can correctly handle Picture-in-Picture behavior when ads are displayed as overlay on top of existing content (for example, VOD midroll cases when Flower Player is not used). To ensure proper behavior during PiP mode transitions, the application should notify the SDK about Picture-in-Picture state changes using the following API:

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
