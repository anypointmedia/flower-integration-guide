---
sidebar_position: 5
---

# AdInfo

Ad metadata interface responded on Flower events.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| id | String? | Ad id specified in VAST response. |
| duration | Int32 | Ad duration in milliseconds. |
| extraParams | \[String: String\] | Whether the ad is skippable or not. |
| mediaUrl | String | Ad creative url to be played. |
| extensions | \[String: String\] | Parsed VAST extensions of each original {`<Ad />`} element. |

## Related APIs

*   [FlowerAdsManagerListener](flower-ads-manager-listener)
