---
sidebar_position: 6
---

# Define extraParams

Providing additional parameters to the SDK when requesting an ad helps the SDK deliver the most relevant ad.

Because the SDK cannot automatically determine the ad serving context for mobile web apps, you must provide these parameters when requesting ads.

You can update `extraParams` during live broadcasts.

## List of Parameters

| **Key**<br/>(_Note: All keys marked with an asterisk (\*_) are required.) | **Value** | **Example** |
| ---| ---| --- |
| serviceId\* | The package name of the app. | "tv.anypoint.service" |
| os\* | The operating system of the device running the app. | "iOS" or "Android" |
| adId\* | The ad identifier of the device running the app. | iOS: Uses the IDFA value provided by Apple.<br/>Android: Uses the GAID value provided by Google. |

| **Key (example)** | **Value (example)** |
| ---| --- |
| title | My Summer Vacation |
| genre | horror |
| contentRating | PG-13 |
