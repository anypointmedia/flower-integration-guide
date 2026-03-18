---
sidebar_position: 5
---

# Implement an Interface for Passing Video Player

For linear channels or VOD, you must pass information about the video player used for content playback to the SDK.
Supported players:

| **Environment** | **Player** |
| ---| --- |
| HTML5 | Bitmovin Player<br/>HLS.js<br/>Video.js |

If the player that you are using is supported by the SDK, you can return the player by implementing the MediaPlayerHook interface that is provided by the SDK.

## MediaPlayerHook Interface Description

| **Function** | **Description** |
| ---| --- |
| getPlayer() | Returns the player object that plays the main content. |

## Examples of MediaPlayerHook Implementation

```javascript
const player = new bitmovin.Player(document.querySelector('video'))
const mediaPlayerHook = {
    getPlayer() {
        return player;
    },
}
```

If the SDK doesn't support your video player, Contact [Helpdesk](mailto:dev-support@anypointmedia.com).
