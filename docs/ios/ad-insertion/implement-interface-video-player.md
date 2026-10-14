---
sidebar_position: 5
---

# Implement an Interface for Passing Video Player

For linear channels or VOD, you must pass information about the video player used for content playback to the SDK.
Supported players:

| **Environment** | **Player** |
| ---| --- |
| iOS | AVPlayer<br/>AVQueuePlayer<br/>VLCMediaListPlayer (MobileVLCKit@3) |

If the player that you are using is supported by the SDK, you can return the player by implementing the MediaPlayerHook interface that is provided by the SDK.

## MediaPlayerHook Interface Description

| **Function** | **Description** |
| ---| --- |
| getPlayer() | Returns the player object that plays the main content. |

## Examples of MediaPlayerHook Implementation

### _SwiftUI_
```swift
// TODO GUIDE: implement MediaPlayerHook
class MediaPlayerHookImpl: MediaPlayerHook {
    public var getPlayerFn: () -> Any
    public init(getPlayerFn: @escaping () -> Any) {
        self.getPlayerFn = getPlayerFn
    }
    public func getPlayer() -> Any? {
        getPlayerFn()
    }
}
struct PlaybackView: View {
    var player: AVPlayer
    func playLinearTv() {
        let mediaPlayerHook = MediaPlayerHookImpl {
            return player
        }
        ...
    }
}
```

### _UIKit_
```swift
// TODO GUIDE: implement MediaPlayerHook
class MediaPlayerHookImpl: MediaPlayerHook {
    public var getPlayerFn: () -> Any
    public init(getPlayerFn: @escaping () -> Any) {
        self.getPlayerFn = getPlayerFn
    }
    public func getPlayer() -> Any? {
        getPlayerFn()
    }
}

class PlaybackViewController: UIViewController {
    var player: AVPlayer!

    override func viewDidLoad() {
        super.viewDidLoad()

        player = AVPlayer()
    }

    func playLinearTv() {
        let mediaPlayerHook = MediaPlayerHookImpl {
            return self.player
        }
    }
}
```

If the SDK doesn't support your video player, Contact [Helpdesk](mailto:dev-support@anypointmedia.com).

## Linear Channel Pre-roll with MediaPlayerAdapter

For a linear channel played by an unsupported player, you can implement the `MediaPlayerAdapter` protocol and pass it to the `changeChannelUrl(...)` overload that takes `mediaPlayerAdapter` (see [Using MediaPlayerAdapter](./linear-tv-fast/manual-player-control#using-mediaplayeradapter)). This overload also takes `prerollAdTagUrl`, and the channel pre-roll then works the same way as with `MediaPlayerHook`: hold the returned URL and load it when the pre-roll ends (see [Pre-roll Ads](./linear-tv-fast/manual-player-control#pre-roll-ads)). The SDK calls the adapter's `pause()` when the pre-roll is ready and `resume()` when it ends, so both must be safe to call before the channel URL is loaded.
