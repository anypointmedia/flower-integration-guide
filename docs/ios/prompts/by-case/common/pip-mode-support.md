---
sidebar_position: 1
sidebar_label: PIP Mode Support
---

# PIP Mode Support

Use this prompt when your app supports Picture-in-Picture and already has a Flower SDK integration (VOD, linear TV or inline). It reports to the SDK when the user leaves the app and comes back (`FlowerSdk.notifyUserLeftApp`, from the app lifecycle rather than from PIP callbacks, which do not fire while an ad blocks PIP) and, in the default mode, prevents the content player from going into PIP while an ad is playing so that PIP cannot be used to skip the ad. To keep VOD ads playing in PIP instead, use [VOD Ads in PIP Mode](../vod/ads-in-pip-mode). See [PIP Mode Support](../../../getting-started/pip-mode-support) and [VOD PIP Mode Support](../../../ad-insertion/vod/pip-mode-support).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `PIP_SOURCE` | `avplayerviewcontroller` \| `avpictureinpicturecontroller` | Where PIP comes from: the built-in PIP of `AVPlayerViewController` (also `FlowerAVPlayerViewController`), or your own `AVPictureInPictureController` on an `AVPlayerLayer` |

```plain
Our iOS app has a FLOWER SDK integration and supports Picture-in-Picture. Add the handling the
SDK needs when the user leaves the app (PIP, home screen, another app). Modify the code I paste
below.

========================================
GOAL
========================================

- The SDK always knows whether the user is away from the app (in PIP, on the home screen or in
  another app), whether or not the app enters PIP.
- While an ad is playing, the content player cannot go into PIP (default mode).

========================================
PARAMETERS
========================================

PIP_SOURCE: {{PIP_SOURCE}}   (avplayerviewcontroller | avpictureinpicturecontroller)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- The SDK does not detect it by itself. The app must call FlowerSdk.notifyUserLeftApp(true) when
  the user leaves the app (home screen, another app, or the video moved to a PIP window) and
  FlowerSdk.notifyUserLeftApp(false) when the user comes back.
- FlowerSdk.notifyPictureInPictureModeChanged(_:) is deprecated and replaced by
  notifyUserLeftApp(_:). Do not use it in new code.
- Because the content player must not go into PIP while an ad plays, PIP delegate callbacks
  never fire during an ad. So report leaving/returning from the app lifecycle (background /
  foreground), not from the PIP delegate.
- Default FlowerSdk.setIgnoreAdBreakInPIPMode(true):
  - A VOD ad, an inline ad or a linear channel pre-roll that is playing when the user leaves is
    paused and its UI hidden; it resumes from the same point and plays to completion when the
    user comes back. Its progress and quartile tracking do not advance meanwhile.
  - VOD mid-roll and post-roll breaks are not requested while the user is away.
  - Ads inserted into a linear stream keep playing while the user is away; only the ad UI is
    hidden.
  - CTA ("more info") is restricted while the user is away.
- Which video goes into PIP is decided by the app: the AVPlayerViewController or the
  AVPlayerLayer of the content player. The SDK cannot stop it, so the app must.
- canStartPictureInPictureAutomaticallyFromInline (iOS 14.2+) only controls automatic PIP.
  The built-in PIP button of AVPlayerViewController is controlled by
  allowsPictureInPicturePlayback.

========================================
IMPLEMENTATION
========================================

1. Notify the user leaving and returning, from the app lifecycle (for any PIP_SOURCE).
   If the code calls FlowerSdk.notifyPictureInPictureModeChanged in a PIP delegate, remove that
   call (keep the rest of the delegate).
   UIKit (in the playback view controller):
     override func viewDidLoad() {
         super.viewDidLoad()
         NotificationCenter.default.addObserver(self, selector: #selector(onDidEnterBackground),
             name: UIApplication.didEnterBackgroundNotification, object: nil)
         NotificationCenter.default.addObserver(self, selector: #selector(onWillEnterForeground),
             name: UIApplication.willEnterForegroundNotification, object: nil)
     }
     @objc private func onDidEnterBackground() { FlowerSdk.notifyUserLeftApp(true) }
     @objc private func onWillEnterForeground() { FlowerSdk.notifyUserLeftApp(false) }
   (With a scene delegate, sceneDidEnterBackground(_:) -> true and
   sceneWillEnterForeground(_:) -> false work the same way.)
   SwiftUI (in the playback view):
     @Environment(\.scenePhase) private var scenePhase
     .onChange(of: scenePhase) { phase in
         switch phase {
         case .background: FlowerSdk.notifyUserLeftApp(true)
         case .active: FlowerSdk.notifyUserLeftApp(false)
         default: break
         }
     }
   SwiftUI VideoPlayer / FlowerVideoPlayer have no PIP controls of their own. If the app needs
   PIP, host an AVPlayerViewController with UIViewControllerRepresentable for step 2.

2. Block PIP while an ad plays (VOD, inline, linear pre-roll). In the existing
   FlowerAdsManagerListener (or a UI listener added with player.addAdListener for FlowerAVPlayer):
   var isAdPlaying = false
   func onPlay() { DispatchQueue.main.async { self.setAdPlaying(true) } }
   func onCompleted() { DispatchQueue.main.async { self.setAdPlaying(false) } }
   func onError(error: FlowerError?) { DispatchQueue.main.async { self.setAdPlaying(false) } }
   Keep the other listener code (play() in onPrepare, content start logic, and the rest of
   onError: starting the content after a pre-roll error, player.play() after a VOD mid-roll
   error, or the linear channel restart) unchanged.

   func setAdPlaying(_ playing: Bool) {
       isAdPlaying = playing
       // PIP_SOURCE avplayerviewcontroller:
       playerViewController.allowsPictureInPicturePlayback = !playing
       if #available(iOS 14.2, *) {
           playerViewController.canStartPictureInPictureAutomaticallyFromInline = !playing
       }
       // PIP_SOURCE avpictureinpicturecontroller:
       if #available(iOS 14.2, *) {
           pipController?.canStartPictureInPictureAutomaticallyFromInline = !playing
       }
   }
   PIP_SOURCE avpictureinpicturecontroller: in your own PIP button action,
   guard !isAdPlaying else { return } before pipController?.startPictureInPicture().

3. Linear stream ads (changeChannelUrl / FlowerLinearTvAdConfig) need only step 1; do not block
   PIP for them unless the product requires it.

========================================
RULES
========================================

DO:
- Notify both leaving (true) and returning (false), on every screen that plays ads, whether or
  not the app enters PIP.
- Restore PIP permission in onCompleted and onError.

DO NOT:
- Do NOT use FlowerSdk.notifyPictureInPictureModeChanged (deprecated) or notify the SDK only
  from PIP delegate callbacks; they never fire while an ad plays.
- Do NOT pause, stop or seek the ad or the content when the user leaves or returns; the SDK
  pauses and resumes the ad itself.
- Do NOT call FlowerSdk.setIgnoreAdBreakInPIPMode(false) here (that is the "VOD ads in PIP
  mode" case).
- Do NOT change any other part of the ad integration.

========================================
VERIFY
========================================

- During content: PIP works; after returning, the next mid-roll plays normally.
- During an ad: the PIP button is disabled / does nothing, and going home does not start PIP.
- Going home during an ad: the ad pauses; back in the app it resumes from the same point and
  plays to completion.
- In PIP, VOD content reaching a mid-roll position: no ad is requested.
- Linear stream ad while the user is away: keeps playing; the ad UI comes back on return.

========================================
OUTPUT
========================================

- Modify the code I paste below; keep its structure and names.
- Generate only the code for the selected PIP_SOURCE.
- List every file you changed or added.
- Do not add code for other cases.

My code:
```
