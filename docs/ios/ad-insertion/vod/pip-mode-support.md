---
sidebar_position: 2
---

# PIP Mode Support

To support PIP (Picture-in-Picture) mode, Flower SDK uses the player received through `MediaPlayerHook` to play ads.

The SDK provides the following two options related to PIP mode:

#### `FlowerSdk.notifyPictureInPictureModeChanged`

Notifies the SDK when PIP mode is entered or exited.

#### `FlowerSdk.setIgnoreAdBreakInPIPMode`

When set to `true`, Mid-roll or Post-roll Ad Breaks that occur in PIP mode are ignored. In other words, the policy is to not serve ads in PIP mode. When this value is `true`, the SDK uses a separate player for ad playback when not in PIP mode.

:::caution
You must notify PIP mode transitions using `notifyPictureInPictureModeChanged`.
:::

## Behavior by Ad Type

### Pre-roll Ads

When `setIgnoreAdBreakInPIPMode` is `true` and the app enters PIP mode during a pre-roll ad, the ad will be stopped. The SDK then delivers the `onCompleted` event, and the app should perform the appropriate action for its scenario at that point.

### Mid-roll and Post-roll Ads

When ads are used in PIP mode, the SDK saves the currently playing media item and playback position when the ad playback time arrives, and attempts to resume playback from that position after the ad ends.

However, if `setIgnoreAdBreakInPIPMode` is `true` and the app is in PIP mode, the ad break is ignored even when triggered. Additionally, any currently playing ad will also be terminated.

## Example

**_UIKit_**

```swift
class YourViewController: UIViewController {
    ...

    override func viewDidLoad() {
        super.viewDidLoad()

        // TODO GUIDE: Set to ignore ad breaks in PIP mode
        FlowerSdk.setIgnoreAdBreakInPIPMode(true)
    }

    ...
}

extension YourViewController: AVPictureInPictureControllerDelegate {
    func pictureInPictureControllerWillStartPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        // TODO GUIDE: Notify Flower SDK about Picture-in-Picture mode changes
        FlowerSdk.notifyPictureInPictureModeChanged(true)
    }

    func pictureInPictureControllerDidStopPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        // TODO GUIDE: Notify Flower SDK about Picture-in-Picture mode changes
        FlowerSdk.notifyPictureInPictureModeChanged(false)
    }
}
```
