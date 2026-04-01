---
sidebar_position: 3
---

# Step 3: Ad Event Handling & TV Events

This prompt guides LLM to implement ad event listeners and TV event publishing for Linear TV.

**Before using:** Fill in `{{PLAYBACK_MODE}}`.

```plain
We are integrating the FLOWER Linear TV SDK into our Android STB project.
This step implements ad event handling and TV event publishing.

PLAYBACK_MODE: {{PLAYBACK_MODE}}
(dual-player | single-player)

dual-player: Channel audio muted during ads, both streams active simultaneously.
single-player: Channel paused during ads, resumed after.

========================================
IMPORTS — Required packages
========================================

Java:
  import tv.anypoint.api.ads.AnypointAdsManager;        // AdsManagerListener is inner interface
  import tv.anypoint.api.ads.AnypointAdsManager.AdsManagerListener;
  import tv.anypoint.api.ads.AnypointAdView;
  import tv.anypoint.api.ads.AnypointAdRequest;          // For SCTE-35 triggered ad requests
  import tv.anypoint.api.scte35.Scte35Decoder;           // Optional: SDK-provided SCTE-35 decoder
  import tv.anypoint.sdk.comm.TvEvent;
  import tv.anypoint.api.tv.TvEventPublisher;
  import tv.anypoint.api.AnypointSdk;

Kotlin uses the same package paths.
Note: AdsManagerListener is a nested interface inside AnypointAdsManager.

========================================
PART 1 — Implement AdsManagerListener
========================================

The AdsManagerListener interface receives ad lifecycle callbacks from the SDK.

If PLAYBACK_MODE is "dual-player" (recommended for STBs):

Java:
class AdsManagerListenerImpl implements AnypointAdsManager.AdsManagerListener {
    @Override
    public boolean onPrepare(int adCount, boolean retainChannelStream) {
        // Ad data received. Return true if ready to play.
        return true;
    }

    @Override
    public void onPlay(boolean retainChannelStream) {
        // Ad playback starting — mute channel audio
        channelPlayer.setVolume(0, 0);
    }

    @Override
    public void onPause() {
        // Not used for linear broadcasts
    }

    @Override
    public void onResume() {
        // Not used for linear broadcasts
    }

    @Override
    public void prepareStop(boolean retainChannelStream) {
        // Called ~2 seconds before ad ends — prepare transition
    }

    @Override
    public void onStopped(boolean retainChannelStream) {
        // Ads finished — restore channel audio
        channelPlayer.setVolume(1, 1);
    }

    @Override
    public void onError(Throwable t, boolean retainChannelStream) {
        // Ad error occurred. onStopped will also be called.
        Log.e("AdError", "Ad playback error", t);
    }
}

If PLAYBACK_MODE is "single-player":

Java:
class AdsManagerListenerImpl implements AnypointAdsManager.AdsManagerListener {
    @Override
    public boolean onPrepare(int adCount, boolean retainChannelStream) {
        return true;
    }

    @Override
    public void onPlay(boolean retainChannelStream) {
        // Pause channel playback
        channelPlayer.pause();
    }

    @Override
    public void onPause() {}

    @Override
    public void onResume() {}

    @Override
    public void prepareStop(boolean retainChannelStream) {
        // Prepare channel player for resume
        channelPlayer.prepare();
    }

    @Override
    public void onStopped(boolean retainChannelStream) {
        // Resume channel playback
        channelPlayer.start();
    }

    @Override
    public void onError(Throwable t, boolean retainChannelStream) {
        Log.e("AdError", "Ad playback error", t);
    }
}

Register the listener:

AnypointAdView adView = findViewById(R.id.linearTvAdView);
AnypointAdsManager adsManager = adView.getAnypointAdsManager();
adsManager.addListener(new AdsManagerListenerImpl());

========================================
PART 2 — Publish TV Events
========================================

Notify the SDK about TV state changes so it can serve contextually appropriate ads.

Java:
TvEventPublisher tvEventPublisher = AnypointSdk.createTvEventPublisher();

// Channel change (always include service ID)
tvEventPublisher.publish(TvEvent.CHANNEL_CHANGE, serviceId);

// VOD viewing started (include title for targeting)
tvEventPublisher.publish(TvEvent.VOD_START, vodTitle);

// Another app started (include package name)
tvEventPublisher.publish(TvEvent.APP_START, packageName);

// Device entering sleep/standby
tvEventPublisher.publish(TvEvent.SLEEP_MODE_START);

// Any other state where ads should NOT play
tvEventPublisher.publish(TvEvent.MISC);

========================================
PART 3 — Trigger Ad Request on SCTE-35 Cue
========================================

Ads are NOT requested automatically. You must trigger ad requests when SCTE-35 splice cues
are detected from the broadcast stream. There are two approaches:

--------------------------------------------------
Option A: SDK's built-in SCTE-35 Decoder (recommended)

Pass raw SCTE-35 data to the SDK and it handles parsing + ad request internally:

Java:
Scte35Decoder scte35Decoder = adView.useScte35Decoder();

// When SCTE-35 packet is received from the broadcast stream:
scte35Decoder.decode(packetBytes, currentPts);
// or:
scte35Decoder.decodeBase64(base64Text, currentPts);
// or:
scte35Decoder.decodeHex(hexText, currentPts);

--------------------------------------------------
Option B: Manual Ad Request (when your app parses SCTE-35 itself)

If your app already parses SCTE-35 splice info, call request() directly:

Java:
// When a splice cue is detected:
AnypointAdRequest adRequest = new AnypointAdRequest(
    currentPts,        // Current presentation timestamp (90kHz)
    spliceTime,        // Splice event PTS
    duration,          // Ad break duration in microseconds
    eventProgramId,    // Unique program ID from splice info
    extraParams,       // Additional targeting params (nullable)
    channelServiceId   // Channel service ID (optional, nullable)
);
adsManager.request(adRequest);

Do NOT call request() during initialization. It must only be called in response to
an actual SCTE-35 cue event from the broadcast stream.

========================================
PART 4 — Submodule Lifecycle (Optional)
========================================

Monitor SDK submodule status:

AnypointSdk.addModuleLifecycleListener(new SdkModuleLifecycleListener() {
    @Override
    public void initialized(String module) {
        // Module initialized: "multicast", "ima", "player", "ad-ui"
    }
});

========================================
CONSTRAINTS
========================================

- onPrepare returns boolean: true = ready to play ads, false = reject.
- If onPrepare returns false, SDK fires ERROR_CODE_ON_RESPONSE_FAILED.
- prepareStop is called ~2 seconds before ad ends — use this to prepare seamless transition.
- onStopped is always called after onError.
- Always publish CHANNEL_CHANGE with the service ID when the user changes channels.
- Multiple listeners can be registered on the same AdsManager.
```
