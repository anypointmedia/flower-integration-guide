---
sidebar_position: 3
title: Advanced Ad Formats
---

# Advanced Ad Formats

This SDK enables you to insert ads anywhere — on main pages, between screen transitions, between posts, and more.

## Ad Types

### Inline Ads
Ads placed naturally within the content flow of a webpage or app — such as between feed items, inside article bodies, or among list entries. They blend into the user experience while maintaining visibility.

### Masthead Ads
Premium ads displayed prominently at the top of a page (header area). They offer high visibility and are commonly used on portal home pages or app home screens to maximize brand awareness.

### Interstitial Ads
Full-screen ads shown at natural transition points — such as screen transitions, level changes, or between content items. They provide high engagement; the user returns to the original content after dismissing the ad or after a set duration.

## Other

You can insert any type of ad at any position or timing. Contact your account manager for details.

## Lifecycle

### Insert Interstitial Ads

A flowchart showing the entire process — from registering an ad event listener to inserting ads.

```mermaid
flowchart TD
  A["FlowerAdView.FlowerAdsManager.addListener"]:::appCall
  B["FlowerAdView.FlowerAdsManager.requestAd"]:::appCall
  C["FlowerAdsManagerListener.onPrepare"]:::sdkEvent
  D["FlowerAdView.FlowerAdsManager.play"]:::appCall
  E["Playing AD"]:::info
  F["FlowerAdsManagerListener.onPlay"]:::sdkEvent
  G["FlowerAdsManagerListener.onCompleted"]:::sdkEvent
  H["FlowerAdView.FlowerAdsManager.stop"]:::appCall

  A --> B --> C --> D
  D --> E --> F
  F --> G --> H

  classDef appCall fill:#d0e8ff,stroke:#5b9bd5,color:#000
  classDef sdkEvent fill:#ffd0d0,stroke:#e06060,color:#000
  classDef info fill:#e8d0f0,stroke:#9b59b6,color:#000
```

> **Legend**  
> <span style="background-color:#d0e8ff;padding:2px 8px;border:1px solid #5b9bd5"> </span>&nbsp;Function call made by you
> <span style="background-color:#ffd0d0;padding:2px 8px;border:1px solid #e06060"></span>&nbsp;Event fired by SDK
