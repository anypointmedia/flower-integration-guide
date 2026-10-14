---
sidebar_position: 1
sidebar_label: 인라인 / 전면 광고
---

# 인라인 광고와 전면 광고 (requestAd)

본편 플레이어와 관계없이 독립적인 동영상 광고를 노출할 때 이 프롬프트를 사용하세요. 페이지의 일정 영역에 표시하는 인라인 광고나, 화면 전체를 덮는 전면 광고(예: 화면 전환 사이, 앱의 특정 섹션 진입 전)가 해당됩니다. LLM이 전용 광고 컨테이너를 추가하고, `requestAd()`로 광고를 요청하며, 광고가 끝난 뒤 정리하도록 안내합니다. [인라인 광고 적용](../../../ad-insertion/advanced-ad-formats/inline-ad-implementation.md)과 [전면 광고](../../../api/interstitial-ads.md) 페이지를 참고하세요.

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `SDK_VERSION` | 예: `2.3.18` | 프로젝트에 제공된 Flower SDK 버전 |
| `PLACEMENT` | `inline` \| `interstitial` | 광고를 페이지 영역에 표시할지, 화면 전체를 덮을지 여부 |

```plain
We are adding a FLOWER SDK standalone video ad to our HTML5/Web (or Smart TV web app)
page, using FlowerAdsManager.requestAd(). Modify the code I paste after this prompt.

========================================
GOAL
========================================

- Add a dedicated ad container and FlowerAdView for this ad.
- Request the ad with requestAd(), play it on onPrepare, and clean up when it ends.
- Continue the app flow after the ad, whether it played, was not served, or failed.

========================================
PARAMETERS
========================================

SDK_VERSION: {{SDK_VERSION}}
PLACEMENT: {{PLACEMENT}}   (inline | interstitial)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

1. requestAd(adTagUrl, extraParams, adTagHeaders) requests one ad break. extraParams and
   adTagHeaders accept a plain object or a Map; adTagHeaders is optional.
2. The ad plays in the SDK's own video element inside the FlowerAdView container. The
   SDK shows the container while the ad plays and hides it afterwards. It does not touch
   any content player of the app.
3. onPrepare() is called when the ad is ready; the app must call
   flowerAdView.adsManager.play().
4. onCompleted() is called when the ad ends, and also when no ad is served
   (onAdBreakSkipped(1) comes first) or the request fails. onError() is called when the
   ad fails to play; onCompleted() may follow it.
5. requestAd() first stops the previous ad session of the same FlowerAdsManager. Calling
   it on a FlowerAdView that is running a VOD or linear session stops that session, so
   this ad needs its own FlowerAdView and container.

========================================
IMPLEMENTATION
========================================

STEP 1 — Load and initialize the SDK (skip if already done)

  <script src="https://sdk.anypoint.tv/html5/flower-sdk-{{SDK_VERSION}}.js"></script>
  FlowerSdk.setEnv('local');   // 'local' | 'dev' | 'prod'
  FlowerSdk.init();

STEP 2 — Dedicated ad container

  inline:
      <div id="inline-ad-container" style="position: relative; width: 640px; height: 360px;"></div>
  interstitial:
      <div id="interstitial-ad-container"
           style="position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 1000;"></div>

  Keep only the {{PLACEMENT}} container.

STEP 3 — Show the ad

  let adView = null;
  let adListener = null;

  function showAd(config, onFinished) {
      stopAd();
      adView = new FlowerAdView(document.getElementById('<container id>'));
      let finished = false;
      const finish = () => {
          if (finished) return;      // onError() may be followed by onCompleted()
          finished = true;
          stopAd();
          onFinished();              // continue the app flow
      };
      adListener = {
          onPrepare(adDurationMs) { adView.adsManager.play(); },
          onPlay() { /* optional UI */ },
          onCompleted() { finish(); },
          onError(error) { console.warn('Flower ad error', error); finish(); },
          onAdBreakSkipped(reason) {}
      };
      adView.adsManager.addListener(adListener);
      adView.adsManager.requestAd(
          config.adTagUrl,                                          // issued by Anypoint Media
          { serviceId: config.serviceId, os: 'Web', adId: config.adId, ...config.extraParams },
          config.adTagHeaders || null
      );
  }

STEP 4 — Cleanup

  function stopAd() {
      if (adView && adListener) {
          adView.adsManager.removeListener(adListener);   // BEFORE stop()
          adView.adsManager.stop();
      }
      adView = null;
      adListener = null;
  }
  Also call stopAd() when the page or component unmounts.

STEP 5 — If content is playing on the same page (optional)

  The SDK does not pause the app's content for this ad. If the app has a video playing,
  the app pauses it before showAd() and resumes it in onFinished().

========================================
RULES
========================================

DO:
- Use a FlowerAdView and container dedicated to this ad.
- Call play() in onPrepare() right away.
- Continue the app flow from onCompleted() and onError(), once.
- Remove the listener before stop().

DO NOT:
- Call requestAd() on the FlowerAdView used for VOD or linear ads.
- Pass a MediaPlayerHook, call requestVodAd() or changeChannelUrl() for this ad.
- Continue the app flow before onCompleted() or onError() arrives (the ad would be cut off).
- Toggle the ad container's display yourself.

========================================
VERIFY
========================================

- Ad served: the ad plays in the container; the app continues after it ends.
- No ad / ad server unreachable: the app continues without a blank screen hanging.
- Ad error: the app continues exactly once.
- Navigate away during the ad: the ad stops and nothing continues afterwards.
- PLACEMENT = interstitial: the ad covers the whole screen, including on a TV.

========================================
OUTPUT
========================================

- Modify the code I paste; keep only the {{PLACEMENT}} branch.
- List every changed file.
- Do not add VOD or linear TV code.
```
