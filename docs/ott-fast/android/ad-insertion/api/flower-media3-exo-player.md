---
sidebar_position: 6
---

# FlowerMedia3ExoPlayer

Flower player class that extends Media3 ExoPlayer.

## Methods

### addAdListener

Adds an ad event listener to the player. If the listener is already registered, nothing happens.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| listener | FlowerAdsManagerListener | Ad event listener to add. |

### removeAdListener

Removes an ad event listener from the player. If the listener is not registered, nothing happens.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| listener | FlowerAdsManagerListener | Ad event listener to remove. |

### setMediaItem

This method overloads base class method, with FlowerAdConfig parameter at last.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| mediaItem | MediaItem | Original parameter from base class. |
| adConfig | FlowerAdConfig | Information required for ad insertion. |

### setMediaItem

This method overloads base class method, with FlowerAdConfig parameter at last.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| mediaItem | MediaItem | Original parameter from base class. |
| resetPosition | Boolean | Original parameter from base class. |
| adConfig | FlowerAdConfig | Information required for ad insertion. |

### setMediaItem

This method overloads base class method, with FlowerAdConfig parameter at last.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| mediaItem | MediaItem | Original parameter from base class. |
| startPositionMs | Long | Original parameter from base class. |
| adConfig | FlowerAdConfig | Information required for ad insertion. |

## Related APIs

*   [FlowerAdConfig](flower-ad-config)
