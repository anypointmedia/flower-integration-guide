---
sidebar_position: 5
---

# AdInfo

Ad metadata interface responded on Flower events.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| id | string? | Ad id specified in VAST response. |
| duration | number | Ad duration in milliseconds. |
| isSkippable | boolean | Whether the ad is skippable or not. |
| mediaUrl | string | Ad creative url to be played. |
| extensions | `Map<string, string>` | Parsed VAST extensions of each original {`<Ad />`} element. |

## Related APIs

*   [FlowerAdsManagerListener](flower-ads-manager-listener)
