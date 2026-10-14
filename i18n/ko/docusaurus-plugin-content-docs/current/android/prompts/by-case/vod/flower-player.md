---
sidebar_position: 1
sidebar_label: Flower Player로 VOD 광고
---

# Flower Player로 VOD 광고 재생

앱이 Media3 ExoPlayer, ExoPlayer2, Bitmovin Player로 VOD를 재생하고 가장 간단하게 연동하려는 경우 이 프롬프트를 사용하세요. 플레이어를 Flower Player로 감싸고 `FlowerVodAdConfig`를 전달하는 방식입니다. LLM이 플레이어를 감싸고, 광고 설정(`requestTimeout`, `minPrepareDuration`, `rewindDuration` 포함)을 만들고, 리스너를 등록하고, 정리 코드를 추가합니다. 배경 설명: [Flower Player 사용 (VOD)](../../../ad-insertion/vod/using-flower-player.md), [FlowerAdConfig](../../../api/flower-ad-config.md).

이 프롬프트는 Kotlin 코드를 생성합니다.

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `SDK_VERSION` | 예: `2.9.29` | 프로젝트에 제공된 Flower SDK 버전 |
| `ENV` | `local` \| `dev` \| `prod` | `FlowerSdk.setEnv()`에 전달하는 값 |
| `PLAYER` | `media3` \| `exoplayer2` \| `bitmovin` | 감쌀 플레이어: `FlowerMedia3ExoPlayer`, `FlowerExoPlayer2`, `FlowerBitmovinPlayer` |
| `MEDIA3_VERSION` | 예: `1.10.1` | `media3`인 경우에만: 앱의 `androidx.media3` 버전 |

```plain
We are integrating the FLOWER SDK (Android) into our app for VOD ads using a Flower Player.
Modify the code I provide. Generate Kotlin.

========================================
GOAL
========================================
Replace the app's VOD player with the matching Flower Player and pass FlowerVodAdConfig when
loading the content, so the player handles pre-roll and mid-roll ads by itself.

========================================
PARAMETERS
========================================
SDK_VERSION: {{SDK_VERSION}}
ENV: {{ENV}}                      (local | dev | prod)
PLAYER: {{PLAYER}}                (media3 | exoplayer2 | bitmovin)
MEDIA3_VERSION: {{MEDIA3_VERSION}} (only for media3, e.g. 1.10.1)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- The Flower Player requests the ads when the content is loaded with an ad config, holds the
  content until the pre-roll is over, and then loads and starts the content by itself.
  The app calls prepare()/play() as usual.
- The Flower Player adds its own FlowerAdView over the video surface. Do not add one to the layout.
- Mid-roll: requested requestTimeout + minPrepareDuration before its position; onPrepare() comes
  when the content reaches the position and the Flower Player plays the ad right away.
  By default the ad plays in the SDK's own ad player over the content; the SDK pauses the content
  and, after the break, resumes it rewindDuration earlier than where it stopped.
- Post-roll: requested only when notifyContentEnded() is called. The Flower Player does not call
  it by itself. FlowerMedia3ExoPlayer and FlowerBitmovinPlayer expose their ads manager as
  player.flowerAdView.adsManager (public since SDK 2.9.19), so the app can call
  notifyContentEnded() on it. FlowerExoPlayer2 does not expose it, so post-roll is not played
  with FlowerExoPlayer2 — use the MediaPlayerHook approach if post-roll is required.
- If the pre-roll fails while playing (onError() before any onCompleted()), the Flower Player
  does NOT start the content by itself. The app must recover (see IMPLEMENTATION 5).
- If a mid-roll fails, the SDK stops the ad and queues its rewind and resume of the content
  before it calls onError(). The app still resumes the content with player.play() as a safety
  net, so the content never stays paused. After a post-roll error the content has ended.

========================================
IMPLEMENTATION
========================================
1) SDK dependency and initialization (skip what the project already has)
   - Repositories: google(), maven("https://maven.anypoint.tv/repository/public-release"),
     maven("https://jitpack.io")
   - implementation("flower-sdk:sdk-android-ott:{{SDK_VERSION}}")
   - Only if PLAYER = media3, ALSO add the companion artifact matching the app's androidx.media3
     version exactly (supported: 1.2.1 and above):
       implementation("flower-sdk:sdk-android-ott-media3-{{MEDIA3_VERSION}}:{{SDK_VERSION}}")
     Its version is the Flower SDK version. If androidx.media3 is below 1.2.1, stop and tell the
     user to contact dev-support@anypointmedia.com.
   - Allow cleartext HTTP ONLY for prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com
     (network_security_config.xml), unless usesCleartextTraffic="true" is already set.
   - Application: FlowerSdk.setEnv("{{ENV}}"); FlowerSdk.init(this) in onCreate(),
     FlowerSdk.destroy() in onTerminate().

2) Wrap the player (always pass the Activity context as the second argument)
     media3:     val player = FlowerMedia3ExoPlayer(ExoPlayer.Builder(this).build(), this)
     exoplayer2: val player = FlowerExoPlayer2(ExoPlayer.Builder(this).build(), this)
     bitmovin:   val player = FlowerBitmovinPlayer(PlayerBuilder(this).build(), this)
   Attach it to the view as before (playerView.player = player, or setVideoSurfaceView /
   setVideoTextureView). Keep using the wrapper everywhere the app used the player.
   Imports: tv.anypoint.flower.android.sdk.api.FlowerMedia3ExoPlayer / FlowerExoPlayer2 /
   FlowerBitmovinPlayer / FlowerVodAdConfig, tv.anypoint.flower.sdk.core.api.FlowerAdsManagerListener,
   tv.anypoint.flower.sdk.core.api.FlowerError

3) Ad config (values from the app's data, not hardcoded)
     val adConfig = FlowerVodAdConfig(
         adTagUrl = adTagUrl,                 // issued by Anypoint Media
         contentId = contentId,               // registered in the Flower backend
         contentDuration = contentDurationMs, // Long, ms
         requestTimeout = null,               // optional, ms, default 5000 - ad request timeout
         minPrepareDuration = null,           // optional, ms, default 5000 - extra lead time:
                                              //   a mid-roll is requested requestTimeout +
                                              //   minPrepareDuration before its position
         rewindDuration = null,               // optional, ms, default 5000 - how far before the
                                              //   interrupted point the content resumes
         extraParams = mapOf("serviceId" to packageName, "os" to "Android", "adId" to advertisingId),
         adTagHeaders = null,                 // optional
     )

4) Listener (optional for ads to work; needed for UI and error recovery)
     private var isContentStarted = false
     private var isContentEnd = false         // set when the content ends (IMPLEMENTATION 6)
     private val flowerAdsManagerListener = object : FlowerAdsManagerListener {
         override fun onPlay() { /* UI only: hide controls */ }
         override fun onCompleted() {
             CoroutineScope(Dispatchers.Main).launch {
                 isContentStarted = true          // first call = pre-roll phase over
                 /* UI only: show controls */
             }
         }
         override fun onError(error: FlowerError?) {
             CoroutineScope(Dispatchers.Main).launch {
                 if (!isContentStarted) recoverFromPrerollError()   // pre-roll error
                 else if (!isContentEnd) player.play()              // mid-roll error: resume, no seek/reload
                 // else: post-roll error - the content has ended; run the end-of-playback scenario
             }
         }
     }
     player.addAdListener(flowerAdsManagerListener)

5) Load and play
     media3 / exoplayer2:
         player.setMediaItem(MediaItem.fromUri(contentUrl), adConfig)
         player.prepare()
         player.play()
     bitmovin:
         player.load(SourceConfig.fromUrl(contentUrl), adConfig)
         player.play()

   recoverFromPrerollError() — play the content WITHOUT ads (no retry loop):
     media3 / exoplayer2:
         player.stop()                                  // also stops the SDK
         player.setMediaItem(MediaItem.fromUri(contentUrl)) // no ad config
         player.prepare(); player.play()
     bitmovin: destroy this FlowerBitmovinPlayer, create a new one, and call
         player.load(SourceConfig.fromUrl(contentUrl)) (no ad config); player.play()
   Set isContentStarted = true after recovering.

6) Content end -> post-roll (media3 and bitmovin only; once per title)
     Set isContentEnd = true on the first content end with every PLAYER.
     media3:   on Player.STATE_ENDED (first time only)  -> player.flowerAdView.adsManager.notifyContentEnded()
     bitmovin: on PlayerEvent.PlaybackFinished (first time only) -> player.flowerAdView.adsManager.notifyContentEnded()
     exoplayer2: not available (see above).

7) Cleanup
     media3 / exoplayer2:
         player.stop(); player.removeAdListener(flowerAdsManagerListener); player.release()
     bitmovin:
         player.removeAdListener(flowerAdsManagerListener); player.destroy()

========================================
RULES
========================================
DO
- Pass the ad config in setMediaItem(mediaItem, adConfig) / load(sourceConfig, adConfig).
- Register listeners with player.addAdListener(), remove with player.removeAdListener().
- On a mid-roll onError(), resume the content with player.play() only (no seek, no reload).
  On a post-roll onError(), do not resume.
DO NOT
- Do not use a FlowerLinearTvAdConfig for VOD, and do not call changeChannelUrl() or
  requestVodAd() yourself — the Flower Player does it.
- Do not add a FlowerAdView to the layout.
- Do not call play() on the wrapped (inner) player directly, and do not pause the content in onPlay().
- Do not delay anything in onPrepare(); do not seek/reload the content after a mid-roll.
- Do not restart the whole VOD (and re-request ads) on every onError().

========================================
VERIFY
========================================
- Pre-roll plays before the first content frame; content starts after it.
- No ad / ad request failure: the content starts normally.
- Mid-roll: content pauses at the position, ad plays, content resumes rewindDuration earlier.
- Post-roll (media3 / bitmovin): plays once after the content ends.
- Pre-roll playback error: the content starts without ads.
- Mid-roll playback error: the content resumes (it does not stay paused) without a reload.
- Post-roll playback error: the content is not resumed; the end-of-playback scenario runs.
- Leaving the screen during an ad releases everything without crashes.

========================================
OUTPUT
========================================
- Full code for every changed file (Gradle, Application, Activity, manifest/network config if needed).
- A short list of what was changed and why.
```
