---
sidebar_position: 2
---

# PIP Mode Support

The SDK provides the following two options related to PIP (Picture-in-Picture) mode:

#### `FlowerSdk.notifyUserLeftApp`

Notifies the SDK when the user leaves the app (`true`): to the home screen, to another app, or the app's video moved to a PIP window. Notifies the SDK when the user comes back to the app (`false`).

`FlowerSdk.notifyPictureInPictureModeChanged` is deprecated and replaced by `notifyUserLeftApp`. Existing calls keep working.

#### `FlowerSdk.setIgnoreAdBreakInPIPMode`

Selects how ads are played. The default is `true`.

| **Value** | **Ad player** | **Ads in PIP mode** |
| ---| ---| --- |
| `true` (default) | The SDK plays VOD ads (pre-roll, mid-roll, post-roll) and inline ads in its own ad player, shown over the content. | Not supported. An ad playing when the user leaves the app (`notifyUserLeftApp(true)`) is paused, and Mid-roll or Post-roll Ad Breaks are not requested while the user is away. |
| `false` | For supported players, the SDK plays the ads inside the app's own player: it replaces the player's current item with the ad items (with AVQueuePlayer, it queues them in front of the content). | Supported. Ads keep playing in PIP mode. |

Call `setIgnoreAdBreakInPIPMode` before requesting ads. The ad player is chosen when ads are requested.

:::caution
You must notify the SDK using `notifyUserLeftApp`, both when the user leaves the app and when the user comes back. The SDK does not detect it by itself. Report it from the app lifecycle, whether or not the app enters PIP.
:::

## Ads in PIP Mode (Default)

Ads are not supported in PIP mode by default. Therefore, the app must notify the SDK through `notifyUserLeftApp` when the user leaves the app and comes back. Only then is the ad paused when the user leaves the app, and resumed when the user returns to the app. In addition, while an ad is playing, the app must not switch the content player into PIP, even if the user leaves the app, because PIP mode could otherwise be used to bypass the ad.

Because the content player does not go into PIP while an ad is playing, PIP callbacks (such as `AVPictureInPictureControllerDelegate`) are not called when the user leaves during an ad. Report the user leaving from the app lifecycle instead: call `notifyUserLeftApp(true)` when the app goes to the background, and `notifyUserLeftApp(false)` when it comes back to the foreground.

*   When the app calls `notifyUserLeftApp(true)` while an ad is playing, the SDK pauses the ad and hides the ad UI.
*   When the app calls `notifyUserLeftApp(false)`, the ad resumes from where it stopped and plays to completion.
*   While the user is away from the app, Mid-roll and Post-roll Ad Breaks are not requested.
*   Linear TV ads inserted into the stream are not affected by this option. They keep playing while the user is away, and only the ad UI is hidden. A linear channel pre-roll (`prerollAdTagUrl`) is paused and resumed in the same way as VOD ads.

Which video goes into PIP is decided by the app, not by the SDK. On iOS, it is the `AVPlayerLayer` or `AVPlayerViewController` that the app attached its PIP controller to, which is the content player. While an ad is playing, do not start PIP of the content player, and turn off automatic PIP until the ad break ends.

**_UIKit_**

```swift
class YourViewController: UIViewController {
    var pipController: AVPictureInPictureController?
    var isAdPlaying = false
    ...

    override func viewDidLoad() {
        super.viewDidLoad()
        // TODO GUIDE: Notify Flower SDK when the user leaves the app and comes back,
        //             whether or not the app enters PIP
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
            // TODO GUIDE: Do not let the content player go into PIP while an ad is playing
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
            // TODO GUIDE: Also handle the content as in the VOD guide:
            //             pre-roll error -> start the content, mid-roll error -> player.play(),
            //             post-roll error -> no resume.
        }
    }
    ...
}

extension YourViewController {
    // TODO GUIDE: When the user taps your PIP button, do not start PIP while an ad is playing
    @objc func onPipButtonTapped() {
        guard !isAdPlaying else { return }
        pipController?.startPictureInPicture()
    }
}
```

:::note When the content is shown in `AVPlayerViewController`
`canStartPictureInPictureAutomaticallyFromInline` (iOS 14.2 and later) only turns off automatic PIP, and guarding your own PIP button does not disable the built-in PIP button of `AVPlayerViewController`. If the content plays in an `AVPlayerViewController`, also set its `allowsPictureInPicturePlayback` to `false` while an ad is playing (in `onPlay`), and set it back to `true` in `onCompleted` and `onError`. Report the user leaving and returning from the app lifecycle in the same way, not from `AVPlayerViewControllerDelegate`.
:::

If your app uses a scene delegate, you can call `FlowerSdk.notifyUserLeftApp(true)` in `sceneDidEnterBackground(_:)` and `FlowerSdk.notifyUserLeftApp(false)` in `sceneWillEnterForeground(_:)` instead. In SwiftUI, observe `@Environment(\.scenePhase)`: call `notifyUserLeftApp(true)` on `.background` and `notifyUserLeftApp(false)` on `.active`.

## Supporting Ads in PIP Mode

Conversely, to support ads in PIP mode as well for more ad inventory (`setIgnoreAdBreakInPIPMode(false)`), the app needs to pay attention to how it handles player events.

```swift
// TODO GUIDE: Play ads in the app's player so that they keep playing in PIP mode
FlowerSdk.setIgnoreAdBreakInPIPMode(false)
```

The following players play ads inside the app's player in this mode. Other players (including custom players provided through `MediaPlayerAdapter`) always use the SDK's own ad player.

*   AVQueuePlayer, including `FlowerAVPlayer`
*   AVPlayer

### How Ads Are Played in the App's Player

1. When an ad break starts, the SDK replaces the player's current item with the ad items (with AVQueuePlayer, it queues them in front of the content), and the player moves to the ads.
2. When the ad break ends, the SDK puts the content back as a **new `AVPlayerItem`** built from the content URL, at the resume point: the interrupted position minus `rewindDuration` (5 seconds; configurable through `FlowerVodAdConfig` only when using `FlowerAVPlayer`).
3. When an ad fails, the SDK puts the content back as in step 2 before it calls `onError`. As in the default mode, do not stop, seek, or reload the content in `onError`; after a mid-roll error, call `player.play()` as a safety net. See [When `onError` is called](./vod-ad-implementation#when-onerror-is-called).

:::caution Item-level settings are not carried over
The `AVPlayerItem` the SDK puts back is created from the content URL only. Settings the app applied to its own item are not carried over, for example:

*   `AVURLAsset` options, such as HTTP headers or cookies
*   `resourceLoader` delegates, such as FairPlay key loading
*   `preferredForwardBufferDuration`, `preferredPeakBitRate` and other bitrate limits
*   Selected audio and subtitle tracks
*   KVO and notification observers attached to the old item

If your app relies on any of these, use the default mode (`setIgnoreAdBreakInPIPMode(true)`).
:::

### Handling Player Events

Because the current item changes around every ad break, any app logic that detects item changes or completion (end of playback, current item changes, status or KVO observers on a specific item) must react only to the content URL, not to whichever item is current. Do not assume the `AVPlayerItem` the app created is still the one playing.

*   Observe `.AVPlayerItemDidPlayToEndTime` with `object: nil`, and check the URL of the item that ended. An observer registered with `object: playerItem` stops firing after the first ad break, because that item is no longer played.
*   After the post-roll, the content is put back at its end and may end again. Call `notifyContentEnded()` only once per content.

**_UIKit_**

```swift
class YourViewController: UIViewController {
    let contentURL = URL(string: "https://vod_content_url")!
    var isContentEnd = false
    ...

    func observeContentEnd() {
        // TODO GUIDE: Observe the end of every item, not only the item the app created
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onItemDidPlayToEnd(_:)),
            name: .AVPlayerItemDidPlayToEndTime,
            object: nil
        )
    }

    @objc private func onItemDidPlayToEnd(_ notification: Notification) {
        // TODO GUIDE: An ad item playing to its end is not the end of the content
        guard let item = notification.object as? AVPlayerItem,
              (item.asset as? AVURLAsset)?.url == contentURL else { return }

        // TODO GUIDE: Notify the content end only once
        guard !isContentEnd else { return }
        isContentEnd = true
        flowerAdView.adsManager.notifyContentEnded()
    }
}
```

The same applies to libraries that bind their observers to the item they loaded. Such observers, for example an end-of-playback callback of a player library, do not fire after an ad break in this mode.
