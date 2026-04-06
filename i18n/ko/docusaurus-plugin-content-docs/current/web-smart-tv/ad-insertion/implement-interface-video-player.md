---
sidebar_position: 5
sidebar_label: 비디오 플레이어 전달 인터페이스 구현
---

# 비디오 플레이어 전달 인터페이스 구현

실시간 채널 또는 VOD의 경우 본 컨텐츠를 재생하는 플레이어를 SDK에 전달해야 합니다.
현재 SDK가 지원하는 플레이어는 아래와 같습니다.

| **환경** | **지원 플레이어** |
| ---| --- |
| HTML5 | Bitmovin Player<br/>HLS.js<br/>Video.js |

SDK가 지원하는 플레이어를 사용하는 경우 SDK에서 제공하는 MediaPlayerHook 인터페이스를 구현하여 플레이어를 반환하면 됩니다.

## MediaPlayerHook 인터페이스 설명

| **함수명** | **설명** |
| ---| --- |
| getPlayer() | 본 컨텐츠를 재생하는 플레이어 객체를 반환합니다. |

## MediaPlayerHook 구현 예시

```javascript
const player = new bitmovin.Player(document.querySelector('video'))
const mediaPlayerHook = {
    getPlayer() {
        return player;
    },
}
```

지원되지 않는 플레이어를 사용하는 경우 [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의하세요.
