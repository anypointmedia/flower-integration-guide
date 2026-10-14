---
sidebar_position: 2.5
sidebar_label: VOD PIP Without Ads (Default)
---

# VOD — PIP Without Ads (Default)

Use this prompt when your VOD app supports Picture-in-Picture and keeps the default mode, in which ads are not shown in PIP mode (`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`). So that PIP cannot be used to skip an ad, the app reports to the SDK when the user leaves the app and comes back: `FlowerSdk.notifyUserLeftApp(true)` when the user goes to the home screen (the app goes to the background), and `FlowerSdk.notifyUserLeftApp(false)` when the user returns to the app. Start from a working [VOD with MediaPlayerHook](./media-player-hook) or [VOD with FlowerAVPlayer](./flower-avplayer) integration. To keep VOD ads playing in PIP instead, use [VOD Ads in PIP Mode](./ads-in-pip-mode). See [PIP Mode Support](../../../getting-started/pip-mode-support) and [VOD PIP Mode Support](../../../ad-insertion/vod/pip-mode-support#ads-in-pip-mode-default).

:::danger While an ad is playing
From the listener's `onPlay` until `onCompleted` or `onError`, an ad is playing. During that time, the app must **not** switch the content player into PIP when the user goes to the home screen (neither automatic PIP nor the PIP button). The SDK pauses the ad when the app calls `notifyUserLeftApp(true)`, and the ad resumes **only** when the app calls `notifyUserLeftApp(false)` after the user returns to the app. Without that call, the ad stays paused.
:::

| Parameter | Values | Description |
|-----------|--------|-------------|
| `UI_FRAMEWORK` | `swiftui` \| `uikit` | UI framework of the playback screen |
| `PLAYER` | `AVPlayer` \| `AVQueuePlayer` \| `FlowerAVPlayer` | The content player |
| `PIP_SOURCE` | `avplayerviewcontroller` \| `avpictureinpicturecontroller` | Where PIP comes from: the built-in PIP of `AVPlayerViewController` (also `FlowerAVPlayerViewController`), or your own `AVPictureInPictureController` on an `AVPlayerLayer` |

```plain
Our iOS app already plays FLOWER SDK VOD ads in the default mode and supports Picture-in-Picture.
Ads must NOT be shown in PIP mode. Add the handling the SDK needs when the user leaves the app
and comes back, and block PIP while an ad is playing. Modify the code I paste below.

========================================
GOAL
========================================

- The SDK always knows whether the user is away from the app: notifyUserLeftApp(true) when the
  user goes to the home screen (the app goes to the background), notifyUserLeftApp(false) when
  the user comes back to the app.
- While an ad is playing, the content player never goes into PIP, so PIP cannot be used to
  skip the ad.
- When no ad is playing, the content can go into PIP as usual.

========================================
PARAMETERS
========================================

UI_FRAMEWORK: {{UI_FRAMEWORK}}   (swiftui | uikit)
PLAYER: {{PLAYER}}               (AVPlayer | AVQueuePlayer | FlowerAVPlayer)
PIP_SOURCE: {{PIP_SOURCE}}       (avplayerviewcontroller | avpictureinpicturecontroller)

========================================
IMPORTANT - WHILE AN AD IS PLAYING
========================================

- An ad is playing from the listener's onPlay until onCompleted or onError. Track it in an
  isAdPlaying flag set from exactly these callbacks.
- While isAdPlaying is true, the app must NOT switch the content player into PIP when the user
  goes to the home screen: turn off automatic PIP and the PIP button, and restore them in
  onCompleted and onError.
- The app still calls notifyUserLeftApp(true) when the user goes home during the ad: the SDK
  pauses the ad and hides its UI.
- When the user comes back to the app, the app MUST call notifyUserLeftApp(false). Only then
  does the SDK resume the paused ad from where it stopped. Without this call the ad stays
  paused and the content never continues.

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- Default FlowerSdk.setIgnoreAdBreakInPIPMode(true): the SDK plays every VOD ad (pre-roll,
  mid-roll, post-roll) in its own ad player, drawn by FlowerAdView over the content. Ads are
  not shown in PIP mode.
- The SDK does not detect leaving or returning by itself. The app must call
  FlowerSdk.notifyUserLeftApp(true) when the user leaves the app (home screen, another app, or
  the video moved to a PIP window) and FlowerSdk.notifyUserLeftApp(false) when the user comes
  back.
- FlowerSdk.notifyPictureInPictureModeChanged(_:) is deprecated and replaced by
  notifyUserLeftApp(_:). Existing calls keep working; use notifyUserLeftApp(_:) here.
- An ad that is playing when the user leaves is paused and its UI hidden; it resumes from the
  same point and plays to completion after notifyUserLeftApp(false). Its progress and quartile
  tracking do not advance meanwhile.
- Mid-roll and post-roll breaks are not requested while the user is away (for example while
  the content plays in the PIP window).
- CTA ("more info") is restricted while the user is away.
- Which video goes into PIP is decided by the app: the AVPlayerViewController or the
  AVPlayerLayer of the content player. The SDK cannot stop it, so the app must.
- Because PIP is blocked during an ad, PIP delegate callbacks never fire then. So report
  leaving/returning from the app lifecycle (background / foreground), not from the PIP delegate.
- canStartPictureInPictureAutomaticallyFromInline (iOS 14.2+) only controls automatic PIP.
  The built-in PIP button of AVPlayerViewController is controlled by
  allowsPictureInPicturePlayback.

========================================
IMPLEMENTATION
========================================

1. Check first: if the code calls FlowerSdk.setIgnoreAdBreakInPIPMode(false), STOP and tell me
   - that is the "VOD ads in PIP mode" case, not this one. Do not add a call with true either;
   it is the default.

2. Notify the user leaving and returning, from the app lifecycle.
   If the code calls FlowerSdk.notifyPictureInPictureModeChanged in a PIP delegate, remove that
   call (keep the rest of the delegate).
   UI_FRAMEWORK uikit (in the playback view controller):
     override func viewDidLoad() {
         super.viewDidLoad()
         NotificationCenter.default.addObserver(self, selector: #selector(onDidEnterBackground),
             name: UIApplication.didEnterBackgroundNotification, object: nil)
         NotificationCenter.default.addObserver(self, selector: #selector(onWillEnterForeground),
             name: UIApplication.willEnterForegroundNotification, object: nil)
     }
     // The user went to the home screen (or another app, or PIP)
     @objc private func onDidEnterBackground() { FlowerSdk.notifyUserLeftApp(true) }
     // The user came back: required to resume a paused ad
     @objc private func onWillEnterForeground() { FlowerSdk.notifyUserLeftApp(false) }
   (With a scene delegate, sceneDidEnterBackground(_:) -> true and
   sceneWillEnterForeground(_:) -> false work the same way.)
   UI_FRAMEWORK swiftui (in the playback view):
     @Environment(\.scenePhase) private var scenePhase
     .onChange(of: scenePhase) { phase in
         switch phase {
         case .background: FlowerSdk.notifyUserLeftApp(true)
         case .active: FlowerSdk.notifyUserLeftApp(false)
         default: break
         }
     }
   SwiftUI VideoPlayer / FlowerVideoPlayer have no PIP controls of their own. If the app needs
   PIP, host an AVPlayerViewController with UIViewControllerRepresentable for step 3.

3. Block PIP while an ad plays. Set the flag in the existing listener and keep its other code
   (play() in onPrepare, the content start logic, and the rest of onError: pre-roll error ->
   start the content, "playback unrecoverable" -> reload the content or show an error,
   mid-roll error -> player.play(), post-roll error -> no resume) unchanged:
   - PLAYER AVPlayer / AVQueuePlayer: the FlowerAdsManagerListener added to
     flowerAdView.adsManager.
   - PLAYER FlowerAVPlayer: the AdListener added with player.addAdListener (add an onAdPlay
     closure next to onAdCompleted / onAdError).

   var isAdPlaying = false
   func onPlay() { DispatchQueue.main.async { self.setAdPlaying(true) } }
   func onCompleted() { DispatchQueue.main.async { self.setAdPlaying(false) } }
   func onError(error: FlowerError?) { DispatchQueue.main.async { self.setAdPlaying(false) } }

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

4. When the screen is released, reset isAdPlaying to false and remove the lifecycle observers
   together with the existing release code.

========================================
RULES
========================================

DO:
- While an ad is playing (onPlay until onCompleted/onError), keep the content player out of
  PIP: no automatic PIP, no PIP button.
- Call notifyUserLeftApp(true) whenever the user goes to the home screen, during an ad or the
  content, whether or not the app enters PIP.
- Call notifyUserLeftApp(false) every time the user comes back to the app - it is what resumes
  a paused ad.
- Restore PIP permission in onCompleted and onError.

DO NOT:
- Do NOT switch the content player into PIP while an ad is playing.
- Do NOT notify the SDK only from PIP delegate callbacks or use
  notifyPictureInPictureModeChanged (deprecated); the callbacks never fire while an ad plays.
- Do NOT pause, stop, seek or resume the ad or the content yourself when the user leaves or
  returns; the SDK pauses and resumes the ad itself.
- Do NOT call FlowerSdk.setIgnoreAdBreakInPIPMode(false) (that is the "VOD ads in PIP mode"
  case).
- Do NOT change any other part of the ad integration.

========================================
VERIFY
========================================

- Go home during the content: PIP starts (if enabled) and notifyUserLeftApp(true) is called.
- Go home during a pre-roll or mid-roll: PIP does not start, the PIP button is disabled /
  does nothing, and the ad pauses.
- Return to the app: notifyUserLeftApp(false) is called, the ad resumes from where it stopped
  and plays to completion, then the content continues.
- Return to the app without the false call (temporarily remove it): the ad stays paused -
  confirms the call is required. Put it back.
- In PIP, the content reaching a mid-roll position: no ad is requested.
- After returning from PIP, the next mid-roll plays normally and PIP works again after the ad.
- Ad error during a mid-roll: PIP permission is restored and the content keeps playing.

========================================
OUTPUT
========================================

- Modify the code I paste below; keep its structure and names.
- Generate only the code for the selected UI_FRAMEWORK, PLAYER and PIP_SOURCE.
- List every file you changed or added.
- Do not add code for other cases (linear TV, ads in PIP mode).

My code:
```
