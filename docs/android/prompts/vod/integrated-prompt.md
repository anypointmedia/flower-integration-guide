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

################################################################
# IMPORTS — Required packages
################################################################

FlowerAdsManagerListener and FlowerError are in the sdk-core package:
  import tv.anypoint.flower.sdk.core.api.FlowerAdsManagerListener
  import tv.anypoint.flower.sdk.core.api.FlowerError

All FlowerAdsManagerListener methods have default empty bodies — override only the ones you need.
If you override onAdBreakPrepare, its Kotlin signature is
  override fun onAdBreakPrepare(adInfos: ArrayList<AdInfo>)
with import tv.anypoint.flower.sdk.core.api.AdInfo. There is NO FlowerAdInfo type.

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

Use AnypointMedia's Maven repository. Google's Maven repository and JitPack are also required,
because part of the SDK's transitive dependencies are resolved from them.

Repository URLs:
https://maven.anypoint.tv/repository/public-release
https://jitpack.io
google() (Google Maven repository)

Support both Kotlin DSL and Groovy DSL.

--------------------------------------------------
If using Kotlin DSL (AGP 8+ preferred in settings.gradle.kts):

dependencyResolutionManagement {
    repositories {
        google()
        maven("https://maven.anypoint.tv/repository/public-release")
        maven("https://jitpack.io")
    }
}

dependencies {
    implementation("flower-sdk:sdk-android-ott:{{SDK_VERSION}}")

    // Add ONLY if APPROACH=flower-player and the project uses FlowerMedia3ExoPlayer.
    // Supported androidx.media3 versions: 1.2.1 and above.
    // The companion artifact depends on sdk-android-ott, so add both together.
    // Pick the artifact whose version exactly matches the app's androidx.media3 version (>= 1.2.1):
    //   androidx.media3 1.10.1 -> sdk-android-ott-media3-1.10.1
    // For androidx.media3 versions below 1.2.1, contact dev-support@anypointmedia.com.
    // implementation("flower-sdk:sdk-android-ott-media3-1.10.1:{{SDK_VERSION}}")
}

--------------------------------------------------
If using Groovy DSL:

repositories {
    google()
    maven { url "https://maven.anypoint.tv/repository/public-release" }
    maven { url "https://jitpack.io" }
}

dependencies {
    implementation "flower-sdk:sdk-android-ott:{{SDK_VERSION}}"

    // Add ONLY if APPROACH=flower-player and the project uses FlowerMedia3ExoPlayer.
    // Supported androidx.media3 versions: 1.2.1 and above.
    // The companion artifact depends on sdk-android-ott, so add both together.
    // Pick the artifact whose version exactly matches the app's androidx.media3 version (>= 1.2.1):
    //   androidx.media3 1.10.1 -> sdk-android-ott-media3-1.10.1
    // For androidx.media3 versions below 1.2.1, contact dev-support@anypointmedia.com.
    // implementation "flower-sdk:sdk-android-ott-media3-1.10.1:{{SDK_VERSION}}"
}

NOTE on the Media3 companion artifact (sdk-android-ott-media3-*):
- The core sdk-android-ott artifact is always required.
- The sdk-android-ott-media3-* artifact is REQUIRED ONLY when using FlowerMedia3ExoPlayer.
  It depends on sdk-android-ott, so both artifacts must be added together.
- It is NOT needed for FlowerExoPlayer2 (legacy ExoPlayer) or FlowerBitmovinPlayer.
- Supported androidx.media3 versions: 1.2.1 and above.
- Inspect the project's androidx.media3 version (e.g., in libs.versions.toml or
  build.gradle dependencies) and pick the exact same companion artifact version
  for any registered version 1.2.1 or above:
    androidx.media3 1.10.1 -> flower-sdk:sdk-android-ott-media3-1.10.1
- The companion artifact's version is the FLOWER SDK version ({{SDK_VERSION}}),
  not the androidx.media3 version.
- If the project uses an androidx.media3 version not covered above (e.g., below 1.2.1),
  instruct the user to contact dev-support@anypointmedia.com instead of guessing
  an artifact to add.

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
  - onError: On the main thread, stop the SDK ads manager and the player, then start the channel
    again exactly as it was first started (the 3-2 code, e.g. in a startChannel() function), with
    the same ad config including prerollAdTagUrl. The viewer does not see the pre-roll again: if
    the channel has not changed, the pre-roll is skipped.
    FlowerExoPlayer2 / FlowerMedia3ExoPlayer: player.stop() also stops the ads manager.
    FlowerBitmovinPlayer has no stop(): call player.flowerAdView.adsManager.stop() and
    player.unload() instead. Optionally cap consecutive restarts (e.g., 3) to avoid a restart loop.

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
          CoroutineScope(Dispatchers.Main).launch {
              player.stop()     // also stops the SDK ads manager
              startChannel()   // the 3-2 code, same ad config: setMediaItem(mediaItem, adConfig), prepare, play
          }
      }
  }
  player.addAdListener(flowerAdsManagerListener)

For MediaPlayerHook:
  Same listener logic, but register on flowerAdView.adsManager, and in onError stop the ads
  manager yourself before restarting. Restart with a NEW changeChannelUrl() call (the 3-2 code);
  do not reuse the URL returned before stop(). Pass the same parameters, including
  prerollAdTagUrl, and handle the returned URL the same way as the first start (with a pre-roll,
  hold it until the temporary listener's first onCompleted()). Without a channel change, the SDK
  skips the pre-roll and reports onCompleted() right after changeChannelUrl() returns.

  flowerAdView.adsManager.addListener(flowerAdsManagerListener)

  override fun onError(error: FlowerError?) {
      CoroutineScope(Dispatchers.Main).launch {
          flowerAdView.adsManager.stop()
          player.stop()
          startChannel()   // the 3-2 code, same parameters: changeChannelUrl(...), then load and play
      }
  }

--------------------------------------------------
If AD_TYPE is "vod":

For FlowerPlayer:
  - onPlay: Hide player controls (playerView.useController = false).
  - onCompleted: Show player controls (playerView.useController = true). The FIRST call means
    the pre-roll phase is over; the Flower Player starts the content by itself.
  - onError (on the main thread):
    - Pre-roll error (isContentStarted == false): the Flower Player does NOT start the content.
      Start it without ads: player.stop() (also stops the SDK ads manager), then
      player.setMediaItem(MediaItem.fromUri(...)) with NO ad config, prepare(), play().
      FlowerBitmovinPlayer: destroy it, create a new one, and load the source without an ad config.
    - Mid-roll error (isContentEnd == false): resume the content with player.play(). Do NOT seek
      or reload it. The content is normally already playing again; resuming is a harmless safety net.
    - Post-roll error (isContentEnd == true): do NOT resume; run the end-of-playback scenario.
    Set isContentEnd = true when the content ends (Player.STATE_ENDED).

  Kotlin (FlowerPlayer):
  // Declare as class members:
  private lateinit var flowerAdsManagerListener: FlowerAdsManagerListener
  private var isContentStarted = false
  private var isContentEnd = false

  // In your playContent() method:
  flowerAdsManagerListener = object : FlowerAdsManagerListener {
      override fun onPlay() {
          CoroutineScope(Dispatchers.Main).launch {
              playerView.useController = false
          }
      }
      override fun onCompleted() {
          CoroutineScope(Dispatchers.Main).launch {
              isContentStarted = true   // first call = pre-roll phase over
              playerView.useController = true
          }
      }
      override fun onError(error: FlowerError?) {
          CoroutineScope(Dispatchers.Main).launch {
              if (!isContentStarted) {
                  // Pre-roll failed: start the content without ads.
                  isContentStarted = true
                  player.stop()
                  player.setMediaItem(MediaItem.fromUri(Uri.parse(config.contentUrl)))
                  player.prepare()
                  player.play()
              } else if (!isContentEnd) {
                  // Mid-roll failed: resume the content (no seek, no reload).
                  player.play()
              }
              // Post-roll failed: the content has ended - do not resume.
          }
      }
  }
  player.addAdListener(flowerAdsManagerListener)

For MediaPlayerHook:
  By default the SDK plays VOD ads in its own ad player over the content. For a mid-roll it
  pauses the content itself and, after the break, rewinds it by rewindDuration (5s) and
  resumes it. Do NOT pause, seek or reload the content around a VOD ad break. The only
  exception is onError for a mid-roll: resume the content (no seek, no reload).
  - onPrepare: Call flowerAdView.adsManager.play() right away (a mid-roll's onPrepare
    arrives when the content reaches the mid-roll position). Do NOT delay it.
  - onPlay: Do NOT pause the content player.
  - onCompleted / onError: The FIRST call means the pre-roll is over. The SDK also calls
    onCompleted when there is no pre-roll, the ad response has no ad breaks, or the ad request
    fails, so it always arrives. Load and start the content ONLY on that first call
    (isContentPrepared == false).
  - onCompleted after that: after a mid-roll, do nothing: the SDK has already rewound and
    resumed the content. After a post-roll, the content has ended: run the end-of-playback scenario.
  - onError after that: on a mid-roll error (isContentEnd == false), resume the content with
    player.playWhenReady = true (no seek, no reload). The content is normally already playing
    again; resuming is a harmless safety net. On a
    post-roll error (isContentEnd == true), do NOT resume; run the end-of-playback scenario.

  Kotlin (MediaPlayerHook):
  // Declare as class members:
  private lateinit var flowerAdsManagerListener: FlowerAdsManagerListener
  private var isContentPrepared = false
  private var isContentEnd = false

  // In your playContent() method:
  flowerAdsManagerListener = object : FlowerAdsManagerListener {
      override fun onPrepare(adDurationMs: Int) {
          CoroutineScope(Dispatchers.Main).launch {
              flowerAdView.adsManager.play()
          }
      }
      override fun onPlay() {
          // Do NOT pause the player here - the SDK pauses and resumes the content itself.
      }
      override fun onCompleted() {
          CoroutineScope(Dispatchers.Main).launch {
              if (!isContentPrepared) {
                  // Pre-roll finished (or no pre-roll was served): load and start the content.
                  isContentPrepared = true
                  player.setMediaItem(MediaItem.fromUri(Uri.parse(config.contentUrl)))
                  player.prepare()
                  player.playWhenReady = true
              }
              // After a mid-roll: nothing to do - the SDK resumes the content itself.
          }
      }
      override fun onError(error: FlowerError?) {
          CoroutineScope(Dispatchers.Main).launch {
              if (!isContentPrepared) {
                  isContentPrepared = true
                  player.setMediaItem(MediaItem.fromUri(Uri.parse(config.contentUrl)))
                  player.prepare()
                  player.playWhenReady = true
              } else if (!isContentEnd) {
                  // Mid-roll failed: resume the content (no seek, no reload).
                  // The content is normally already playing again; this is a harmless safety net.
                  player.playWhenReady = true
              }
              // Post-roll failed: the content has ended - do not resume.
          }
      }
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

  Put this in startChannel(), used for the first start, a channel switch, and a restart after
  onError(). A restart uses the same ad config, including prerollAdTagUrl: if the channel has not
  changed, the pre-roll is skipped. A -> B -> A plays A's pre-roll again.

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

  Call changeChannelUrl() to get a modified URL, then play it: right away without a pre-roll,
  or after the pre-roll ends when prerollAdTagUrl is set.
  Use values from your config/intent data — do NOT hardcode URLs or parameters.
  Put this in startChannel(), as above: a restart after onError() runs the same code with the
  same parameters, including prerollAdTagUrl. When changeChannelUrl() is called again without a
  channel change, the SDK skips the pre-roll and reports onCompleted() right after the call returns
  (as for a pre-roll with no ad), so the temporary listener below starts the stream as usual.
  stop() is not a channel change; requestVodAd() or requestAd() is.

  // A pre-roll stopped by a channel switch reports nothing: drop its temporary listener first.
  prerollListener?.let { flowerAdView.adsManager.removeListener(it) }
  prerollListener = null
  flowerAdView.adsManager.addListener(flowerAdsManagerListener)   // listeners are a set: no duplicate

  val prerollAdTagUrl = config.prerollAdTagUrl
  val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
      videoUrl = config.contentUrl,                   // Required
      adTagUrl = config.adTagUrl,                     // Required
      channelId = config.channelId,                   // Required
      extraParams = config.extraParams,               // Required
      mediaPlayerHook = { player },                   // Required (lambda returning player)
      adTagHeaders = null,                            // Optional
      channelStreamHeaders = null,                    // Optional
      prerollAdTagUrl = prerollAdTagUrl,              // Optional; the same on a restart
  )

  fun playStream() {
      player.setMediaItem(MediaItem.fromUri(Uri.parse(changedChannelUrl)))
      player.prepare()
      player.playWhenReady = true
  }

  prerollAdTagUrl == null (no pre-roll configured):
  play the returned URL right away and keep the main listener registered.

      playStream()

  prerollAdTagUrl != null (a pre-roll configured: first start, channel switch, or restart):
  The SDK requests the pre-roll and plays it in its own ad player. Do NOT load changedChannelUrl
  yet: loading it now makes the channel play underneath the pre-roll. Swap the main listener for
  a temporary one and load the stream on its FIRST onCompleted()/onError(). The SDK reports the
  end of the pre-roll with onCompleted(), also when there is no pre-roll ad or the pre-roll fails;
  handle onError() the same way. If you track isAdPlaying for PiP (4-3), also set it in this
  listener (true in onPlay(), false in finish()).

  // Declare as class member, so cleanup (4-1) can remove it while the pre-roll is pending:
  private var prerollListener: FlowerAdsManagerListener? = null

      flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
      val listener = object : FlowerAdsManagerListener {
          override fun onCompleted() { CoroutineScope(Dispatchers.Main).launch { finish() } }
          override fun onError(error: FlowerError?) { CoroutineScope(Dispatchers.Main).launch { finish() } }
          private fun finish() {
              if (prerollListener !== this) return    // only the first call starts the stream
              playStream()
              flowerAdView.adsManager.removeListener(this)
              flowerAdView.adsManager.addListener(flowerAdsManagerListener)
              prerollListener = null
          }
      }
      prerollListener = listener
      flowerAdView.adsManager.addListener(listener)

--------------------------------------------------
If AD_TYPE is "vod" AND APPROACH is "flower-player":

  Create FlowerVodAdConfig and pass it to setMediaItem().
  Use values from your config/intent data — do NOT hardcode URLs or parameters.

  val adConfig = FlowerVodAdConfig(
      adTagUrl = config.adTagUrl,                     // Required
      contentId = config.contentId,                   // Required
      contentDuration = config.contentDuration,       // Required (ms)
      extraParams = config.extraParams,               // Required (targeting info)
      // requestTimeout = 5_000L,                     // Optional, default 5000
      // minPrepareDuration = 5_000L,                 // Optional, default 5000
      // rewindDuration = 5_000L,                     // Optional, default 5000
      // adTagHeaders = mapOf(...),                   // Optional — omit if not needed
  )

  player.setMediaItem(MediaItem.fromUri(Uri.parse(config.contentUrl)), adConfig)
  player.prepare()
  player.playWhenReady = true

--------------------------------------------------
If AD_TYPE is "vod" AND APPROACH is "media-player-hook":

  Call requestVodAd() only. Do NOT load or start the content here: the content is loaded and
  started in onCompleted()/onError() of the listener above, after the pre-roll
  (see 3-1, isContentPrepared). Loading it here makes the content play underneath the pre-roll.
  The player instance must already exist, because mediaPlayerHook.getPlayer() must not return null.
  Use values from your config/intent data — do NOT hardcode URLs or parameters.
  Keep the named argument mediaPlayerHook = { player } so the MediaPlayerHook overload is used.

  flowerAdView.adsManager.requestVodAd(
      adTagUrl = config.adTagUrl,                     // Required
      contentId = config.contentId,                   // Required
      durationMs = config.contentDuration,            // Required (ms)
      extraParams = config.extraParams,               // Required
      mediaPlayerHook = { player },                   // Required
      // adTagHeaders = mapOf(...),                   // Optional — omit if not needed
  )

--------------------------------------------------
If AD_TYPE is "interstitial":

  Call requestAd() — no player needed.
  Use values from your config/intent data — do NOT hardcode URLs or parameters.

  flowerAdView.adsManager.requestAd(
      config.adTagUrl,                                // Required
      config.extraParams,                             // Required (or emptyMap())
      config.adTagHeaders ?: emptyMap(),              // Optional
  )

========================================
3-3. MediaPlayerAdapter (Advanced — Linear TV only)
========================================

If using an unsupported player, implement MediaPlayerAdapter instead of MediaPlayerHook.
Pass the adapter to changeChannelUrl() overload.
Use values from your config/intent data — do NOT hardcode URLs or parameters.

  val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
      config.contentUrl,                  // videoUrl
      config.adTagUrl,                    // adTagUrl
      config.channelId,                   // channelId
      config.extraParams,                 // extraParams
      myMediaPlayerAdapter,               // MediaPlayerAdapter instead of MediaPlayerHook
      null,                               // adTagHeaders (Optional)
      null,                               // channelStreamHeaders (Optional)
      config.prerollAdTagUrl              // prerollAdTagUrl (Optional; the same on a restart)
  )

  Handle the returned URL as in the media-player-hook branch of 3-2: without a pre-roll, load
  and play it right away; with a pre-roll, load it on the first onCompleted()/onError() of the
  temporary listener. The SDK calls the adapter's pause() when the pre-roll starts and resume()
  when it ends, before the stream is loaded, so both must be safe to call on an empty player.

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
      flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
      prerollListener?.let { flowerAdView.adsManager.removeListener(it) }   // linear-tv: pre-roll still pending
      flowerAdView.adsManager.stop()
      player.release()
  }

If AD_TYPE is "interstitial":

  override fun onDestroy() {
      super.onDestroy()
      flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
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

1. Notify the SDK when the user leaves the Activity, then enter PiP mode — but NOT while an ad
   is playing (PiP could otherwise be used to bypass the ad). Report the user leaving whether or
   not the app enters PiP: during an ad the app does not enter PiP, so a report sent only on PiP
   changes would never tell the SDK that the user left. Track the ad state in the same
   FlowerAdsManagerListener you registered in 3-1: set isAdPlaying = true in onPlay(),
   and isAdPlaying = false in onCompleted() and onError(). For linear-tv with media-player-hook
   and a pre-roll, set it in the temporary pre-roll listener of 3-2 as well.
   enterPictureInPictureMode(PictureInPictureParams) requires API 26 and the Flower SDK
   supports lower API levels, so check the API level.

  Kotlin:
  private var isAdPlaying = false   // set in onPlay, cleared in onCompleted / onError

  override fun onUserLeaveHint() {
      super.onUserLeaveHint()
      FlowerSdk.notifyUserLeftApp(true)   // always, before deciding on PiP
      if (isAdPlaying) return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          val params = PictureInPictureParams.Builder()
              .setAspectRatio(Rational(16, 9))
              .build()
          enterPictureInPictureMode(params)
      }
  }

  Do NOT enable PictureInPictureParams.Builder().setAutoEnterEnabled(true) (API 31) while an
  ad is playing, for the same reason.

2. Notify the SDK when the user comes back (the Activity resumes, including when the PiP window
   is expanded back to full screen), and toggle player controls on PiP changes.
   FlowerSdk.notifyPictureInPictureModeChanged() is deprecated and replaced by notifyUserLeftApp().
   Existing calls keep working; use notifyUserLeftApp() in this integration.

  Kotlin:
  override fun onResume() {
      super.onResume()
      FlowerSdk.notifyUserLeftApp(false)
  }

  override fun onPictureInPictureModeChanged(
      isInPictureInPictureMode: Boolean,
      newConfig: Configuration?
  ) {
      super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
      playerView.useController = !isInPictureInPictureMode
  }

  Java:
  @Override
  protected void onUserLeaveHint() {
      super.onUserLeaveHint();
      FlowerSdk.notifyUserLeftApp(true);   // always, before deciding on PiP
      // then enter PiP only if no ad is playing, as in 1.
  }

  @Override
  protected void onResume() {
      super.onResume();
      FlowerSdk.notifyUserLeftApp(false);
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
- If the app supports PiP, call FlowerSdk.notifyUserLeftApp(true) when the user leaves the app and
  FlowerSdk.notifyUserLeftApp(false) when the user comes back, with every APPROACH and whether or
  not the app enters PiP — the SDK does not detect this by itself.
- Do NOT enter PiP while an ad is playing, and check Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
  before calling enterPictureInPictureMode(PictureInPictureParams).
- For VOD with MediaPlayerHook, do NOT load or play the content before the first onCompleted()/onError(),
  and do NOT resume, seek or reload the content after a completed mid-roll — the SDK does it.
  On a mid-roll onError(), only resume the content (playWhenReady = true; no seek, no reload).
- For Linear TV, on onError() stop the ads manager and the player, then restart the channel
  exactly the way it was first started (a new changeChannelUrl() / setMediaItem with the ad
  config), including prerollAdTagUrl. Without a channel change, the SDK skips the pre-roll, so
  the viewer does not see it again.
- For Linear TV with media-player-hook (or a MediaPlayerAdapter) and a prerollAdTagUrl (first
  start, channel switch, or restart after onError()), do NOT load the URL returned by
  changeChannelUrl() before the pre-roll ends (first onCompleted()/onError() of the temporary
  listener). On a restart the SDK skips the pre-roll and reports onCompleted() right after
  changeChannelUrl() returns.
```
