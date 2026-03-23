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
      flowerAdView.adsManager.stop()
      player.pause()
      player.removeAllItems()
  }

  UIKit (viewWillDisappear):
  override func viewWillDisappear(_ animated: Bool) {
      super.viewWillDisappear(animated)
      flowerAdView.adsManager.removeListener(adsManagerListener: self)
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

UIKit — implement AVPlayerViewControllerDelegate:

  playerViewController.delegate = self

  extension PlaybackViewController: AVPlayerViewControllerDelegate {
      func playerViewControllerWillStartPictureInPicture(_ playerViewController: AVPlayerViewController) {
          FlowerSdk.notifyPictureInPictureModeChanged(true)
      }
      func playerViewControllerDidStopPictureInPicture(_ playerViewController: AVPlayerViewController) {
          FlowerSdk.notifyPictureInPictureModeChanged(false)
      }
  }

  Enable PiP on player view controller:
  playerViewController.allowsPictureInPicturePlayback = true
  playerViewController.canStartPictureInPictureAutomaticallyFromInline = true

SwiftUI — FlowerVideoPlayer handles PiP automatically for FlowerPlayer approach.

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
- PiP delegate is only needed for UIKit with media-player-hook approach.
```
