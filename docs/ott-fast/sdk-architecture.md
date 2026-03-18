---
sidebar_position: 2
---

# SDK Architecture

This guide explains the SDK architecture, video layer structure, module interactions and lifecycle, and how to integrate ad delivery into your OTT services.

## Lifecycle
The lifecycle has three variations, depending on the type of media you're integrating advertising into. These are outlined below.

### Insert Ads into Live Channels / FAST
This SDK allows you to play ads when a viewer enters live HLS/DASH content or insert replacement ads into live HLS/DASH content by processing the playlist manifest (m3u8 or mpd) using ad markers.

#### Ad Type

##### Main Stream Replacement Ads
This ad type replaces the main content stream using ad markers (e.g., SCTE-35). When a replacement ad plays or finishes, the SDK sends events to the host service.

##### Channel Entry Ads
These ads play before a viewer enters the main content stream. When a viewer requests to watch live content, they will first see the entry ad. Once the entry ad finishes, the viewer will seamlessly transition to the main content stream. The SDK does not provide ad events for this ad type.
![](/img/docs/8590b922-d6d7-4431-b5d7-7fa84f26c6a1.png)
![](/img/docs/a8d71298-de38-4c01-9d1e-8ac4bd76bf30.png)
<p align="center">mux.</p>

### Insert Ads into VOD
This SDK enables you to seamlessly integrate three types of ads into your VOD content:
*   **Pre-roll ads**: Commercials played before the video content starts.
*   **Mid-roll ads**: Commercials played during the video stream.
*   **Post-roll ads**: Commercials played at the end of the video stream.

The FLOWER backend manages the ad policies for each type and delivers them to the SDK in VMAP format.

To integrate ads into your VOD content:
1. Register an implementation of `FlowerAdsManagerListener`.
2. Call `FlowerAdsManager.requestVodAd` before playing the VOD content.
3. Use the events sent through `FlowerAdsManagerListener` to pause or resume your VOD content based on the ad playback.
![](/img/docs/b4b6e1a8-1d61-4566-b1c9-95cd50c49e08.png)

(\*1) Show ad notification
*   To enhance the user experience, you can display an ad notification before a mid-roll ad plays in accordance with your service policy.
*   e.g. An ad will start in 5 seconds.

(\*2) Perform VOD end scenario
*   This SDK provides a way to handle specific scenarios at the end of VOD playback, after any post-roll ads have finished. This allows you to implement custom actions or transitions based on your service's requirements.
*   e.g. Automatically start the next episode in a series.

### Insert Interstitial Ads
This SDK enables you to seamlessly integrate full-screen interstitial ads into your app, game, or website's user interface.
![](/img/docs/0cd7c1a2-0946-485b-b199-521516a62a15.png)

## View Layer Arrangement
The _AdView_ must be the same size as the view in which the main player is placed and overlap that view completely.
_AdView_ is displayed transparently by default, and “Show more” or “Skip” buttons or overlay advertisements can be displayed on it if needed.
![](/img/docs/32f9fd50-3022-4d1c-90af-cab02c1713e2.png)
