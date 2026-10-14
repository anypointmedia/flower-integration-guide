---
sidebar_position: 5
sidebar_label: "비디오 플레이어 전달 인터페이스 구현"
---

# 비디오 플레이어 전달 인터페이스 구현

실시간 채널 또는 VOD의 경우 본 콘텐츠를 재생하는 비디오 플레이어 정보를 SDK에 전달해야 합니다.
지원 플레이어:

| **환경** | **플레이어** |
| ---| --- |
| iOS | AVPlayer<br/>AVQueuePlayer<br/>VLCMediaListPlayer (MobileVLCKit@3) |

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

지원되지 않는 플레이어를 사용하는 경우 [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의하세요.

## MediaPlayerAdapter와 실시간 채널 프리롤

지원되지 않는 플레이어로 실시간 채널을 재생하는 경우, `MediaPlayerAdapter` 프로토콜을 구현하여 `mediaPlayerAdapter`를 받는 `changeChannelUrl(...)` 오버로드에 전달할 수 있습니다([MediaPlayerAdapter 사용](./linear-tv-fast/manual-player-control#mediaplayeradapter-사용) 참고). 이 오버로드도 `prerollAdTagUrl`을 받으며, 채널 프리롤은 `MediaPlayerHook`을 사용할 때와 같은 방식으로 동작합니다. 즉, 반환된 URL을 보관했다가 프리롤이 끝나면 로드합니다([프리롤 광고](./linear-tv-fast/manual-player-control#프리롤-광고) 참고). SDK는 프리롤이 준비되면 어댑터의 `pause()`를, 프리롤이 끝나면 `resume()`을 호출하므로, 두 메서드는 채널 URL을 로드하기 전에 호출되어도 안전해야 합니다.
