---
sidebar_position: 2
---

# Supported Content Types and Ad Services

This section outlines the content types supported by FLOWER and provides examples of how you can use our ad services.

## Linear Channels

### Main Stream Replacement Ads

This ad type utilizes ad markers (e.g., SCTE-35) to replace existing ads within the main content stream. SCTE-35-based replacement is supported across both delivery methods, but the processing mechanism differs:

*   **Unicast (HLS/DASH)**: The SDK processes the playlist manifest (m3u8 or mpd) to detect ad markers and replace ad segments within the stream.
*   **DTH / Multicast**: The SDK detects SCTE-35 cues in the TS stream, and the ad agent plays locally cached creatives in the advertisement layer.

#### Example Uses
*   Replace existing ad breaks with your own house ads.
*   Monetize FAST channels by inserting ads between content segments.
*   Generate revenue by replacing ads during live sports broadcasts.

### Channel Entry Ads

These ads play before a viewer enters the main content stream. When a viewer requests to watch live content, they will first see the entry ad before transitioning to the main stream. Available for unicast (HLS/DASH) delivery.

#### Example Uses
*   Monetize free channels by setting up channel entry ads.
*   Generate ad revenue from ad-supported plans on your dynamic OTT service.

### Analog Cue and Push-Triggered Ads

These ad types are specific to DTH / Multicast delivery, where the backend system triggers ad playback on client devices.

*   **Analog Cue**: Ad cues detected by the Head-End (H/E) system are relayed to devices via the Anypoint platform, instructing them to start ad playback.
*   **Push-Triggered (Virtual Cue)**: The backend generates virtual cues based on the broadcast program schedule and transmits them to devices via the push server.

#### Example Uses
*   Insert ads at broadcast commercial breaks detected by the Head-End system.
*   Schedule ad breaks based on program timetables without requiring in-stream markers.

## VOD

FLOWER supports various ad formats for VOD content:
*   Pre-roll Ads: Insert ads before the main content begins.
*   Post-roll Ads: Insert ads after the main content ends.
*   Mid-roll Ads: Insert ads at regular intervals or designated ad insertion points within the content.

### Example Uses
*   Monetize long-form VOD content by inserting pre-roll, mid-roll, and post-roll ads.
*   Use ad insertion points to place ads at natural breaks in the content.

## Webpage / App

FLOWER enables you to seamlessly integrate video ads into your webpages and apps.

### Example Uses
*   Insert a 300x400 sized video ad at the bottom right of the portal site's main page.
*   Insert a video ad in the middle of a blog post.
*   Insert interstitial ads between game levels.
*   Monetize app access by requiring users to watch an ad before entering.
