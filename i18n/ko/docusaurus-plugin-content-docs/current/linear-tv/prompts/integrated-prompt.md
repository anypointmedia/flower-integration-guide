---
sidebar_position: 5
---

# 통합 프롬프트 (전체 단계)

이 프롬프트는 STB 환경용 Flower Linear TV SDK 연동 전체를 하나의 프롬프트로 다룹니다. Step 1–4의 전체 내용이 포함되어 있습니다.

**사용 전:** 모든 `{{...}}` 플레이스홀더를 교체하세요.

```plain
We are integrating the FLOWER Linear TV SDK into our Android STB project.
Generate complete integration code for the following configuration:

SDK_VERSION: {{SDK_VERSION}}
PLAYER_TYPE: {{PLAYER_TYPE}}          (built-in | custom)
PLAYBACK_MODE: {{PLAYBACK_MODE}}      (dual-player | single-player)
INITIAL_SERVICE_ID: {{INITIAL_SERVICE_ID}}

################################################################
IMPORTS — Required packages
################################################################

Java:
  import tv.anypoint.api.AnypointSdk;
  import tv.anypoint.api.ads.AnypointAdView;
  import tv.anypoint.api.ads.AnypointAdsManager;
  import tv.anypoint.api.ads.AnypointAdsManager.AdsManagerListener;
  import tv.anypoint.api.ads.AnypointAdRequest;
  import tv.anypoint.api.scte35.Scte35Decoder;
  import tv.anypoint.sdk.comm.TvEvent;
  import tv.anypoint.api.tv.TvEventPublisher;
  // Custom player only:
  import tv.anypoint.api.ads.AnypointAdPlayer;
  import tv.anypoint.api.ads.AnypointAdPlayer.AnypointAdPlayerCallback;
  import tv.anypoint.api.ads.AnypointAdPlayer.AdProgress;
  import tv.anypoint.sdk.comm.PlaySet;

Kotlin uses the same package paths (without semicolons).
Use only the imports needed for your PLAYER_TYPE.

################################################################
STEP 1 — PROJECT SETUP & SDK INITIALIZATION
################################################################

========================================
STEP 1.1 — Add Dependencies (build.gradle)
========================================

First, add the AnypointMedia Maven repository:

repositories {
    maven { url "https://maven.anypoint.tv/repository/public-release/" }
}

Then choose ONE dependency path based on your ad player strategy:

Path 1: Google IMA + Built-in ExoPlayer (recommended)
  implementation "tv.anypoint:sdk-multicast-ima:{{SDK_VERSION}}"
  implementation "tv.anypoint:sdk-multicast-exoplayer:{{SDK_VERSION}}"

Path 2: Built-in ExoPlayer only (no Google Ads)
  implementation "tv.anypoint:sdk-multicast-exoplayer:{{SDK_VERSION}}"

Path 3: Custom ad player (minimal SDK)
  implementation "tv.anypoint:sdk-multicast:{{SDK_VERSION}}"

========================================
STEP 1.2 — ProGuard Configuration
========================================

Add to proguard-rules.pro:
  -keep class tv.anypoint.sdk.comm.** { *; }

========================================
STEP 1.3 — AndroidManifest.xml (SDK < 2.0.7)
========================================

If using SDK version below 2.0.7, add:
  <queries>
      <package android:name="tv.anypoint.flower.app"/>
  </queries>

========================================
STEP 1.4 — Initialize and Release SDK
========================================

In your Application class:

Java:
public class YourApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        AnypointSdk.setDebugMode(false);  // Optional: enable debug logging
        AnypointSdk.initialize(getApplicationContext());
    }

    @Override
    public void onTerminate() {
        super.onTerminate();
        AnypointSdk.destroy();
    }
}

Kotlin:
class YourApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        AnypointSdk.setDebugMode(false) // Optional: enable debug logging
        AnypointSdk.initialize(applicationContext)
    }

    override fun onTerminate() {
        super.onTerminate()
        AnypointSdk.destroy()
    }
}

========================================
STEP 1.5 — Send Initial TV Event
========================================

After SDK initialization, publish the initial channel event:

Java:
TvEventPublisher tvEventPublisher = AnypointSdk.createTvEventPublisher();
tvEventPublisher.publish(TvEvent.CHANNEL_CHANGE, initialServiceId);

This tells the SDK which channel the viewer is watching so it can serve appropriate ads.

################################################################
STEP 2 — AD LAYER & PLAYER SETUP
################################################################

PLAYER_TYPE: {{PLAYER_TYPE}}
(built-in | custom)

========================================
STEP 2.1 — Add Ad Layer (AnypointAdView)
========================================

The AnypointAdView sits between the video playback layer and the TV UI layer.

XML approach:
<RelativeLayout
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <!-- Your channel player view (bottom layer) -->
    <YourPlayerView
        android:id="@+id/channelPlayerView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <!-- Ad layer (middle layer) -->
    <tv.anypoint.api.ads.AnypointAdView
        android:id="@+id/linearTvAdView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <!-- Your TV UI layer (top layer) -->
</RelativeLayout>

Programmatic approach:
AnypointAdView adView = new AnypointAdView(context);
adView.setLayoutParams(new RelativeLayout.LayoutParams(
    RelativeLayout.LayoutParams.MATCH_PARENT,
    RelativeLayout.LayoutParams.MATCH_PARENT
));
rootLayout.addView(adView);

========================================
STEP 2.2 — Ad Player Setup
========================================

If PLAYER_TYPE is "built-in":
  No setup needed. The SDK uses ExoPlayer internally.
  Make sure you have the sdk-multicast-exoplayer dependency.
  The SDK handles all ad playback automatically.

If PLAYER_TYPE is "custom":
  Implement the AnypointAdPlayer interface and register it:

  Java:
  CustomAdPlayer player = new CustomAdPlayer();
  AnypointAdView adView = findViewById(R.id.linearTvAdView);
  adView.setAdPlayer(player);

  AnypointAdPlayer interface requires these methods:
  - addCallback(AnypointAdPlayerCallback) / removeCallback(AnypointAdPlayerCallback)
  - load(PlaySet playSet) — Prepare playlist, call callback.onLoaded(firstUrl)
  - append(PlaySet playSet) — Add to queue
  - play() — Start, call callback.onPlay(url) on first play
  - pause() / resume() — call callback.onPause(url) / callback.onResume(url)
  - stop() — Stop, call callback.onStopped()
  - skipAd(long skipDurationMs) — Skip current by duration, return boolean
  - isAdPlaying() — Boolean
  - currentMediaUrl() — Current URL
  - getCurrentMediaUnitIndex() — Current ad index
  - getVolume() — Float 0.0-1.0
  - getProgress() — AdProgress(currentPlaytime, duration, currentAdPlaytime) or AdProgress.NOT_READY
  - mute() / unmute() — Mute/unmute ad audio
  - setVolume(float volume) — Set ad volume (0.0-1.0)
  - release() — Free resources

  AnypointAdPlayerCallback interface (passed via addCallback):
  - onLoaded(String mediaUrl) — Call when first media is prepared in load()
  - onPlay(String mediaUrl) — Call when first media starts playing in play()
  - onPause(String mediaUrl) — Call when ad is paused
  - onResume(String mediaUrl) — Call when ad is resumed
  - onStopped() — Call when ad is stopped
  - onError(String mediaUrl, Throwable t) — Call on playback error

################################################################
STEP 3 — AD EVENT HANDLING & TV EVENTS
################################################################

PLAYBACK_MODE: {{PLAYBACK_MODE}}
(dual-player | single-player)

dual-player: Channel audio muted during ads, both streams active simultaneously.
single-player: Channel paused during ads, resumed after.

========================================
STEP 3.1 — Implement AdsManagerListener
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
STEP 3.2 — Publish TV Events
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
STEP 3.3 — Trigger Ad Request on SCTE-35 Cue
========================================

Ads are NOT requested automatically. Trigger ad requests when SCTE-35 splice cues
are detected from the broadcast stream.

Option A: SDK's built-in SCTE-35 Decoder (recommended)

Java:
Scte35Decoder scte35Decoder = adView.useScte35Decoder();
// When SCTE-35 packet is received:
scte35Decoder.decode(packetBytes, currentPts);
// or: scte35Decoder.decodeBase64(base64Text, currentPts);
// or: scte35Decoder.decodeHex(hexText, currentPts);

Option B: Manual Ad Request (when your app parses SCTE-35 itself)

Java:
AnypointAdRequest adRequest = new AnypointAdRequest(
    currentPts,        // Current PTS (90kHz)
    spliceTime,        // Splice event PTS
    duration,          // Ad break duration (microseconds)
    eventProgramId,    // Unique program ID from splice info
    extraParams,       // Additional targeting params (nullable)
    channelServiceId   // Channel service ID (optional)
);
adsManager.request(adRequest);

Do NOT call request() during initialization — only in response to SCTE-35 cue events.

========================================
STEP 3.4 — Submodule Lifecycle (Optional)
========================================

Monitor SDK submodule status:

AnypointSdk.addModuleLifecycleListener(new SdkModuleLifecycleListener() {
    @Override
    public void initialized(String module) {
        // Module initialized: "multicast", "ima", "player", "ad-ui"
    }
});

################################################################
STEP 4 — CLEANUP & RELEASE
################################################################

========================================
STEP 4.1 — SDK Release (Application Level)
========================================

In your Application class onTerminate:

Java:
@Override
public void onTerminate() {
    super.onTerminate();
    AnypointSdk.destroy();
}

Kotlin:
override fun onTerminate() {
    super.onTerminate()
    AnypointSdk.destroy()
}

========================================
STEP 4.2 — Custom Ad Player Release (if applicable)
========================================

If using a custom ad player, implement the release() method:

@Override
public void release() {
    // Free all player resources
    player.release();
    callbacks.clear();
}

The SDK calls release() when it's done with the ad player.

========================================
STEP 4.3 — Check SDK Status
========================================

Before using SDK features, verify initialization:

if (AnypointSdk.isInitialized()) {
    // Safe to use SDK
}

################################################################
OUTPUT REQUIREMENTS
################################################################

- Provide complete, compilable code files (not snippets).
- Use the PLAYER_TYPE and PLAYBACK_MODE values above to select the correct conditional branches.
- Generate ONLY the code for the selected PLAYER_TYPE and PLAYBACK_MODE. Do NOT include code from other branches.
- Include both Java and Kotlin variants where shown.
- Include all XML layout changes.
- Include build.gradle dependency block.
- Include proguard-rules.pro additions.
- Include AndroidManifest.xml additions if SDK_VERSION < 2.0.7.

################################################################
CONSTRAINTS
################################################################

- Linear TV SDK uses AnypointSdk (not FlowerSdk) for initialization.
- Always send initial CHANNEL_CHANGE event after SDK init.
- The SDK is designed for STB environments (Android TV, set-top boxes).
- Choose only ONE dependency path — do not mix.
- AnypointAdView must be positioned between the channel player and TV UI layers.
- For built-in player, no additional code is needed beyond the dependency.
- For custom player, you MUST call the appropriate callbacks (onLoaded, onPlay, onPause, onResume, onStopped) at the correct lifecycle points.
- The ad layer handles its own visibility — no need to toggle visibility manually.
- onPrepare returns boolean: true = ready to play ads, false = reject.
- If onPrepare returns false, SDK fires ERROR_CODE_ON_RESPONSE_FAILED.
- prepareStop is called ~2 seconds before ad ends — use this to prepare seamless transition.
- onStopped is always called after onError.
- Always publish CHANNEL_CHANGE with the service ID when the user changes channels.
- Multiple listeners can be registered on the same AdsManager.
- AnypointSdk.destroy() should be called in Application.onTerminate().
- Do NOT call destroy() in individual Activity/Fragment lifecycle.
- The SDK manages its own ad player lifecycle — do not manually release the built-in player.
- Custom ad player's release() is called by the SDK, not by your application code directly.
```
