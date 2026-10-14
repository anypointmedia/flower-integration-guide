---
sidebar_position: 1
sidebar_label: Inline / Interstitial Ads
---

# Inline and Interstitial Ads (requestAd)

Use this prompt to show a standalone video ad with `requestAd()`: an inline ad in a content area, or an interstitial ad over the screen (for example, at app start, between screens, or when the user pauses content). The SDK plays the ad in its own ad player inside `FlowerAdView`; it does not control any content player, so if content is playing behind the ad, the app pauses and resumes it. Background: [Inline Ad Implementation](../../../ad-insertion/advanced-ad-formats/inline-ad-implementation.md), [Interstitial Ads](../../../api/interstitial-ads.md).

The prompt generates Kotlin code.

| Parameter | Values | Description |
|-----------|--------|-------------|
| `SDK_VERSION` | e.g., `2.9.28` | Flower SDK version provided to your project |
| `ENV` | `local` \| `dev` \| `prod` | Value passed to `FlowerSdk.setEnv()` |
| `PLACEMENT` | `inline` \| `interstitial` | `inline`: the ad view fills a content area. `interstitial`: the ad view covers the whole screen |
| `PAUSE_CONTENT` | `yes` \| `no` | Whether a content player is playing behind the ad and must be paused during it |

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
