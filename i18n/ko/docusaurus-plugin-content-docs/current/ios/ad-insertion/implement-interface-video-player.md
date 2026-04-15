---
sidebar_position: 5
sidebar_label: "비디오 플레이어 전달 인터페이스 구현"
---

# 비디오 플레이어 전달 인터페이스 구현

실시간 채널 또는 VOD의 경우 본 콘텐츠를 재생하는 비디오 플레이어 정보를 SDK에 전달해야 합니다.
지원 플레이어:

| **환경** | **플레이어** |
| ---| --- |
| iOS | AVQueuePlayer<br/>VLCMediaListPlayer (MobileVLCKit@3) |

SDK가 지원하는 플레이어를 사용하는 경우 SDK에서 제공하는 MediaPlayerHook 인터페이스를 구현하여 플레이어를 반환하면 됩니다.

## MediaPlayerHook 인터페이스 설명

| **메소드** | **설명** |
| ---| --- |
| getPlayer() | 본 콘텐츠를 재생하는 플레이어 객체를 반환합니다. |

## MediaPlayerHook 구현 예시

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
    var player: AVQueuePlayer
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
    var player: AVQueuePlayer!

    override func viewDidLoad() {
        super.viewDidLoad()

        player = AVQueuePlayer()
    }

    func playLinearTv() {
        let mediaPlayerHook = MediaPlayerHookImpl {
            return self.player
        }
    }
}
```

지원되지 않는 플레이어를 사용하는 경우 [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의하세요.
