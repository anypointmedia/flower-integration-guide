---
sidebar_position: 2
title: VOD Ads
---

# VOD Ads

This SDK enables you to insert ads during VOD content playback according to your application's ad policy.

## Ad Types

Three types of ads can be inserted into VOD content:

- **Pre-roll ads**: Commercials played before the video content starts.
- **Mid-roll ads**: Commercials played during the video stream.
- **Post-roll ads**: Commercials played at the end of the video stream.

FLOWER manages the ad policies for each type and delivers them to the SDK in VMAP format. Contact your account manager for details.

## View Layer Arrangement

The _AdView_ must be the same size as the view in which the main player is placed and overlap that view completely.

_AdView_ is displayed transparently by default, and "Show more" or "Skip" buttons or overlay advertisements can be displayed on it if needed.

![](/img/docs/32f9fd50-3022-4d1c-90af-cab02c1713e2.png)

## Lifecycle

A flowchart showing the entire process — from registering an ad event listener to coordinating ad playback with the main content.

```mermaid
flowchart TD
  A["FlowerAdView.FlowerAdsManager.addListener"]:::appCall
  B["FlowerAdView.FlowerAdsManager.requestVodAd"]:::appCall
  C["FlowerAdsManagerListener.onPrepare"]:::sdkEvent
  D{"VOD is playing?"}
  N1["Show ad notification ⭐ (*1)"]:::info
  E["FlowerAdView.FlowerAdsManager.play"]:::appCall
  F["Start AD"]
  G["FlowerAdsManagerListener.onPlay"]:::sdkEvent
  H{"VOD is playing?"}
  P["contentPlayer.pause"]:::appCall
  I["End AD"]
  J["FlowerAdsManagerListener.onCompleted"]:::sdkEvent
  K{"VOD is finished?"}
  N2["Perform VOD End Scenario ⭐ (*2)"]:::info
  L["contentPlayer.play or resume"]:::appCall
  M["VOD finished"]
  Z["FlowerAdView.FlowerAdsManager.notifyContentEnded"]:::appCall

  A --> B --> C
  C --> D
  D -- "Yes\n(Mid-roll)" --> N1 --> E
  D -- "No\n(Pre-roll/Post-roll)" --> E
  E --> F --> G
  G --> H
  H -- "Yes\n(Mid-roll)" --> P --> I
  H -- "No\n(Pre-roll/Post-roll)" --> I
  I --> J --> K
  K -- "Yes" --> N2
  K -- "No" --> L
  L --> M --> Z
  L -- Preparing Mid-roll --> C
  Z -- Preparing Post-roll --> C

  classDef appCall fill:#d0e8ff,stroke:#5b9bd5,color:#000
  classDef sdkEvent fill:#ffd0d0,stroke:#e06060,color:#000
  classDef info fill:#fff9c4,stroke:#f9a825,color:#000
```

> **Legend**  
> <span style="background-color:#d0e8ff;padding:2px 8px;border:1px solid #5b9bd5"> </span>&nbsp;Function call made by you
> <span style="background-color:#ffd0d0;padding:2px 8px;border:1px solid #e06060"></span>&nbsp;Event fired by SDK
> ⭐ Optional

> (\*1) Show ad notification
> - To enhance the user experience, you can display an ad notification before a mid-roll ad plays in accordance with your service policy.
> - e.g. An ad will start in 5 seconds.

> (\*2) Perform VOD end scenario
> - This SDK provides a way to handle specific scenarios at the end of VOD playback, after any post-roll ads have finished. This allows you to implement custom actions or transitions based on your service's requirements.
> - e.g. Automatically start the next episode in a series.
