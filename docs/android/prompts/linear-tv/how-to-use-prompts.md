---
sidebar_position: 0
---

# How to Use These Prompts

This section contains prompts for LLM-assisted Linear TV SDK integration on Android STB (Set-Top Box) environments.

## Choose Your Approach

### Integrated Prompt (Recommended for new projects)

Use **integrated-prompt.md** when starting from scratch. Fill in all parameters and the LLM generates complete integration code.

### Step-by-Step Prompts (Recommended for existing projects)

Use individual step prompts to add SDK integration incrementally.

## Step Overview

| Step | File | What It Does | When to Use Alone |
|------|------|-------------|-------------------|
| **Step 1** | `step-1-project-setup.md` | Add SDK dependency, ProGuard, initialize SDK, publish initial TV event | Build/init problems |
| **Step 2** | `step-2-ad-ui-and-player.md` | Add AnypointAdView layer, set up ad player (built-in or custom) | Ad layer not showing, custom player issues |
| **Step 3** | `step-3-ad-integration.md` | Implement AdsManagerListener, publish TV events, trigger SCTE-35 ad requests | Ads not playing, wrong listener behavior |
| **Step 4** | `step-4-cleanup.md` | SDK release, custom player release, status checks | Memory leaks, shutdown issues |

## Parameters to Fill In

| Parameter | Values | Description |
|-----------|--------|-------------|
| `SDK_VERSION` | e.g., `2.0.0` | SDK version |
| `PLAYER_TYPE` | `built-in` \| `custom` | Ad player strategy |
| `PLAYBACK_MODE` | `dual-player` \| `single-player` | How ads interact with channel |
| `INITIAL_SERVICE_ID` | e.g., `101` | Service ID of the initial channel |

## Choosing PLAYER_TYPE

### built-in (Simplest)

SDK uses its own ExoPlayer for ad playback. Requires `sdk-multicast-exoplayer` dependency.

**Best for**: Standard STBs with sufficient resources for dual decoding.

### custom (Advanced)

You implement the `AnypointAdPlayer` interface to control ad playback with your own player. Requires only `sdk-multicast` dependency.

**Best for**: Resource-constrained STBs, single-decoder hardware, custom ad rendering.

## Choosing PLAYBACK_MODE

### dual-player (Recommended)

Channel stream keeps playing during ads. Channel audio is muted, ad audio plays over it.

```
onPlay → channelPlayer.setVolume(0, 0)   // mute channel
onStopped → channelPlayer.setVolume(1, 1) // unmute channel
```

**Best for**: STBs that can decode two streams simultaneously.

### single-player

Channel stream is paused during ads. Resumed after ads finish.

```
onPlay → channelPlayer.pause()         // pause channel
prepareStop → channelPlayer.prepare()  // prepare to resume (~2s before ad ends)
onStopped → channelPlayer.start()      // resume channel
```

**Best for**: Single-decoder STBs or when seamless transition is critical.

## SCTE-35 Ad Triggering

Ads are NOT automatic. They must be triggered by SCTE-35 splice cues from the broadcast stream.

**Option A — SDK's built-in decoder** (recommended):
```java
Scte35Decoder decoder = adView.useScte35Decoder();
// When SCTE-35 packet arrives:
decoder.decode(packetBytes, currentPts);
```

**Option B — Manual request** (when you parse SCTE-35 yourself):
```java
adsManager.request(new AnypointAdRequest(currentPts, spliceTime, duration, programId, extraParams, channelId));
```

## Linear TV SDK vs OTT/FAST SDK

This section is for the **Linear TV (multicast/DTH) SDK** which uses `AnypointSdk`, `AnypointAdView`, and `AdsManagerListener`. It is **Android STB only**.

For Unicast (HLS/DASH) streaming integration, see the [Android VOD Prompts](/docs/android/prompts/vod/how-to-use-prompts).
