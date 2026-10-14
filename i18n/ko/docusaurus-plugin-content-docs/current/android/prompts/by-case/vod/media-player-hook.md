---
sidebar_position: 2
sidebar_label: 앱의 플레이어로 VOD 광고
---

# 앱의 플레이어로 VOD 광고 재생 (MediaPlayerHook)

앱이 기존 ExoPlayer2, Media3 ExoPlayer, Bitmovin Player를 그대로 사용하면서 `requestVodAd()`로 프리롤, Mid-roll, Post-roll 광고를 요청하는 경우, 기본 광고 모드(`setIgnoreAdBreakInPIPMode(true)`)에서 이 프롬프트를 사용하세요. LLM이 `FlowerAdView`, 광고 리스너, 광고 요청, 본편 종료 처리, 정리 코드를 추가합니다. 배경 설명: [VOD 프리롤, Mid-roll, Post-roll 광고 적용](../../../ad-insertion/vod/vod-ad-implementation.md). PIP 모드에서도 광고가 계속 재생되어야 한다면 [PIP 모드에서의 VOD 광고](./ads-in-pip-mode.md)를 사용하세요.

이 프롬프트는 Kotlin 코드를 생성합니다.

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `SDK_VERSION` | 예: `2.9.29` | 프로젝트에 제공된 Flower SDK 버전 |
| `ENV` | `local` \| `dev` \| `prod` | `FlowerSdk.setEnv()`에 전달하는 값 |
| `PLAYER` | `media3` \| `exoplayer2` \| `bitmovin` | 앱이 현재 사용하는 본편 플레이어 |

```plain
We are integrating the FLOWER SDK (Android) into our app for VOD ads.
Modify the code I provide. Generate Kotlin.

========================================
GOAL
========================================
Play pre-roll, mid-roll and post-roll ads for a VOD title in the app's existing player,
using FlowerAdView + FlowerAdsManager.requestVodAd() + MediaPlayerHook,
in the SDK's default ad mode (FlowerSdk.setIgnoreAdBreakInPIPMode(true)).

========================================
PARAMETERS
========================================
SDK_VERSION: {{SDK_VERSION}}
ENV: {{ENV}}                (local | dev | prod)
PLAYER: {{PLAYER}}          (media3 | exoplayer2 | bitmovin)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- The SDK plays every VOD ad in its OWN ad player inside FlowerAdView, shown over the content.
- Pre-roll: the SDK does NOT touch the content player. The app must not load or start the
  content until the pre-roll is over. The SDK ALWAYS reports the end of the pre-roll phase with
  onCompleted() (or onError() if the ad fails while playing), including when there is no
  pre-roll, the ad response has no ad breaks, or the ad request fails or times out.
- Mid-roll: the SDK requests the ad requestTimeout + minPrepareDuration (5000 + 5000 ms by
  default) before the mid-roll position, and calls onPrepare() when the content reaches that
  position. At onPrepare() the SDK pauses the content player itself. After the break
  (onCompleted() or onError()), the SDK seeks the content back by rewindDuration (5000 ms) and
  resumes it. The same mid-roll is not played again after the rewind.
  With requestVodAd() these three values are fixed at 5000 ms (they are only configurable
  through FlowerVodAdConfig when a Flower Player is used).
- Post-roll: requested when the app calls notifyContentEnded(). The content is not resumed.
- Ad error (onError()): before the content started (pre-roll) the app starts the content; on a
  mid-roll error (isContentEnd == false) the app resumes the content (no seek, no reload); on a
  post-roll error (isContentEnd == true) it does not resume. On a mid-roll error the content is
  normally already playing again; resuming is a harmless safety net.
- The app must call flowerAdView.adsManager.play() in onPrepare() for every ad break.
- Mid-roll and post-roll are not requested while the user is away from the app
  (only if the app reports it with FlowerSdk.notifyUserLeftApp(true/false), whether or not it
  enters PIP).

========================================
IMPLEMENTATION
========================================
1) SDK dependency and initialization (skip what the project already has)
   - Repositories (settings.gradle(.kts) dependencyResolutionManagement, or build.gradle):
       google()
       maven("https://maven.anypoint.tv/repository/public-release")
       maven("https://jitpack.io")
   - implementation("flower-sdk:sdk-android-ott:{{SDK_VERSION}}")
     (no Media3 companion artifact is needed for MediaPlayerHook)
   - Allow cleartext HTTP ONLY for prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com
     with a network_security_config.xml <domain-config cleartextTrafficPermitted="true">.
     Skip if android:usesCleartextTraffic="true" is already set. Keep existing domain configs.
   - Application class:
       override fun onCreate() { super.onCreate(); FlowerSdk.setEnv("{{ENV}}"); FlowerSdk.init(this) }
       override fun onTerminate() { super.onTerminate(); FlowerSdk.destroy() }

2) Layout — put FlowerAdView AFTER (on top of) the player view, same size:
     <FrameLayout ...>
         <YourPlayerView android:id="@+id/playerView" match_parent x match_parent />
         <tv.anypoint.flower.android.sdk.api.FlowerAdView
             android:id="@+id/flowerAdView"
             android:layout_width="match_parent"
             android:layout_height="match_parent"
             android:visibility="gone" />
     </FrameLayout>
   The SDK controls FlowerAdView's visibility.

3) Activity members and imports
     import tv.anypoint.flower.android.sdk.api.FlowerAdView
     import tv.anypoint.flower.sdk.core.api.FlowerAdsManagerListener
     import tv.anypoint.flower.sdk.core.api.FlowerError

     private lateinit var flowerAdView: FlowerAdView
     private lateinit var flowerAdsManagerListener: FlowerAdsManagerListener
     private var isContentPrepared = false
     private var isContentEnd = false

   Create the content player BEFORE requestVodAd(): mediaPlayerHook.getPlayer() must not return
   null, otherwise the SDK skips ads and never calls the listener.

4) Listener (register before requesting ads; all player calls on the Main thread)
     flowerAdsManagerListener = object : FlowerAdsManagerListener {
         override fun onPrepare(adDurationMs: Int) {
             CoroutineScope(Dispatchers.Main).launch {
                 flowerAdView.adsManager.play()       // right away, for every break
             }
         }
         override fun onPlay() {
             // UI only (e.g., hide player controls). Do NOT pause the content player.
         }
         override fun onCompleted() {
             CoroutineScope(Dispatchers.Main).launch { onAdBreakFinished() }
         }
         override fun onError(error: FlowerError?) {
             CoroutineScope(Dispatchers.Main).launch { onAdBreakFailed() }
         }
     }
     flowerAdView.adsManager.addListener(flowerAdsManagerListener)

     private fun onAdBreakFinished() {
         // UI only: show player controls again.
         if (!isContentPrepared) {
             isContentPrepared = true
             startContent()                           // pre-roll over (or no pre-roll served)
         }
         // After a mid-roll: nothing - the SDK has already rewound and resumed the content.
         // After a post-roll (isContentEnd == true): run post-playback actions if any.
     }

     private fun onAdBreakFailed() {
         // UI only: show player controls again.
         if (!isContentPrepared) {
             isContentPrepared = true
             startContent()                           // pre-roll failed
         } else if (!isContentEnd) {
             resumeContent()                          // mid-roll failed: resume, no seek/reload
         }
         // After a post-roll (isContentEnd == true): do not resume; run post-playback actions if any.
     }

   startContent() by PLAYER:
     media3 / exoplayer2:
         player.setMediaItem(MediaItem.fromUri(contentUrl))
         player.prepare()
         player.playWhenReady = true
     bitmovin:
         player.load(SourceConfig.fromUrl(contentUrl))
         player.play()

   resumeContent() by PLAYER (a harmless safety net if the content is already playing):
     media3 / exoplayer2:  player.playWhenReady = true
     bitmovin:             player.play()

5) Request ads — do NOT load the content here
     flowerAdView.adsManager.requestVodAd(
         adTagUrl = adTagUrl,                    // issued by Anypoint Media
         contentId = contentId,                  // registered in the Flower backend
         durationMs = contentDurationMs,         // Long, ms
         extraParams = mapOf(                    // targeting; values from your app
             "serviceId" to packageName,
             "os" to "Android",
             "adId" to advertisingId,            // Google Advertising ID
         ),
         mediaPlayerHook = { player },           // keep the NAMED argument
         adTagHeaders = null,                    // optional
     )
   Keep mediaPlayerHook as a named argument: requestVodAd() also has an overload whose 5th
   parameter is a MediaPlayerAdapter typed as Any, and a positional lambda can resolve to it.

6) Content end -> post-roll (call notifyContentEnded() once per title)
     media3 / exoplayer2:
         player.addListener(object : Player.Listener {
             override fun onPlaybackStateChanged(playbackState: Int) {
                 if (playbackState == Player.STATE_ENDED && !isContentEnd) {
                     isContentEnd = true
                     flowerAdView.adsManager.notifyContentEnded()
                 }
             }
         })
     bitmovin:
         player.on<PlayerEvent.PlaybackFinished> {
             if (!isContentEnd) {
                 isContentEnd = true
                 flowerAdView.adsManager.notifyContentEnded()
             }
         }

7) User pause / resume / exit
     fun onUserPause()  { player.pause(); flowerAdView.adsManager.pause() }
     fun onUserResume() { player.play();  flowerAdView.adsManager.resume() }
   Call adsManager.pause()/resume() only from explicit user actions, not from player state
   callbacks (the SDK itself pauses and resumes the content around a mid-roll).

8) Cleanup (Activity.onDestroy or when leaving the VOD screen)
     flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
     flowerAdView.adsManager.stop()
     player.release()      // bitmovin: player.destroy()

========================================
RULES
========================================
DO
- Call adsManager.play() immediately in onPrepare() for pre-roll, mid-roll and post-roll.
- Start the content only on the FIRST onCompleted()/onError() (isContentPrepared).
- On a mid-roll onError(), resume the content (resumeContent()); on a post-roll onError(), do not.
- Register the listener with flowerAdView.adsManager.addListener().
- Request a new title with a fresh requestVodAd() call and reset isContentPrepared/isContentEnd.
DO NOT
- Do not pause the content player in onPlay().
- Do not delay play() in onPrepare() (no countdown, no delay(minPrepareDuration)).
- Do not load or play the content right after requestVodAd().
- Do not resume, seek or reload the content in onCompleted() after a mid-roll, and do not seek or
  reload it in onError() (resuming is the only action there).
- Do not use changeChannelUrl() for VOD — it is for Linear TV.
- Do not wrap the player in FlowerExoPlayer2/FlowerMedia3ExoPlayer/FlowerBitmovinPlayer in this
  case (that is the Flower Player approach, which uses FlowerVodAdConfig instead).
- Do not call FlowerSdk.destroy() in an Activity.

========================================
VERIFY
========================================
- Pre-roll: ad plays first, the content's first frame never shows before it, content starts
  after onCompleted().
- No ad / empty VMAP / ad request failure: onCompleted() still arrives and the content starts.
- Mid-roll: content pauses at the mid-roll position, ad plays, then the content resumes about
  5 seconds before where it stopped, and the same mid-roll does not play again.
- Post-roll: plays after the content ends; the content is not restarted.
- Ad playback error: onError() — before content start the content still starts; on a mid-roll
  error the content resumes (it does not stay paused, no reload); on a post-roll error the
  content is not resumed.
- Leaving the screen during an ad stops the ad (stop()) without crashes.

========================================
OUTPUT
========================================
- Changed/added files with full code: Application class, Activity, layout XML,
  network_security_config.xml / AndroidManifest.xml changes if needed, Gradle changes.
- A short list of what was changed and why.
```
