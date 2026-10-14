---
sidebar_position: 4
---

# PIP Mode Support

> This API is available in Flower iOS SDK version 2.2.0 and later.

Flower SDK restricts CTA (Call To Action) functionality and ad playback while the user is away from the app: in PIP (Picture-in-Picture) mode, on the home screen, or in another app. To ensure correct behavior, the application must notify the SDK when the user leaves the app and when the user comes back, using the following API. For PIP mode handling specific to VOD, please refer to the [VOD PIP Mode Support](../ad-insertion/vod/pip-mode-support) page.

```swift
FlowerSdk.notifyUserLeftApp(_ hasLeftApp: Bool)
```

*   `true`: The user left the app: to the home screen, to another app, or the app's video moved to a PIP window.
*   `false`: The user came back to the app.

Ads are not supported in PIP mode by default (`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`). When the user leaves the app while a VOD ad, an inline ad, or a linear channel pre-roll (`prerollAdTagUrl`) is playing, the SDK pauses the ad, and resumes it when the user comes back. Ads inserted into a linear TV stream are not paused: they keep playing, and only the ad UI is hidden. This works only if the app notifies both leaving and returning, because the SDK does not detect it by itself.

While an ad is playing, the app must not switch the content player into PIP, because PIP mode could otherwise be used to bypass the ad. This means PIP does not start while an ad is playing, so a PIP delegate callback cannot tell the SDK that the user left during an ad. Report the user leaving from the app lifecycle (the app going to the background), whether or not the app enters PIP. See [VOD PIP Mode Support](../ad-insertion/vod/pip-mode-support) for details and for supporting ads in PIP mode.

:::note
`FlowerSdk.notifyPictureInPictureModeChanged(_:)` is deprecated and replaced by `notifyUserLeftApp(_:)`. Existing calls keep working: it passes the same value to `notifyUserLeftApp`.
:::

Below is an iOS source code example:

**_UIKit_**

```swift
class YourViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        // TODO GUIDE: Notify Flower SDK when the user leaves the app and comes back
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

If your app uses a scene delegate, you can call `FlowerSdk.notifyUserLeftApp(true)` in `sceneDidEnterBackground(_:)` and `FlowerSdk.notifyUserLeftApp(false)` in `sceneWillEnterForeground(_:)` instead. In SwiftUI, observe `@Environment(\.scenePhase)`: call `notifyUserLeftApp(true)` on `.background` and `notifyUserLeftApp(false)` on `.active`.
