---
sidebar_position: 5
---

# AdInfo

Ad metadata interface responded on Flower events.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| id | String? | Ad id specified in VAST response. |
| duration | Int32 | Ad duration in milliseconds. |
| isSkippable | Bool | Whether the ad is skippable or not. |
| mediaUrl | String | Ad creative url to be played. |
| extensions | \[String: String\] | Parsed VAST extensions of each original {`<Ad />`} element. |
| playTime | Int32 | Current ad playback time in milliseconds. |
| isClickable | Bool | Whether the ad is clickable or not. |
| sourceType | String | Source of the ad creative.<br/>`DIRECT_IO`: Direct IO ad<br/>`GOOGLE`: Google ad<br/>`ETC`: Other ad source<br/>`FILLER`: Filler ad |

## Related APIs

*   [FlowerAdsManagerListener](flower-ads-manager-listener)
