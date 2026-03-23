---
sidebar_position: 5
---

# Integrated Prompt (All Steps)

This prompt covers the full Flower SDK integration for Android in a single prompt. It contains the complete content from Steps 1–4.

**Before using:** Replace all `{{...}}` placeholders.

```plain
We are integrating the FLOWER SDK into our Android project.
Generate complete integration code for the following configuration:

AD_TYPE: {{AD_TYPE}}
(linear-tv | vod | interstitial)

APPROACH: {{APPROACH}}
(flower-player | media-player-hook)
Note: For interstitial AD_TYPE, no APPROACH selection is needed.

SDK_VERSION: {{SDK_VERSION}}

AD_TAG_URL: {{AD_TAG_URL}}
PREROLL_AD_TAG_URL: {{PREROLL_AD_TAG_URL}} (Optional, for linear-tv only)
CHANNEL_ID or CONTENT_ID: {{CHANNEL_ID_OR_CONTENT_ID}}
CONTENT_DURATION_MS: {{CONTENT_DURATION_MS}} (For VOD only, in milliseconds)

################################################################
# IMPORTS — Required packages
################################################################

FlowerAdsManagerListener and FlowerError are in the sdk-core package:
  import tv.anypoint.flower.sdk.core.api.FlowerAdsManagerListener
  import tv.anypoint.flower.sdk.core.api.FlowerAdInfo
  import tv.anypoint.flower.sdk.core.api.FlowerError

FlowerPlayer wrappers, ad configs, and SDK utilities are in the android-sdk package:
  import tv.anypoint.flower.android.sdk.api.FlowerMedia3ExoPlayer
  import tv.anypoint.flower.android.sdk.api.FlowerExoPlayer2
  import tv.anypoint.flower.android.sdk.api.FlowerBitmovinPlayer
  import tv.anypoint.flower.android.sdk.api.FlowerAdView
  import tv.anypoint.flower.android.sdk.api.FlowerSdk
  import tv.anypoint.flower.android.sdk.api.FlowerLinearTvAdConfig
  import tv.anypoint.flower.android.sdk.api.FlowerVodAdConfig

Use only the imports that match your APPROACH and AD_TYPE.

################################################################
# STEP 1 — PROJECT SETUP & SDK INITIALIZATION
################################################################

========================================
1-1. Add FLOWER SDK Dependency
========================================

Use AnypointMedia's Maven repository:

Repository URL:
https://maven.anypoint.tv/repository/public-release

Support both Kotlin DSL and Groovy DSL.

--------------------------------------------------
If using Kotlin DSL (AGP 8+ preferred in settings.gradle.kts):

dependencyResolutionManagement {
    repositories {
        maven("https://maven.anypoint.tv/repository/public-release")
    }
}

dependencies {
    implementation("flower-sdk:sdk-android-ott:{{SDK_VERSION}}")
}

--------------------------------------------------
If using Groovy DSL:

repositories {
    maven { url "https://maven.anypoint.tv/repository/public-release" }
}

dependencies {
    implementation "flower-sdk:sdk-android-ott:{{SDK_VERSION}}"
}

========================================
1-2. Configure Cleartext Exception (Conditional)
========================================

We must allow cleartext (HTTP) traffic ONLY for:

prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com

----------------------------------------
IMPORTANT LOGIC:
----------------------------------------

1) First, check AndroidManifest.xml:

   - If android:usesCleartextTraffic="true" is already set globally:
       → DO NOT create or modify network_security_config.xml.
       → DO NOT add any domain-specific configuration.
       → Leave existing configuration unchanged.

2) If usesCleartextTraffic is NOT globally true:

   Then check whether a network security config is already defined:

   A) If android:networkSecurityConfig is already present:
        - Locate the referenced XML file.
        - If a <domain-config> exists:
              → Add the domain inside the existing config
                without removing other domains.
        - If no suitable <domain-config> exists:
              → Add a new <domain-config cleartextTrafficPermitted="true">
                block for this domain.
        - Do NOT overwrite unrelated existing security settings.

   B) If no networkSecurityConfig is defined:
        - Create:
          app/src/main/res/xml/network_security_config.xml
        - Add:

<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">
            prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com
        </domain>
    </domain-config>
</network-security-config>

        - Then update AndroidManifest.xml:
            android:networkSecurityConfig="@xml/network_security_config"
            android:usesCleartextTraffic="false"

========================================
1-3. Initialize and Release SDK
========================================

In your Application class, initialize the SDK in onCreate() and release in onTerminate().

Environment modes:
- "local": Local environment, default log level Verbose
- "dev": Development environment, error logs saved to server, default log level Info
- "prod": Production environment, error logs saved to server, default log level Warn

Kotlin:

class YourApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        FlowerSdk.setEnv("local")  // Change to "dev" or "prod" as appropriate
        FlowerSdk.init(this)
    }

    override fun onTerminate() {
        super.onTerminate()
        FlowerSdk.destroy()
    }
}

Java:

public class YourApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        FlowerSdk.setEnv("local");
        FlowerSdk.init(this);
    }

    @Override
    public void onTerminate() {
        super.onTerminate();
        FlowerSdk.destroy();
    }
}

Ensure the Application class is registered in AndroidManifest.xml:

<application android:name=".YourApplication" ...>

################################################################
# STEP 2 — AD UI DECLARATION & PLAYER CREATION
################################################################

========================================
2-1. Declare the Ad UI in Layout XML
========================================

If APPROACH is "flower-player":
    Only a standard player view is needed. FlowerPlayer manages ads internally.
    No separate FlowerAdView required in layout.

    <YourPlayerView
        android:id="@+id/playerView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
    />

If APPROACH is "media-player-hook":
    Add FlowerAdView overlaid on top of the player view.
    FlowerAdView must be placed AFTER the player view so it renders on top.
    Set visibility to "gone" — the SDK controls visibility automatically.

    <FrameLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent">

        <YourPlayerView
            android:id="@+id/playerView"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
        />

        <tv.anypoint.flower.android.sdk.api.FlowerAdView
            android:id="@+id/flowerAdView"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:visibility="gone"
        />
    </FrameLayout>

If AD_TYPE is "interstitial":
    Only FlowerAdView is needed. No video player required.

    <FrameLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent">

        <!-- Your original content -->

        <tv.anypoint.flower.android.sdk.api.FlowerAdView
            android:id="@+id/flowerAdView"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
        />
    </FrameLayout>

========================================
2-2. Create Player Instance (in Activity/Fragment)
========================================

If APPROACH is "flower-player":
    Create a standard ExoPlayer, then wrap it with FlowerExoPlayer2 (or FlowerMedia3ExoPlayer, FlowerBitmovinPlayer).
    The wrapped player is what you assign to your player view.

    Kotlin:
    val exoPlayer = ExoPlayer.Builder(this)
        .setLoadControl(
            DefaultLoadControl.Builder()
                .setBufferDurationsMs(
                    DefaultLoadControl.DEFAULT_MIN_BUFFER_MS,
                    DefaultLoadControl.DEFAULT_MAX_BUFFER_MS,
                    DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_MS,
                    DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS
                )
                .build()
        )
        .build()

    // Wrap with FlowerExoPlayer2
    player = FlowerExoPlayer2(exoPlayer, this)
    playerView.player = player

If APPROACH is "media-player-hook":
    Create a standard ExoPlayer (NOT wrapped). Also get a reference to FlowerAdView.

    Kotlin:
    player = ExoPlayer.Builder(this)
        .setLoadControl(DefaultLoadControl.Builder().build())
        .build()

    playerView.player = player
    flowerAdView = findViewById(R.id.flowerAdView)

If AD_TYPE is "interstitial":
    No player creation needed. Just get a reference to FlowerAdView.

    Kotlin:
    flowerAdView = findViewById(R.id.flowerAdView)

################################################################
# STEP 3 — AD LISTENER & AD REQUEST
################################################################

========================================
3-1. Implement FlowerAdsManagerListener
========================================

The listener handles ad lifecycle events. Implementation differs by AD_TYPE.

IMPORTANT: Store the listener as a class-level member variable (not a local variable),
because it is needed later for cleanup in onDestroy (removeAdListener / removeListener).

--------------------------------------------------
If AD_TYPE is "linear-tv":

For FlowerPlayer:
  - onPlay: Hide player controls (playerView.useController = false).
  - onCompleted: Show player controls (playerView.useController = true).
  - onError: Handle gracefully (e.g., log the error).

  Kotlin (FlowerPlayer):
  // Declare as class member:
  private lateinit var flowerAdsManagerListener: FlowerAdsManagerListener

  // In your playContent() method:
  flowerAdsManagerListener = object : FlowerAdsManagerListener {
      override fun onPlay() {
          CoroutineScope(Dispatchers.Main).launch {
              playerView.useController = false
          }
      }
      override fun onCompleted() {
          CoroutineScope(Dispatchers.Main).launch {
              playerView.useController = true
          }
      }
      override fun onError(error: FlowerError?) {
          // Handle error
      }
  }
  player.addAdListener(flowerAdsManagerListener)

For MediaPlayerHook:
  Same listener logic, but register on flowerAdView.adsManager:

  flowerAdView.adsManager.addListener(adsManagerListener)

--------------------------------------------------
If AD_TYPE is "vod":

For FlowerPlayer:
  - onPlay: Hide player controls (playerView.useController = false).
  - onCompleted: Show player controls (playerView.useController = true).
  - onError: Handle gracefully.

  Kotlin (FlowerPlayer):
  // Declare as class member:
  private lateinit var flowerAdsManagerListener: FlowerAdsManagerListener

  // In your playContent() method:
  flowerAdsManagerListener = object : FlowerAdsManagerListener {
      override fun onPlay() {
          CoroutineScope(Dispatchers.Main).launch {
              playerView.useController = false
          }
      }
      override fun onCompleted() {
          CoroutineScope(Dispatchers.Main).launch {
              playerView.useController = true
          }
      }
      override fun onError(error: FlowerError?) {
          // Handle error
      }
  }
  player.addAdListener(flowerAdsManagerListener)

For MediaPlayerHook:
  VOD requires active content pause/resume in the listener.
  - onPrepare: Call flowerAdView.adsManager.play() to start the ad.
  - onPlay: Pause content player (player.playWhenReady = false).
  - onCompleted: Resume content player (player.playWhenReady = true) if content not ended.
  - onError: Resume content player if content not ended.

  Kotlin (MediaPlayerHook):
  // Declare as class members:
  private lateinit var flowerAdsManagerListener: FlowerAdsManagerListener
  private var isContentEnd = false

  // In your playContent() method:
  flowerAdsManagerListener = object : FlowerAdsManagerListener {
      override fun onPrepare(adDurationMs: Int) {
          CoroutineScope(Dispatchers.Main).launch {
              if (player.isPlaying) {
                  showNotification("Ads will start in a moment.")
                  delay(5000)
                  flowerAdView.adsManager.play()
              } else {
                  flowerAdView.adsManager.play()
              }
          }
      }
      override fun onPlay() {
          CoroutineScope(Dispatchers.Main).launch {
              player.playWhenReady = false
          }
      }
      override fun onCompleted() {
          CoroutineScope(Dispatchers.Main).launch {
              if (!isContentEnd) { player.playWhenReady = true }
          }
      }
      override fun onError(error: FlowerError?) {
          CoroutineScope(Dispatchers.Main).launch {
              if (!isContentEnd) { player.playWhenReady = true }
          }
      }
      override fun onAdSkipped(reason: Int) {}
      override fun onAdBreakPrepare(adInfos: List<FlowerAdInfo>) {}
  }
  flowerAdView.adsManager.addListener(flowerAdsManagerListener)

  Also detect content end to trigger post-roll:
  player.addListener(object : Player.Listener {
      override fun onPlaybackStateChanged(playbackState: Int) {
          if (playbackState == Player.STATE_ENDED) {
              isContentEnd = true
              flowerAdView.adsManager.notifyContentEnded()
          }
      }
  })

--------------------------------------------------
If AD_TYPE is "interstitial":

  - onPrepare: Call flowerAdView.adsManager.play() to start the ad.
  - onPlay: No action needed.
  - onCompleted: Call stop() and removeListener() to clean up.
  - onError: Call stop() and removeListener() to clean up.

  Kotlin:
  // Declare as class member:
  private lateinit var flowerAdsManagerListener: FlowerAdsManagerListener

  // In your requestAd() method:
  flowerAdsManagerListener = object : FlowerAdsManagerListener {
      override fun onPrepare(adDurationMs: Int) {
          CoroutineScope(Dispatchers.Main).launch {
              flowerAdView.adsManager.play()
          }
      }
      override fun onCompleted() {
          CoroutineScope(Dispatchers.Main).launch {
              flowerAdView.adsManager.stop()
              flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
          }
      }
      override fun onError(error: FlowerError?) {
          CoroutineScope(Dispatchers.Main).launch {
              flowerAdView.adsManager.stop()
              flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
          }
      }
      override fun onAdBreakPrepare(adInfos: List<FlowerAdInfo>) {}
  }
  flowerAdView.adsManager.addListener(flowerAdsManagerListener)

========================================
3-2. Request Ads / Start Playback
========================================

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "flower-player":

  Create FlowerLinearTvAdConfig and pass it to setMediaItem().
  Use values from your config/intent data — do NOT hardcode URLs or parameters.
  Omit optional parameters if they are not available.

  val adConfig = FlowerLinearTvAdConfig(
      adTagUrl = config.adTagUrl,                     // Required
      channelId = config.channelId,                   // Required
      extraParams = config.extraParams,               // Required (targeting info)
      prerollAdTagUrl = config.prerollAdTagUrl,       // Optional — omit if not available
      // adTagHeaders = mapOf(...),                   // Optional — omit if not needed
      // channelStreamHeaders = mapOf(...),           // Optional — omit if not needed
  )

  player.setMediaItem(MediaItem.fromUri(Uri.parse(config.contentUrl)), adConfig)
  player.prepare()
  player.playWhenReady = true

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "media-player-hook":

  Call changeChannelUrl() to get a modified URL, then play it:

  val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
      "https://original_stream_url",    // videoUrl
      "{{AD_TAG_URL}}",                 // adTagUrl
      "{{CHANNEL_ID_OR_CONTENT_ID}}",                         // channelId
      mapOf("custom-param" to "value"), // extraParams
      { player },                       // mediaPlayerHook (lambda returning player)
      mapOf("ad-header" to "value"),    // adTagHeaders (Optional)
      mapOf("stream-header" to "value"),// channelStreamHeaders (Optional)
      "{{PREROLL_AD_TAG_URL}}"          // prerollAdTagUrl (Optional)
  )

  player.setMediaItem(MediaItem.fromUri(changedChannelUrl))
  player.prepare()
  player.playWhenReady = true

--------------------------------------------------
If AD_TYPE is "vod" AND APPROACH is "flower-player":

  Create FlowerVodAdConfig and pass it to setMediaItem():

  val adConfig = FlowerVodAdConfig(
      adTagUrl = "{{AD_TAG_URL}}",
      contentId = "{{CHANNEL_ID_OR_CONTENT_ID}}",
      contentDuration = {{CONTENT_DURATION_MS}},     // Duration in ms
      requestTimeout = 5_000L,            // Optional, default 5000
      minPrepareDuration = 5_000L,        // Optional, default 5000
      extraParams = mapOf("title" to "...", "genre" to "..."),
      adTagHeaders = mapOf("custom-ad-header" to "value"),
  )

  val mediaItem = MediaItem.fromUri(videoUrl)
  player.setMediaItem(mediaItem, adConfig)
  player.prepare()
  player.play()

--------------------------------------------------
If AD_TYPE is "vod" AND APPROACH is "media-player-hook":

  Call requestVodAd() then start content playback:

  flowerAdView.adsManager.requestVodAd(
      adTagUrl = "{{AD_TAG_URL}}",
      contentId = "{{CHANNEL_ID_OR_CONTENT_ID}}",
      durationMs = {{CONTENT_DURATION_MS}},
      extraParams = mapOf("custom-param" to "value"),
      mediaPlayerHook = { player },
      adTagHeaders = mapOf("ad-header" to "value"),
  )

  player.setMediaItem(MediaItem.fromUri(videoUrl))
  player.prepare()
  player.playWhenReady = true

--------------------------------------------------
If AD_TYPE is "interstitial":

  Call requestAd() — no player needed:

  flowerAdView.adsManager.requestAd(
      "{{AD_TAG_URL}}",
      mapOf("custom-param" to "value"),
      mapOf("ad-header" to "value")
  )

========================================
3-3. MediaPlayerAdapter (Advanced — Linear TV only)
========================================

If using an unsupported player, implement MediaPlayerAdapter instead of MediaPlayerHook.
Pass the adapter to changeChannelUrl() overload:

  val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
      "https://original_stream_url",
      "{{AD_TAG_URL}}",
      "{{CHANNEL_ID_OR_CONTENT_ID}}",
      mapOf("custom-param" to "value"),
      myMediaPlayerAdapter,              // MediaPlayerAdapter instead of MediaPlayerHook
      mapOf("ad-header" to "value"),
      mapOf("stream-header" to "value"),
      "{{PREROLL_AD_TAG_URL}}"
  )

MediaPlayerAdapter must implement these methods:
  getCurrentMedia() -> Media (urlOrId, duration, position)
  getVolume() -> Float
  isPlaying() -> Boolean
  getHeight() -> Int
  pause()
  stop()
  resume()
  enqueuePlayItem(playItem: PlayItem)
  removePlayItem(playItem: PlayItem)
  playNextItem()
  seekToPosition(absoluteStartTimeMs, relativeStartTimeMs, offsetMs, windowDurationMs, periodIndex)
  getCurrentAbsoluteTime(isPrintDetails: Boolean) -> Double
  getPlayerType() -> String?
  getPlayerVersion() -> String?

################################################################
# STEP 4 — CLEANUP, RELEASE & EXTRAS
################################################################

========================================
4-1. Cleanup on Activity Destroy
========================================

If APPROACH is "flower-player":

  override fun onDestroy() {
      super.onDestroy()
      player.stop()
      player.removeAdListener(flowerAdsManagerListener)
      player.release()
  }

If APPROACH is "media-player-hook":

  override fun onDestroy() {
      super.onDestroy()
      flowerAdView.adsManager.removeListener(adsManagerListener)
      flowerAdView.adsManager.stop()
      player.release()
  }

If AD_TYPE is "interstitial":

  override fun onDestroy() {
      super.onDestroy()
      flowerAdView.adsManager.removeListener(adsManagerListener)
      flowerAdView.adsManager.stop()
  }

========================================
4-2. Pause on Activity Pause (Optional)
========================================

For media playback Activities, stop or pause the player in onPause:

  override fun onPause() {
      super.onPause()
      player.stop()  // or player.pause() for VOD
  }

========================================
4-3. Picture-in-Picture Support (Optional, SDK 2.8.0+)
========================================

1. Enter PiP mode when user leaves the Activity:

  Kotlin:
  override fun onUserLeaveHint() {
      super.onUserLeaveHint()
      val params = PictureInPictureParams.Builder()
          .setAspectRatio(Rational(16, 9))
          .build()
      enterPictureInPictureMode(params)
  }

2. Notify the SDK about PiP state changes and toggle player controls:

  Kotlin:
  override fun onPictureInPictureModeChanged(
      isInPictureInPictureMode: Boolean,
      newConfig: Configuration?
  ) {
      super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
      playerView.useController = !isInPictureInPictureMode
      FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode)
  }

  Java:
  @Override
  public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, Configuration newConfig) {
      super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
      FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode);
  }
3. AndroidManifest.xml — enable PiP for the Activity:

  <activity
      android:name=".PlaybackActivity"
      android:supportsPictureInPicture="true"
      android:configChanges="screenSize|smallestScreenSize|screenLayout|orientation"
  />

========================================
4-4. VOD Playback State Control (MediaPlayerHook only)
========================================

When using MediaPlayerHook for VOD, notify the SDK about playback state changes:

  // When user pauses content
  fun onUserPause() {
      player.playWhenReady = false
      flowerAdView.adsManager.pause()
  }

  // When user resumes content
  fun onUserResume() {
      player.playWhenReady = true
      flowerAdView.adsManager.resume()
  }

  // When exiting VOD content
  fun onVodExit() {
      flowerAdView.adsManager.stop()
  }

################################################################
# OUTPUT REQUIREMENTS
################################################################

Generate the following files:
1. Application class with SDK init/release
2. Activity/Fragment with complete ad integration (listener + ad request + playback)
3. Layout XML with proper view hierarchy
4. Any necessary config changes (network_security_config.xml, AndroidManifest.xml)

Use Kotlin unless otherwise specified.
Follow Android best practices for lifecycle management.
All ad listener callbacks must execute on the Main thread.
Generate ONLY the code for the selected AD_TYPE and APPROACH. Do NOT include code from other branches.

################################################################
# CONSTRAINTS
################################################################

- Do NOT enable global cleartext traffic unless it is already enabled.
- Do NOT remove existing domain configurations or security rules.
- FlowerAdView must have android:visibility="gone" in XML when used with media-player-hook.
- For flower-player, always pass the Activity context as the second argument to FlowerExoPlayer2/FlowerMedia3ExoPlayer.
- Supported FlowerPlayer types: FlowerExoPlayer2, FlowerMedia3ExoPlayer, FlowerBitmovinPlayer.
- For FlowerPlayer, register listener via player.addAdListener(), NOT flowerAdView.adsManager.addListener().
- For MediaPlayerHook, register listener via flowerAdView.adsManager.addListener().
- For VOD with MediaPlayerHook, you MUST call flowerAdView.adsManager.play() in onPrepare().
- For VOD with MediaPlayerHook, you MUST call flowerAdView.adsManager.notifyContentEnded() when content finishes.
- MediaPlayerAdapter is only available for Linear TV, not for VOD.
- Always remove the ad listener BEFORE releasing the player.
- FlowerSdk.destroy() should only be called in Application.onTerminate(), NOT in Activity.onDestroy().
- PiP notification is only needed for MediaPlayerHook approach with overlay ads.
```
