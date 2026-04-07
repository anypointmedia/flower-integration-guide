---
sidebar_position: 1
---

# Implement an Interface for Passing Video Player

For linear channels or VOD, you must pass information about the video player used for content playback to the SDK.
Supported players:

| **Environment** | **Player** |
| ---| --- |
| Android | ExoPlayer<br/>Bitmovin Player |

If the player that you are using is supported by the SDK, you can return the player by implementing the MediaPlayerHook interface that is provided by the SDK.

## MediaPlayerHook Interface Description

| **Function** | **Description** |
| ---| --- |
| getPlayer() | Returns the player object that plays the main content. |

## Examples of MediaPlayerHook Implementation

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

If you are using a player that is not officially supported, you can either contact the [Helpdesk](mailto:dev-support@anypointmedia.com) or implement the MediaPlayerAdapter interface provided by the SDK. For more details, refer to the [In case of direct player control](direct-player-control) documentation.
