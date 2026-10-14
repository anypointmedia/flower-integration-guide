---
sidebar_position: 1
sidebar_label: 인라인 / 전면 광고
---

# 인라인 광고와 전면 광고 (requestAd)

`requestAd()`로 단독 동영상 광고를 표시할 때 이 프롬프트를 사용하세요. 콘텐츠 영역의 인라인 광고, 또는 화면 전체를 덮는 전면 광고(예: 앱 시작 시, 화면 전환 사이, 사용자가 본편을 일시정지했을 때)에 해당합니다. SDK는 `FlowerAdView` 안의 별도 광고 플레이어에서 광고를 재생하며 본편 플레이어는 제어하지 않으므로, 광고 뒤에서 본편이 재생 중이라면 앱이 본편을 일시정지하고 재개해야 합니다. 배경 설명: [인라인 광고 적용](../../../ad-insertion/advanced-ad-formats/inline-ad-implementation.md), [전면 광고](../../../api/interstitial-ads.md).

이 프롬프트는 Kotlin 코드를 생성합니다.

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `SDK_VERSION` | 예: `2.9.29` | 프로젝트에 제공된 Flower SDK 버전 |
| `ENV` | `local` \| `dev` \| `prod` | `FlowerSdk.setEnv()`에 전달하는 값 |
| `PLACEMENT` | `inline` \| `interstitial` | `inline`: 광고 뷰가 콘텐츠 영역을 채움. `interstitial`: 광고 뷰가 화면 전체를 덮음 |
| `PAUSE_CONTENT` | `yes` \| `no` | 광고 뒤에서 본편 플레이어가 재생 중이라 광고 동안 일시정지해야 하는지 여부 |

```plain
We are integrating the FLOWER SDK (Android) to show an inline / interstitial video ad with
requestAd(). Modify the code I provide. Generate Kotlin.

========================================
GOAL
========================================
Request one ad with FlowerAdsManager.requestAd(), play it in FlowerAdView, and clean up after it.
Pause and resume our own content around it when PAUSE_CONTENT = yes.

========================================
PARAMETERS
========================================
SDK_VERSION: {{SDK_VERSION}}
ENV: {{ENV}}                     (local | dev | prod)
PLACEMENT: {{PLACEMENT}}         (inline | interstitial)
PAUSE_CONTENT: {{PAUSE_CONTENT}} (yes | no)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- requestAd(adTagUrl, extraParams, adTagHeaders) requests the ad; no player is passed.
- The ad always plays in the SDK's own ad player inside FlowerAdView, regardless of
  FlowerSdk.setIgnoreAdBreakInPIPMode.
- Events: onPrepare(adDurationMs) when the ad is loaded -> the app calls adsManager.play();
  onPlay() when it starts; onCompleted() when it ends. If there is no ad or the request fails,
  onCompleted() arrives without onPrepare() (onAdBreakSkipped(1) may come first for "no ad").
  onError() if the ad fails while playing.
- The SDK does not pause or resume any content player for these ads.

========================================
IMPLEMENTATION
========================================
1) SDK dependency and initialization (skip what the project already has)
   - Repositories: google(), maven("https://maven.anypoint.tv/repository/public-release"),
     maven("https://jitpack.io")
   - implementation("flower-sdk:sdk-android-ott:{{SDK_VERSION}}")
   - Allow cleartext HTTP ONLY for prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com
     (network_security_config.xml), unless usesCleartextTraffic="true" is already set.
   - Application: FlowerSdk.setEnv("{{ENV}}"); FlowerSdk.init(this) in onCreate(),
     FlowerSdk.destroy() in onTerminate().

2) Layout
   PLACEMENT = inline:       FlowerAdView sized to the content area where the ad appears.
   PLACEMENT = interstitial: FlowerAdView covering the whole screen, last child (on top).
     <tv.anypoint.flower.android.sdk.api.FlowerAdView
         android:id="@+id/flowerAdView"
         android:layout_width="match_parent"
         android:layout_height="match_parent"
         android:visibility="gone" />

3) Listener (class member, so it can be removed later)
     private var pausedContentForAd = false
     private lateinit var flowerAdsManagerListener: FlowerAdsManagerListener

     flowerAdsManagerListener = object : FlowerAdsManagerListener {
         override fun onPrepare(adDurationMs: Int) {
             CoroutineScope(Dispatchers.Main).launch {
                 // PAUSE_CONTENT = yes:
                 if (contentPlayer.isPlaying) { contentPlayer.pause(); pausedContentForAd = true }
                 flowerAdView.adsManager.play()
             }
         }
         override fun onCompleted() { CoroutineScope(Dispatchers.Main).launch { finishAd() } }
         override fun onError(error: FlowerError?) { CoroutineScope(Dispatchers.Main).launch { finishAd() } }
     }

     private fun finishAd() {
         flowerAdView.adsManager.stop()
         flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
         // PAUSE_CONTENT = yes:
         if (pausedContentForAd) { pausedContentForAd = false; contentPlayer.play() }
     }

4) Request
     flowerAdView.adsManager.addListener(flowerAdsManagerListener)
     flowerAdView.adsManager.requestAd(
         adTagUrl,                                       // issued by Anypoint Media
         mapOf("serviceId" to packageName, "os" to "Android", "adId" to advertisingId),
         null,                                           // adTagHeaders (optional)
     )

5) Leaving the screen while an ad may be showing (onDestroy):
     flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
     flowerAdView.adsManager.stop()

========================================
RULES
========================================
DO
- Call adsManager.play() in onPrepare().
- Call stop() and removeListener() after onCompleted() / onError().
- Pause the content only once the ad is ready (onPrepare), and resume it only if the app paused it.
DO NOT
- Do not pass a player or MediaPlayerHook; do not use requestVodAd() or changeChannelUrl() here.
- Do not expect the SDK to pause/resume the content for inline / interstitial ads.
- Do not leave the listener registered after the ad ends (it would react to the next request).

========================================
VERIFY
========================================
- Ad available: onPrepare -> play -> onPlay -> onCompleted; the view hides afterwards.
- No ad / request failure: onCompleted() without onPrepare(); content (if any) keeps playing.
- Ad playback error: onError(); cleanup runs; content resumes if it was paused.
- Leaving the screen during the ad stops it without crashes.

========================================
OUTPUT
========================================
- Full code for every changed file and a short list of the changes.
```
