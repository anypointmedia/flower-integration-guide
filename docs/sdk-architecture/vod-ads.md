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
  C["FlowerAdsManagerListener.onPrepare (*1)"]:::sdkEvent
  S["Pause the content"]:::sdkAction
  E["FlowerAdView.FlowerAdsManager.play"]:::appCall
  F["Start AD"]
  G["FlowerAdsManagerListener.onPlay"]:::sdkEvent
  I["End AD"]
  J["FlowerAdsManagerListener.onCompleted"]:::sdkEvent
  K{"Which ad break?"}
  N2["Perform VOD End Scenario ⭐ (*2)"]:::info
  L["contentPlayer.play"]:::appCall
  R["Rewind the content by rewindDuration and resume it"]:::sdkAction
  M["VOD finished"]
  Z["FlowerAdView.FlowerAdsManager.notifyContentEnded"]:::appCall

  A --> B --> C
  C -- "Mid-roll" --> S --> E
  C -- "Pre-roll/Post-roll" --> E
  E --> F --> G --> I --> J --> K
  K -- "Post-roll" --> N2
  K -- "Pre-roll" --> L
  K -- "Mid-roll" --> R
  L --> M
  R --> M
  M --> Z
  L -- Preparing Mid-roll --> C
  R -- Preparing Mid-roll --> C
  Z -- Preparing Post-roll --> C

  classDef appCall fill:#d0e8ff,stroke:#5b9bd5,color:#000
  classDef sdkEvent fill:#ffd0d0,stroke:#e06060,color:#000
  classDef sdkAction fill:#e0f2e0,stroke:#5ba55b,color:#000
  classDef info fill:#fff9c4,stroke:#f9a825,color:#000
```

> **Legend**  
> <span style="background-color:#d0e8ff;padding:2px 8px;border:1px solid #5b9bd5"> </span>&nbsp;Function call made by you
> <span style="background-color:#ffd0d0;padding:2px 8px;border:1px solid #e06060"></span>&nbsp;Event fired by SDK
> <span style="background-color:#e0f2e0;padding:2px 8px;border:1px solid #5ba55b"></span>&nbsp;Done by SDK on the content player
> ⭐ Optional

> (\*1) Mid-roll timing and content control
> - The SDK requests a mid-roll ad `requestTimeout + minPrepareDuration` before the mid-roll's position, and calls `onPrepare` when the content reaches that position. Call `play` right away in `onPrepare`.
> - By default (`setIgnoreAdBreakInPIPMode(true)`), ads play in the SDK's own ad player over the content. For a mid-roll, the SDK pauses the content and, after the ad break, resumes it `rewindDuration` (5 seconds by default) before the point where it was interrupted. Do not pause, seek, or reload the content yourself around a VOD ad break.
> - With `setIgnoreAdBreakInPIPMode(false)`, supported players play the ads inside the content player, and the SDK puts the content back at the resume point after the ad break. See the PIP Mode Support page of each platform.

> (\*2) Perform VOD end scenario
> - This SDK provides a way to handle specific scenarios at the end of VOD playback, after any post-roll ads have finished. This allows you to implement custom actions or transitions based on your service's requirements.
> - e.g. Automatically start the next episode in a series.
