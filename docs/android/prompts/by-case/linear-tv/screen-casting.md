---
sidebar_position: 5
sidebar_label: Screen Casting to TV
---

# Screen Casting a Linear TV Channel

Use this prompt when the app plays a linear channel with Flower ads and also lets the user cast the channel to an external screen (Chromecast, AirPlay receiver, Smart TV). The URL the local player plays is a loopback address of the SDK's in-app proxy and cannot be reached from another device, so casting the ad-replaced stream is not supported. The LLM makes the cast path stop the SDK and cast the original URL, and restores local ad playback afterwards. Background: [Screen Casting To TV](../../../ad-insertion/linear-tv-fast/screen-casting-to-tv.md).

The prompt generates Kotlin code and assumes the channel is already integrated (see [Linear TV with Your Own Player](./media-player-hook.md) or [Linear TV with Flower Player](./flower-player.md)).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `APPROACH` | `media-player-hook` \| `flower-player` | How the channel is integrated today |
| `PLAYER` | `media3` \| `exoplayer2` \| `bitmovin` | Only for `flower-player`: which Flower Player is used |

```plain
Our Android app plays Linear TV channels with FLOWER SDK ad replacement and has a cast feature.
Make casting work correctly. Modify the code I provide. Generate Kotlin.

========================================
GOAL
========================================
When the user starts casting, stop the Flower SDK and cast the ORIGINAL stream URL. When the
user stops casting and watches locally again, restart local playback with ad replacement.

========================================
PARAMETERS
========================================
APPROACH: {{APPROACH}}   (media-player-hook | flower-player)
PLAYER: {{PLAYER}}       (media3 | exoplayer2 | bitmovin; flower-player only)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- changeChannelUrl() (called by the app, or internally by a Flower Player) returns a loopback URL
  served by an in-app proxy. Only this device can open it.
- Keeping the proxy alive for a cast session would need a reliable background service, which is
  not feasible, so casting the ad-replaced stream is NOT supported.
- FlowerAdsManager.stop() shuts the proxy down and ends ad replacement. Ads are not replaced on
  the external screen.

========================================
IMPLEMENTATION
========================================
1) Keep the original stream URL of the current channel in a member (originalStreamUrl). Never
   read the URL to cast from the player's current media item.

2) Start casting
   APPROACH = media-player-hook:
       player.stop()                          // local playback
       flowerAdView.adsManager.stop()         // shuts down the proxy
       <your cast code>.load(originalStreamUrl)
   APPROACH = flower-player:
       media3 / exoplayer2: player.stop()     // FlowerExoPlayer2 / FlowerMedia3ExoPlayer.stop()
                                              // also stops the SDK
       bitmovin:            player.unload(); player.flowerAdView.adsManager.stop()
                                              // FlowerBitmovinPlayer has no stop(); unload() goes
                                              // to the inner player only
       <your cast code>.load(originalStreamUrl)

3) Stop casting / back to local playback: enter the channel again exactly as on first entry
   (media-player-hook: call changeChannelUrl() again and play the NEW returned URL;
   flower-player: setMediaItem(mediaItem, adConfig) / load(sourceConfig, adConfig) again).
   Never reuse an old loopback URL.

4) Use your existing cast library (Cast SDK, MediaRouter, vendor SDK) unchanged; only the URL and
   the SDK stop/restart around it change.

========================================
RULES
========================================
DO
- Cast originalStreamUrl, after stopping the SDK.
- Restart ad replacement with a fresh changeChannelUrl() / Flower Player load when local
  playback resumes.
DO NOT
- Do not cast the URL returned by changeChannelUrl() (loopback, unreachable from the receiver).
- Do not keep the SDK running in the background for a cast session.
- Do not invent cast APIs; keep the app's cast code.

========================================
VERIFY
========================================
- Casting starts and the receiver plays the original stream.
- While casting, no Flower ad UI or ad playback happens locally.
- After casting stops, local playback resumes with ad replacement (ad breaks replaced again).

========================================
OUTPUT
========================================
- The changed casting and playback code, with a short list of the changes.
```
