---
sidebar_position: 1
title: OTT Linear TV (incl. FAST) Ads
---

# OTT Linear TV (incl. FAST) Ads

This SDK allows you to play ads when a viewer enters live HLS/DASH content, or insert replacement ads by processing the playlist manifest (m3u8 or mpd) using ad markers.

## Ad Types

### Main Stream Replacement Ads

This ad type replaces the main content stream using ad markers (e.g., SCTE-35). When a replacement ad plays or finishes, the SDK sends events to the host service.

### Channel Entry Ads

These ads play before a viewer enters the main content stream. When a viewer requests to watch live content, they will first see the entry ad. Once the entry ad finishes, the viewer will seamlessly transition to the main content stream.
Note that when using channel entry ads, the app does not need to start playback manually, as the main content stream starts automatically after the entry ad finishes. Starting playback manually may briefly expose the main content video, degrading the UX.

## View Layer Arrangement

The _AdView_ must be the same size as the view in which the main player is placed and overlap that view completely.

_AdView_ is displayed transparently by default, and "Show more" or "Skip" buttons or overlay advertisements can be displayed on it if needed.

![](/img/docs/32f9fd50-3022-4d1c-90af-cab02c1713e2.png)

## Application Architecture

The player uses the media stream URL provided through the SDK. The SDK manipulates the manifest (m3u8/mpd) or routes segments to replace main content with ads, so no special player-side configuration is needed.

```mermaid
flowchart LR
  subgraph App["Service Application"]
    Player["Player"]
    SDK["SDK"]
  end
  CDN["CDN"]

  CDN -- "Original\nM3U8/MPD" --> SDK
  SDK -- "Manipulated M3U8/MPD\nwith targeted Ads" --> Player
  CDN -- "chunked ts/mp4" --> Player
```

## Lifecycle

A flowchart showing the entire process of registering an ad event listener and replacing ads while playing the main content.

```mermaid
flowchart TD
  A["FlowerAdView.FlowerAdsManager.addListener"]:::appCall
  B["FlowerAdView.FlowerAdsManager.changeChannelUrl"]:::appCall
  C["ContentPlayer.setMediaUrl"]:::appCall
  C2["ContentPlayer.play"]:::appCall
  D{"With prerollAdTagUrl?"}
  E["Playing Pre-roll AD ⭐"]
  H["FlowerAdsManagerListener.onPrepare"]:::sdkEvent
  H2["FlowerAdsManagerListener.onPlay"]:::sdkEvent
  H3["FlowerAdsManagerListener.onPrepare & onPlay & onCompleted"]:::sdkEvent
  J["FlowerAdsManagerListener.onCompleted"]:::sdkEvent
  F["Original Stream In Progress"]
  G["Ad Marker Occurrence"]
  G2["Prepare AD"]
  I["Manifest(Playlist) Manipulation"]
  K["ContentPlayer.stop"]:::appCall
  L["FlowerAdView.FlowerAdsManager.stop"]:::appCall

  A --> B --> C --> D
  D -- "Yes" --> E --> H3
  E --> C2
  D -- "No" --> C2 --> F
  F --> G --> G2 --> H
  G2 -- "Ad MediaSegment Started" --> I
  I --> H2
  I -- "All Ad MediaSegment Played" --> J
  C --> K --> L
  C2 --> K

  classDef appCall fill:#d0e8ff,stroke:#5b9bd5,color:#000
  classDef sdkEvent fill:#ffd0d0,stroke:#e06060,color:#000
```

> **Legend**  
> <span style="background-color:#d0e8ff;padding:2px 8px;border:1px solid #5b9bd5"> </span>&nbsp;Function call made by you
> <span style="background-color:#ffd0d0;padding:2px 8px;border:1px solid #e06060"></span>&nbsp;Event fired by SDK
> ⭐ Optional
