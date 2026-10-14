---
sidebar_position: 4
---

# Step 4: Cleanup, Release & Extras

This prompt guides LLM to implement proper resource cleanup and PiP support for iOS.

**Before using:** Fill in `{{AD_TYPE}}`, `{{APPROACH}}`, and `{{UI_FRAMEWORK}}`.

```plain
We are integrating the FLOWER SDK into our iOS project.
This step implements cleanup and optional PiP support.

AD_TYPE: {{AD_TYPE}}
(linear-tv | vod | interstitial)

APPROACH: {{APPROACH}}
(flower-player | media-player-hook)
Note: For interstitial AD_TYPE, no APPROACH selection is needed.

UI_FRAMEWORK: {{UI_FRAMEWORK}}
(swiftui | uikit)

========================================
PART 1 — Cleanup on View Disappear
========================================

If APPROACH is "flower-player":

  SwiftUI (.onDisappear):
  .onDisappear {
      player.pause()
      player.replaceCurrentItem(with: nil)
  }

  UIKit (viewWillDisappear):
  override func viewWillDisappear(_ animated: Bool) {
      super.viewWillDisappear(animated)
      player.pause()
      player.replaceCurrentItem(with: nil)
  }

If APPROACH is "media-player-hook":

  SwiftUI (.onDisappear):
  .onDisappear {
      if let listener = adsManagerListener {
          flowerAdView.adsManager.removeListener(adsManagerListener: listener)
      }
      if let observer = contentEndObserver {
          NotificationCenter.default.removeObserver(observer)
      }
      if let preroll = prerollListener {   // linear-tv: a pre-roll that has not ended yet
          flowerAdView.adsManager.removeListener(adsManagerListener: preroll)
          prerollListener = nil
          pendingChannelUrl = nil
      }
      flowerAdView.adsManager.stop()
      player.pause()
      player.removeAllItems()
  }

  UIKit (viewWillDisappear):
  override func viewWillDisappear(_ animated: Bool) {
      super.viewWillDisappear(animated)
      flowerAdView.adsManager.removeListener(adsManagerListener: self)
      if let observer = contentEndObserver {
          NotificationCenter.default.removeObserver(observer)
      }
      if let preroll = prerollListener {   // linear-tv: a pre-roll that has not ended yet
          flowerAdView.adsManager.removeListener(adsManagerListener: preroll)
          prerollListener = nil
          pendingChannelUrl = nil
      }
      flowerAdView.adsManager.stop()
      player.pause()
      player.removeAllItems()
  }

If AD_TYPE is "interstitial":

  SwiftUI (.onDisappear):
  .onDisappear {
      flowerAdView.adsManager.removeListener(adsManagerListener: listener)
      flowerAdView.adsManager.stop()
  }

  UIKit (viewDidDisappear):
  override func viewDidDisappear(_ animated: Bool) {
      super.viewDidDisappear(animated)
      flowerAdView.adsManager.removeListener(adsManagerListener: self)
      flowerAdView.adsManager.stop()
  }

========================================
PART 2 — Picture-in-Picture Support (Optional)
========================================

Available in Flower iOS SDK version 2.2.0+.

Report the user leaving the app (home screen, another app, or the video moved to a PiP window)
with FlowerSdk.notifyUserLeftApp(true), and coming back with FlowerSdk.notifyUserLeftApp(false).
Report it from the app lifecycle, whether or not the app enters PiP: while an ad plays the
content must not go into PiP, so PiP delegate callbacks never fire during an ad.
FlowerSdk.notifyPictureInPictureModeChanged(_:) is deprecated and replaced by
notifyUserLeftApp(_:). Existing calls keep working.

UIKit — observe the app lifecycle in the playback view controller:

  NotificationCenter.default.addObserver(self, selector: #selector(onDidEnterBackground),
      name: UIApplication.didEnterBackgroundNotification, object: nil)
  NotificationCenter.default.addObserver(self, selector: #selector(onWillEnterForeground),
      name: UIApplication.willEnterForegroundNotification, object: nil)

  @objc private func onDidEnterBackground() { FlowerSdk.notifyUserLeftApp(true) }
  @objc private func onWillEnterForeground() { FlowerSdk.notifyUserLeftApp(false) }

  (With a scene delegate, sceneDidEnterBackground(_:) -> true and
  sceneWillEnterForeground(_:) -> false work the same way.)

  Enable PiP on player view controller:
  playerViewController.allowsPictureInPicturePlayback = true
  playerViewController.canStartPictureInPictureAutomaticallyFromInline = true

  Ads are not supported in PiP by default (FlowerSdk.setIgnoreAdBreakInPIPMode(true)), so do
  not let the content go into PiP while an ad is playing.
  canStartPictureInPictureAutomaticallyFromInline (iOS 14.2+) only stops automatic PiP;
  the built-in PiP button of AVPlayerViewController stays enabled. In onPlay set both
  playerViewController.allowsPictureInPicturePlayback and
  playerViewController.canStartPictureInPictureAutomaticallyFromInline to false, and set
  them back to true in onCompleted and onError (on the main thread).

SwiftUI — observe scenePhase in the playback view:

  @Environment(\.scenePhase) private var scenePhase
  .onChange(of: scenePhase) { phase in
      switch phase {
      case .background: FlowerSdk.notifyUserLeftApp(true)
      case .active: FlowerSdk.notifyUserLeftApp(false)
      default: break
      }
  }

  FlowerVideoPlayer (a SwiftUI VideoPlayer) has no PiP controls of its own. If the app supports
  PiP, host an AVPlayerViewController (UIViewControllerRepresentable) and block its PiP while
  an ad plays as above.

========================================
PART 3 — Audio Session Configuration (Linear TV)
========================================

For linear TV background playback, configure audio session:

  let session = AVAudioSession.sharedInstance()
  try session.setCategory(.playback, mode: .moviePlayback, options: [])
  try session.setActive(true)

========================================
CONSTRAINTS
========================================

- Always remove listener BEFORE stopping adsManager.
- iOS SDK does NOT require an explicit destroy/release call.
- For FlowerAVPlayer, replaceCurrentItem(with: nil) releases all resources.
- For AVQueuePlayer, call removeAllItems() to release.
- Notify the user leaving and returning (FlowerSdk.notifyUserLeftApp(true/false)) from the app
  lifecycle in every approach, including FlowerAVPlayer, whether or not the app enters PiP.
  The SDK does not detect it by itself.
```
