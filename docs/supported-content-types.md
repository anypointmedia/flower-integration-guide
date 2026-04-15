---
sidebar_position: 2
---

# Supported Content Types and Ad Services

An overview of the content types FLOWER supports and real-world scenarios for each ad service.

## Linear Channels

### Main Stream Replacement Ads

Replaces existing ad segments within the main content stream using ad markers (e.g., SCTE-35). Supported across both delivery methods with different processing mechanisms.

*   **Unicast (HLS/DASH)**: The SDK processes the playlist manifest (m3u8 or mpd) to detect ad markers and replace ad segments within the stream.
*   **Satellite/IPTV**: The SDK detects SCTE-35, DTMF cue tones, and EPG-based virtual cues to replace ad segments within the stream.

#### Example Uses

*   Replace existing ad breaks on broadcast or cable channels with your own or targeted ads to capture additional revenue.
*   Maximize ad inventory on FAST channels by inserting programmatic ads between content segments.
*   Place premium ads during natural breaks in live sports — halftime, quarter breaks, and timeouts.
*   Serve region-specific ads to meet local advertiser demand.

### Channel Entry Ads

Ads displayed at the moment a viewer tunes into a live channel, before the main content begins. The viewer seamlessly transitions to the live stream once the ad finishes. Available for Unicast (HLS/DASH) delivery.

#### Example Uses

*   Monetize free channels by generating ad revenue at every channel-switch moment.
*   Turn the channel entry point into a premium ad slot for AVOD-tier OTT services.
*   Promote new original content or campaigns at the channel entry point to boost viewer awareness.

### Analog Cue and Push-Triggered Ads

Ad types specific to Satellite/IPTV (satellite DTH and IPTV multicast) delivery, where the backend system directly triggers ad playback on client devices.

*   **Digital Cue (SCTE-35)**: Replaces ad segments based on SCTE-35 packets embedded in the TS stream.
*   **Analog Cue**: Ad cues detected by the Head-End (H/E) system are relayed to devices via the Anypoint platform to replace ad segments.
*   **Push-Triggered (Virtual Cue)**: The backend generates virtual cues based on the broadcast program schedule (EPG) and relays them to devices via the Anypoint platform to replace ad segments.

#### Example Uses

*   Play locally cached targeted ads on set-top boxes, timed to broadcast ad breaks detected by the H/E system.
*   Schedule ad breaks based on program timetables to deliver ads at precise moments — even on channels without in-stream markers.
*   Concentrate ad delivery during prime-time slots to maximize CPM.

## VOD

Insert ads before, during, or after VOD content playback.

*   **Pre-roll Ads**: Played before the main content begins.
*   **Mid-roll Ads**: Played at regular intervals or designated insertion points within the content.
*   **Post-roll Ads**: Played after the main content ends.

#### Example Uses

*   Combine pre-roll, mid-roll, and post-roll ads across feature films and drama series to maximize per-episode revenue.
*   Place mid-roll ads at natural scene transitions (chapter points) to minimize viewer drop-off.
*   Insert ads into free content on AVOD services while offering an ad-free experience for premium subscribers.
*   Apply pre-roll only for short-form content to keep the ad experience concise.

## Webpage / App

Insert video ads within webpages and apps.

#### Example Uses

*   Place inline video ads on high-traffic portal home pages to convert page views into ad revenue.
*   Embed video ads mid-article in news or blog content for natural exposure within the reading flow.
*   Show interstitial ads at level transitions or reward moments in gaming apps to maintain engagement while generating revenue.
*   Display a brand video ad in the masthead area on app launch to offer a premium ad placement.
*   Apply rewarded ads that require viewing before accessing specific features in free-to-use apps.
