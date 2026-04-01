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
  import tv.anypoint.flower.sdk.core.api.FlowerAdInfo
  import tv.anypoint.flower.sdk.core.api.FlowerError

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

  flowerAdView.adsManager.addListener(flowerAdsManagerListener)

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
      override fun onAdBreakPrepare(adInfos: List<FlowerAdInfo>) {} // called after ads loaded with ad info list
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
      override fun onAdBreakPrepare(adInfos: List<FlowerAdInfo>) {} // called after ads loaded with ad info list
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

  Call changeChannelUrl() to get a modified URL, then play it.
  Use values from your config/intent data — do NOT hardcode URLs or parameters.

  val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
      videoUrl = config.contentUrl,                   // Required
      adTagUrl = config.adTagUrl,                     // Required
      channelId = config.channelId,                   // Required
      extraParams = config.extraParams,               // Required
      mediaPlayerHook = { player },                   // Required (lambda returning player)
      adTagHeaders = null,                            // Optional
      channelStreamHeaders = null,                    // Optional
      prerollAdTagUrl = config.prerollAdTagUrl,       // Optional
  )

  player.setMediaItem(MediaItem.fromUri(Uri.parse(changedChannelUrl)))
  player.prepare()
  player.playWhenReady = true

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
      // adTagHeaders = mapOf(...),                   // Optional — omit if not needed
  )

  player.setMediaItem(MediaItem.fromUri(Uri.parse(config.contentUrl)), adConfig)
  player.prepare()
  player.playWhenReady = true

--------------------------------------------------
If AD_TYPE is "vod" AND APPROACH is "media-player-hook":

  Call requestVodAd() then start content playback.
  Use values from your config/intent data — do NOT hardcode URLs or parameters.

  flowerAdView.adsManager.requestVodAd(
      adTagUrl = config.adTagUrl,                     // Required
      contentId = config.contentId,                   // Required
      durationMs = config.contentDuration,            // Required (ms)
      extraParams = config.extraParams,               // Required
      mediaPlayerHook = { player },                   // Required
      // adTagHeaders = mapOf(...),                   // Optional — omit if not needed
  )

  player.setMediaItem(MediaItem.fromUri(Uri.parse(config.contentUrl)))
  player.prepare()
  player.playWhenReady = true

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
      config.prerollAdTagUrl              // prerollAdTagUrl (Optional)
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

========================================
CONSTRAINTS
========================================

- For FlowerPlayer, register listener via player.addAdListener(), NOT flowerAdView.adsManager.addListener().
- For MediaPlayerHook, register listener via flowerAdView.adsManager.addListener().
- For VOD with MediaPlayerHook, you MUST call flowerAdView.adsManager.play() in onPrepare().
- For VOD with MediaPlayerHook, you MUST call flowerAdView.adsManager.notifyContentEnded() when content finishes.
- MediaPlayerAdapter is only available for Linear TV, not for VOD.
- All UI operations in listener callbacks must run on the Main thread.
```
