---
sidebar_position: 4
---

# PIP Mode Support

> This API is available in Flower iOS SDK version 2.2.0 and later.

Flower SDK restricts CTA (Call To Action) functionality in PIP (Picture-in-Picture) mode. To ensure correct behavior, the application must notify the SDK about state changes using the following API. For PIP mode handling specific to VOD, please refer to the [VOD PIP Mode Support](../ad-insertion/vod/pip-mode-support) page.

```swift
FlowerSdk.notifyPictureInPictureModeChanged(_ isInPictureInPictureMode: Bool)
```

Ads are not supported in PIP mode by default (`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`). When the app enters PIP while a VOD ad, an inline ad, or a linear channel pre-roll (`prerollAdTagUrl`) is playing, the SDK pauses the ad, and resumes it when the app returns from PIP. Ads inserted into a linear TV stream are not paused: they keep playing in PIP mode, and only the ad UI is hidden. This works only if the app notifies both entering and exiting PIP, because the SDK does not detect PIP mode by itself. In addition, while an ad is playing, the app must not switch the content player into PIP, because PIP mode could otherwise be used to bypass the ad. See [VOD PIP Mode Support](../ad-insertion/vod/pip-mode-support) for details and for supporting ads in PIP mode.

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
