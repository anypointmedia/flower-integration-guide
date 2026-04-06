---
sidebar_position: 4
---

# FlowerAdConfig

Ad config classes used for Flower Player classes.

## FlowerLinearTvAdConfig

Class used to specify information required for ad insertion in live broadcasts.

### constructor

The following describes the constructor parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | String | Ad tag URL issued by Flower backend system.<br/>You must file a request to Anypoint Media to receive a adTagUrl. |
| prerollAdTagUrl | String? | (Optional) Pre-roll ad tag URL issued by Flower backend system.<br/>You must file a request to Anypoint Media to receive a prerollAdTagUrl. |
| channelId | String | Unique channel ID.<br/>Must be registered in Flower backend system. |
| extraParams | Map<String, String> | (Optional) Additional information pre-agreed for targeting. |
| adTagHeaders | Map<String, String> | (Optional) HTTP header information to add for ad requests. |
| channelStreamHeaders | Map<String, String> | (Optional) HTTP header information to add for original stream requests. |

## FlowerVodAdConfig

Class used to specify information required for ad insertion in VOD contents.

### constructor

The following describes the constructor parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | String | Ad tag URL issued by Flower backend system.<br/>You must file a request to Anypoint Media to receive a adTagUrl. |
| contentId | String | Unique content ID.<br/>Must be registered in Flower backend system. |
| contentDuration | Long | Duration of VOD content in milliseconds. |
| requestTimeout | Long | (Optional) Minimum timeout duration in milliseconds for requesting VOD ads.<br/>Default is 5000. |
| minPrepareDuration | Long | (Optional) Minimum wait time in milliseconds from the onPrepare event until ad playback starts.<br/>Default is 5000. |
| rewindDuration | Long | (Optional) Duration in milliseconds to rewind the content when ad break ends.<br/>Default is 3000. |
| extraParams | Map<String, String> | (Optional) Additional information pre-agreed for targeting. |
| adTagHeaders | Map<String, String> | (Optional) HTTP header information to add for ad requests. |
