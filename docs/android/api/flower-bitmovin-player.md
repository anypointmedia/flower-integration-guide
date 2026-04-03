---
sidebar_position: 7
---

# FlowerBitmovinPlayer

Flower player class that extends Bitmovin Player.

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

### load

This method overloads base class method, with FlowerAdConfig parameter at last.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| playlistConfig | PlaylistConfig | Original parameter from base class. |
| adConfig | FlowerAdConfig | Information required for ad insertion. |

### load

This method overloads base class method, with FlowerAdConfig parameter at last.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| source | Source | Original parameter from base class. |
| adConfig | FlowerAdConfig | Information required for ad insertion. |

### load

This method overloads base class method, with FlowerAdConfig parameter at last.

The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| sourceConfig | SourceConfig | Original parameter from base class. |
| adConfig | FlowerAdConfig | Information required for ad insertion. |

## Related APIs

*   [FlowerAdConfig](flower-ad-config)
