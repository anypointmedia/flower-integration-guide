---
sidebar_position: 1
sidebar_label: Inline and Interstitial Ads
---

# Inline and Interstitial Ads

Use this prompt to show a standalone video ad that is not tied to a content player: an inline ad in a content area of a screen, or an interstitial ad that covers the whole screen (for example between screens). The prompt produces the ad view, the listener and the ad request. See [Inline Ad Implementation](../../../ad-insertion/advanced-ad-formats/inline-ad-implementation) and [Interstitial Ads](../../../api/interstitial-ads).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `UI_FRAMEWORK` | `swiftui` \| `uikit` | UI framework of the screen |
| `PLACEMENT` | `inline` \| `interstitial` | Ad area in the content, or full screen |

```plain
We are adding a FLOWER SDK standalone video ad to our iOS app (no content player involved).
Modify the code I paste below.

========================================
GOAL
========================================

- Request one ad, play it in FlowerAdView, and clean up when it ends or fails.

========================================
PARAMETERS
========================================

UI_FRAMEWORK: {{UI_FRAMEWORK}}   (swiftui | uikit)
PLACEMENT: {{PLACEMENT}}         (inline | interstitial)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- requestAd(adTagUrl:extraParams:adTagHeaders:) requests the ad. When it is ready the SDK calls
  onPrepare; the app calls adsManager.play(); the ad plays inside FlowerAdView.
- When there is no ad or the request fails, the SDK calls onCompleted (after onAdBreakSkipped
  for "no ad") without onPrepare.
- The ad ends with onCompleted, or onError on a playback error.
- In PIP mode the ad is paused and resumed when the app returns (default
  FlowerSdk.setIgnoreAdBreakInPIPMode(true)), if the app reports PIP transitions.

========================================
IMPLEMENTATION
========================================

1. SDK setup (skip if it already exists): Swift Package https://github.com/anypointmedia/flower-sdk-ios
   (product FlowerSdk); FlowerSdk.setEnv(env: "local") and FlowerSdk.doInit() at app launch.

2. Ad view. PLACEMENT inline: size FlowerAdView to the ad area of the screen.
   PLACEMENT interstitial: FlowerAdView covers the whole screen, above everything else.
   If UI_FRAMEWORK is "swiftui":
     private let flowerAdView = FlowerAdView()
     ZStack { /* screen content */ ; flowerAdView.body }
   If UI_FRAMEWORK is "uikit":
     private let flowerAdViewHostingController = FlowerAdView.HostingController()
     private var flowerAdView: FlowerAdView { flowerAdViewHostingController.adView }
     addChild / view.addSubview / didMove(toParent:), then constrain the view to the ad area
     (inline) or to all edges of the screen (interstitial).

3. Listener (all 8 methods are required). SwiftUI: a class holding the FlowerAdView;
   UIKit: an extension of the view controller.
   func onPrepare(adDurationMs: Int32) {
       DispatchQueue.main.async { self.flowerAdView.adsManager.play() }
   }
   func onPlay() {}
   func onCompleted() {
       DispatchQueue.main.async {
           self.flowerAdView.adsManager.stop()
           self.flowerAdView.adsManager.removeListener(adsManagerListener: self)
           // PLACEMENT interstitial: dismiss the ad screen / continue to the next screen here
       }
   }
   func onError(error: FlowerError?) { same as onCompleted }
   func onAdBreakSkipped(reason: Int32) {}
   func onAdBreakPrepare(adInfos: NSMutableArray) {}
   func onAdPlay(adInfo: AdInfo) {}
   func onAdUserAction(action: String, adInfo: AdInfo) {}

4. Request the ad (e.g. when the screen appears):
   flowerAdView.adsManager.addListener(adsManagerListener: listener)
   flowerAdView.adsManager.requestAd(
       adTagUrl: config.adTagUrl,              // issued by Anypoint Media
       extraParams: config.extraParams ?? [:], // targeting values
       adTagHeaders: config.adTagHeaders ?? [:]
   )

5. If the screen disappears before the ad ends (UIKit viewDidDisappear / SwiftUI onDisappear):
   flowerAdView.adsManager.removeListener(adsManagerListener: listener)
   flowerAdView.adsManager.stop()

6. If the app supports PIP, report transitions with
   FlowerSdk.notifyPictureInPictureModeChanged(true/false) (see the PIP mode support case).

========================================
RULES
========================================

DO:
- Keep the listener in a property, remove it before or together with stop().
- Use values from the app's config; do not hardcode URLs.

DO NOT:
- Do NOT create a content player, MediaPlayerHook, FlowerAVPlayer, requestVodAd or
  changeChannelUrl for this case.
- Do NOT delay play() in onPrepare.
- PLACEMENT interstitial: do NOT leave the screen blocked when there is no ad - onCompleted
  without onPrepare must also dismiss it.

========================================
VERIFY
========================================

- Ad available: it plays in the ad area (inline) or full screen (interstitial), then cleans up.
- No ad / request failure: nothing is shown and the screen (or next screen) continues.
- Playback error: the ad view is cleaned up.
- Leaving the screen during the ad stops it and its sound.

========================================
OUTPUT
========================================

- Modify the code I paste below; keep its structure and names.
- Generate only the code for the selected UI_FRAMEWORK and PLACEMENT.
- List every file you changed or added.
- Do not add code for other cases (VOD, linear TV).

My code:
```
