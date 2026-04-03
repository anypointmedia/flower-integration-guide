---
sidebar_position: 1
---

# 비디오 플레이어 전달 인터페이스 구현

실시간 채널 또는 VOD의 경우, 본 콘텐츠를 재생하는 비디오 플레이어에 대한 정보를 SDK에 전달해야 합니다.
지원 플레이어:

| **환경** | **플레이어** |
| ---| --- |
| Android | ExoPlayer<br/>Bitmovin Player |

사용하는 플레이어가 SDK에서 지원되는 경우, SDK가 제공하는 MediaPlayerHook 인터페이스를 구현하여 플레이어를 반환할 수 있습니다.

## MediaPlayerHook 인터페이스 설명

| **함수** | **설명** |
| ---| --- |
| getPlayer() | 본 콘텐츠를 재생하는 플레이어 객체를 반환합니다. |

## MediaPlayerHook 구현 예시

### _Java_
```java
public class PlaybackActivity extends Activity {
    private ExoPlayer player;

    private void playLinearTv() {
        MediaPlayerHook mediaPlayerHook = new MediaPlayerHook() {
            @Override
            public Object getPlayer() {
                return player;
            }
        };

        ...
    }
}
```

### _Kotlin_
```kotlin
class PlaybackActivity : Activity() {
    private lateinit var player: ExoPlayer

    private fun playLinearTv() {
        val mediaPlayerHook = object : MediaPlayerHook {
            override fun getPlayer(): Any? {
                return player
            }
        }

        ...
    }
}
```

지원되지 않는 플레이어를 사용하는 경우, [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의하거나 SDK가 제공하는 MediaPlayerAdapter 인터페이스를 구현할 수 있습니다. 자세한 내용은 [플레이어를 직접 제어하는 경우](direct-player-control) 문서를 참고하세요.
