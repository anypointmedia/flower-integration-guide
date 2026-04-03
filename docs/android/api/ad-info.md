---
sidebar_position: 8
---

# AdInfo

Ad metadata interface responded on Flower events.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| id | String? | Ad id specified in VAST response. |
| duration | Int | Ad duration in milliseconds. |
| isSkippable | Boolean | Whether the ad is skippable or not. |
| mediaUrl | String | Ad creative url to be played. |
| extensions | `Map<String, String>` | Parsed VAST extensions of each original {`<Ad />`} element. |

## Related APIs

*   [FlowerAdsManagerListener](flower-ads-manager-listener)
