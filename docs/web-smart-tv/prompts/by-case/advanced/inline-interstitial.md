---
sidebar_position: 1
sidebar_label: Inline / Interstitial Ads
---

# Inline and Interstitial Ads (requestAd)

Use this prompt to show a standalone video ad that is not tied to a content player: an inline ad in an area of a page, or an interstitial ad that covers the screen (for example between screens or before an app section opens). The prompt makes the LLM add a dedicated ad container, request the ad with `requestAd()`, and clean up after it ends. See [Inline Ad Implementation](../../../ad-insertion/advanced-ad-formats/inline-ad-implementation.md) and [Interstitial Ads](../../../api/interstitial-ads.md).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `SDK_VERSION` | e.g. `2.3.17` | Flower SDK version provided to your project |
| `PLACEMENT` | `inline` \| `interstitial` | Whether the ad shows in a page area or covers the whole screen |

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
6. If the app enters PIP mode while this ad plays (default mode), the SDK pauses the ad
   and resumes it when the app leaves PIP; the app must report both transitions with
   FlowerSdk.notifyPictureInPictureModeChanged().

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
- Do not add VOD, linear TV, or PIP-mode code.
```
