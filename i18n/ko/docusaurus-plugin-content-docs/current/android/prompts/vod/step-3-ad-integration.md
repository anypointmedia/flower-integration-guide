---
sidebar_position: 3
---

# Step 3: 광고 연동

이 프롬프트는 LLM이 광고 리스너 등록 및 광고 요청 API 호출을 구현하도록 안내합니다.

**사용 전:** `{{AD_TYPE}}`과 `{{APPROACH}}`를 입력하세요.

```plain
We are integrating the FLOWER SDK into our Android project.
This step implements ad event listening and ad request/playback logic.

AD_TYPE: {{AD_TYPE}}
(linear-tv | vod | interstitial)

APPROACH: {{APPROACH}}
(flower-player | media-player-hook)
Note: For interstitial AD_TYPE, no APPROACH selection is needed.
      "media-player-adapter" — see the MediaPlayerAdapter section at the bottom.

========================================
IMPORTS — Required packages
========================================

FlowerAdsManagerListener and FlowerError are in the sdk-core package:

  import tv.anypoint.flower.sdk.core.api.FlowerAdsManagerListener
  import tv.anypoint.flower.sdk.core.api.FlowerError

All FlowerAdsManagerListener methods have default empty bodies — override only the ones you need.
If you override onAdBreakPrepare, its Kotlin signature is
  override fun onAdBreakPrepare(adInfos: ArrayList<AdInfo>)
with import tv.anypoint.flower.sdk.core.api.AdInfo. There is NO FlowerAdInfo type.

FlowerLinearTvAdConfig, FlowerVodAdConfig, FlowerAdView, FlowerSdk are in the android-sdk package:

  import tv.anypoint.flower.android.sdk.api.FlowerLinearTvAdConfig
  import tv.anypoint.flower.android.sdk.api.FlowerVodAdConfig
  import tv.anypoint.flower.android.sdk.api.FlowerAdView
  import tv.anypoint.flower.android.sdk.api.FlowerSdk

========================================
PART 1 — Implement FlowerAdsManagerListener
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
    the same ad config including prerollAdTagUrl. The viewer does not see the pre-roll again: the
    SDK remembers the channel entered last and skips its pre-roll when that channel is started
    again.
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
  hold it until the temporary listener's first onCompleted()). The SDK skips the pre-roll of the
  channel entered last and reports onCompleted() right after changeChannelUrl() returns.

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
      or reload it. The SDK also rewinds and resumes it; this makes sure it does not stay paused.
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
    player.playWhenReady = true (no seek, no reload). The SDK also rewinds and resumes it before
    it calls onError; this resume is a safety net so the content never stays paused. On a
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
                  // The SDK also rewinds and resumes it; this makes sure it does not stay paused.
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
PART 2 — Request Ads / Start Playback
========================================

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "flower-player":

  Create FlowerLinearTvAdConfig and pass it to setMediaItem().
  Use values from your config/intent data — do NOT hardcode URLs or parameters.
  Omit optional parameters if they are not available in your config.

  Put this in startChannel(), used for the first start, a channel switch, and a restart after
  onError(). A restart uses the same ad config, including prerollAdTagUrl: the SDK remembers the
  channel (channelId) entered last and skips its pre-roll when the same channel is started again.

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
  same parameters, including prerollAdTagUrl. When changeChannelUrl() is called for the channel
  entered last, the SDK skips the pre-roll and reports onCompleted() right after the call returns
  (as for a pre-roll with no ad), so the temporary listener below starts the stream as usual.
  stop() does not clear the remembered channel; requestVodAd() or requestAd() does.

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
  handle onError() the same way. If you track isAdPlaying for PiP (Step 4), also set it in this
  listener (true in onPlay(), false in finish()).

  // Declare as class member, so cleanup (Step 4) can remove it while the pre-roll is pending:
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
  (see PART 1, isContentPrepared). Loading it here makes the content play underneath the pre-roll.
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
MEDIA PLAYER ADAPTER (Advanced — Linear TV only)
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

  Handle the returned URL as in the linear-tv media-player-hook branch above: without a pre-roll,
  load and play it right away; with a pre-roll, load it on the first onCompleted()/onError() of
  the temporary listener. The SDK calls the adapter's pause() when the pre-roll starts and
  resume() when it ends, before the stream is loaded, so both must be safe to call on an empty
  player.

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

========================================
CONSTRAINTS
========================================

- For FlowerPlayer, register listener via player.addAdListener(), NOT flowerAdView.adsManager.addListener().
- For MediaPlayerHook, register listener via flowerAdView.adsManager.addListener().
- For VOD with MediaPlayerHook, you MUST call flowerAdView.adsManager.play() in onPrepare().
- For VOD with MediaPlayerHook, you MUST call flowerAdView.adsManager.notifyContentEnded() when content finishes.
- MediaPlayerAdapter is only available for Linear TV, not for VOD.
- All UI operations in listener callbacks must run on the Main thread.
- For VOD with MediaPlayerHook, do NOT load or play the content before the first onCompleted()/onError(),
  and do NOT resume, seek or reload the content after a completed mid-roll — the SDK does it.
  On a mid-roll onError(), only resume the content (playWhenReady = true; no seek, no reload).
- For Linear TV, on onError() stop the ads manager and the player, then restart the channel
  exactly the way it was first started (a new changeChannelUrl() / setMediaItem with the ad
  config), including prerollAdTagUrl. The SDK skips the pre-roll of the channel entered last, so
  the viewer does not see it again.
- For Linear TV with media-player-hook (or a MediaPlayerAdapter) and a prerollAdTagUrl (first
  start, channel switch, or restart after onError()), do NOT load the URL returned by
  changeChannelUrl() before the pre-roll ends (first onCompleted()/onError() of the temporary
  listener). On a restart the SDK skips the pre-roll and reports onCompleted() right after
  changeChannelUrl() returns.
```
