---
sidebar_position: 2
---

# Step 2: Ad UI Declaration & Player Creation

This prompt guides LLM to set up the ad display view and create the video player for iOS.

**Before using:** Fill in `{{AD_TYPE}}`, `{{APPROACH}}`, and `{{UI_FRAMEWORK}}`.

```plain
We are integrating the FLOWER SDK into our iOS project.
This step sets up the ad display UI and creates the video player.

AD_TYPE: {{AD_TYPE}}
(linear-tv | vod | interstitial)

APPROACH: {{APPROACH}}
(flower-player | media-player-hook)
Note: For interstitial AD_TYPE, no APPROACH selection is needed.

UI_FRAMEWORK: {{UI_FRAMEWORK}}
(swiftui | uikit)

========================================
PART 1 — Declare the Ad UI
========================================

If APPROACH is "flower-player":
    Use FlowerAVPlayer only. Do NOT use plain AVQueuePlayer — that is for media-player-hook.
    Use FlowerAVPlayer with FlowerVideoPlayer (SwiftUI) or FlowerAVPlayerViewController (UIKit).
    No separate FlowerAdView needed — FlowerAVPlayer manages ads internally.

    SwiftUI:
    import FlowerSdk
    struct PlaybackView: View {
        @State private var player = FlowerAVPlayer()
        var body: some View {
            FlowerVideoPlayer(player: player)
        }
    }

    UIKit:
    import FlowerSdk
    class PlaybackViewController: UIViewController {
        private let player = FlowerAVPlayer()
        override func viewDidLoad() {
            super.viewDidLoad()
            let pvc = FlowerAVPlayerViewController()
            pvc.player = player
            pvc.allowsPictureInPicturePlayback = true
            pvc.canStartPictureInPictureAutomaticallyFromInline = true
            view.addSubview(pvc.view)
            addChild(pvc)
            pvc.didMove(toParent: self)
        }
    }

If APPROACH is "media-player-hook":
    Use AVQueuePlayer with MediaPlayerHook. Do NOT use FlowerAVPlayer — that is for flower-player.
    Use AVQueuePlayer + FlowerAdView overlaid on top.

    SwiftUI:
    import FlowerSdk
    struct PlaybackView: View {
        @State private var player = AVQueuePlayer()
        @StateObject private var flowerAdView = FlowerAdView()
        var body: some View {
            ZStack {
                VideoPlayer(player: player)
                flowerAdView.body
            }
        }
    }

    UIKit:
    import FlowerSdk
    class PlaybackViewController: UIViewController {
        private var player = AVQueuePlayer()
        private var flowerAdViewHostingController = FlowerAdView.HostingController()
        private var flowerAdView: FlowerAdView {
            flowerAdViewHostingController.adView
        }
        override func viewDidLoad() {
            super.viewDidLoad()
            let playerVC = AVPlayerViewController()
            playerVC.player = player
            view.addSubview(playerVC.view)
            addChild(playerVC)
            playerVC.didMove(toParent: self)

            view.addSubview(flowerAdViewHostingController.view)
            addChild(flowerAdViewHostingController)
            flowerAdViewHostingController.didMove(toParent: self)

            flowerAdViewHostingController.view.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                flowerAdViewHostingController.view.topAnchor.constraint(equalTo: playerVC.view.topAnchor),
                flowerAdViewHostingController.view.bottomAnchor.constraint(equalTo: playerVC.view.bottomAnchor),
                flowerAdViewHostingController.view.leadingAnchor.constraint(equalTo: playerVC.view.leadingAnchor),
                flowerAdViewHostingController.view.trailingAnchor.constraint(equalTo: playerVC.view.trailingAnchor)
            ])
        }
    }

If AD_TYPE is "interstitial":
    Do NOT use FlowerAVPlayer or AVQueuePlayer for interstitial — no video player is needed.
    Only FlowerAdView needed. No video player.

    SwiftUI:
    import FlowerSdk
    struct InterstitialAdView: View {
        private let flowerAdView = FlowerAdView()
        var body: some View {
            ZStack {
                Text("Original Content")
                flowerAdView.body
            }
        }
    }

    UIKit:
    import FlowerSdk
    class InterstitialAdViewController: UIViewController {
        private var flowerAdViewHostingController = FlowerAdView.HostingController()
        private var flowerAdView: FlowerAdView {
            flowerAdViewHostingController.adView
        }
        override func viewDidLoad() {
            super.viewDidLoad()
            view.addSubview(flowerAdViewHostingController.view)
            addChild(flowerAdViewHostingController)
            flowerAdViewHostingController.didMove(toParent: self)
        }
    }

========================================
CONSTRAINTS
========================================

- For flower-player: Use FlowerAVPlayer (not AVPlayer or AVQueuePlayer).
- For media-player-hook: Use AVQueuePlayer (not AVPlayer) to support ad playlist management.
- FlowerAdView in SwiftUI is accessed via .body property inside ZStack.
- FlowerAdView in UIKit requires FlowerAdView.HostingController() wrapper.
- Supported FlowerPlayer: FlowerAVPlayer (wraps AVPlayer internally).
```
