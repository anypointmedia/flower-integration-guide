---
sidebar_position: 5
---

# Integrated Prompt (All Steps)

This prompt covers the full Flower SDK integration for iOS in a single prompt. It contains the complete content from Steps 1–4.

**Before using:** Replace all `{{...}}` placeholders.

```plain
We are integrating the FLOWER SDK into our iOS project. Generate complete integration code for the following configuration:

========================================
PARAMETERS
========================================

AD_TYPE: {{AD_TYPE}}
(linear-tv | vod | interstitial)

APPROACH: {{APPROACH}}
(flower-player | media-player-hook)
Note: For interstitial AD_TYPE, no APPROACH selection is needed.

UI_FRAMEWORK: {{UI_FRAMEWORK}}
(swiftui | uikit)

AD_TAG_URL: {{AD_TAG_URL}}
PREROLL_AD_TAG_URL: {{PREROLL_AD_TAG_URL}}
CHANNEL_ID / CONTENT_ID: {{CHANNEL_ID_OR_CONTENT_ID}}
CONTENT_DURATION_MS: {{CONTENT_DURATION_MS}}

################################################################
STEP 1 — Project Setup & SDK Initialization
################################################################

========================================
STEP 1-1 — Add FLOWER SDK Dependency (Swift Package Manager)
========================================

1. In Xcode, go to File > Add Package Dependencies…
2. Enter the repository URL:
   https://github.com/anypointmedia/flower-sdk-ios
3. Select FlowerSdk and add it to your iOS app target.
4. Verify the SDK appears in your project's General settings tab under Frameworks.

========================================
STEP 1-2 — Initialize and Release SDK
========================================

Environment modes:
- "local": Local environment, default log level Verbose
- "dev": Development environment, error logs saved to server, default log level Info
- "prod": Production environment, error logs saved to server, default log level Warn

--------------------------------------------------
SwiftUI (recommended to use UIApplicationDelegateAdaptor):

import UIKit
import SwiftUI
import FlowerSdk

class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FlowerSdk.setEnv(env: "local")  // Change to "dev" or "prod" as appropriate
        FlowerSdk.doInit()
        return true
    }

}

@main
struct YourApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

--------------------------------------------------
UIKit:

import UIKit
import FlowerSdk

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FlowerSdk.setEnv(env: "local")
        FlowerSdk.doInit()
        return true
    }

}

========================================
STEP 1-3 — Info.plist Configuration
========================================

Add the following to Info.plist:

1. Allow HTTP traffic (required for ad/stream requests):
   NSAppTransportSecurity > NSAllowsArbitraryLoads = YES

2. For Linear TV with background playback:
   UIBackgroundModes > audio

################################################################
STEP 2 — Ad UI Declaration & Player Creation
################################################################

========================================
STEP 2-1 — Declare the Ad UI
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

################################################################
STEP 3 — Ad Integration
################################################################

========================================
STEP 3-1 — Implement FlowerAdsManagerListener
========================================

IMPORTANT: The FlowerAdsManagerListener protocol requires ALL of these methods:
  - onPrepare(adDurationMs: Int32)
  - onPlay()
  - onCompleted()
  - onError(error: FlowerError?)
  - onAdSkipped(reason: Int32)
  - onAdBreakPrepare(adInfos: NSMutableArray)

You MUST implement all 6 methods even if some are empty. Missing methods cause compile errors.
Store the listener as a property (not a local variable) for later cleanup.

--------------------------------------------------
If AD_TYPE is "linear-tv":

For FlowerPlayer (FlowerAVPlayer):
  Listener is optional. Mainly for UI control (show/hide ad indicators).

  SwiftUI — implement as class holding view reference:
  class AdsManagerListenerImpl: FlowerAdsManagerListener {
      func onPrepare(adDurationMs: Int32) {}
      func onPlay() { /* hide player controls */ }
      func onCompleted() { /* show player controls */ }
      func onError(error: FlowerError?) { /* restart playback */ }
      func onAdSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

  UIKit — conform on ViewController:
  extension PlaybackViewController: FlowerAdsManagerListener {
      func onPrepare(adDurationMs: Int32) {}
      func onPlay() {}
      func onCompleted() {}
      func onError(error: FlowerError?) {}
      func onAdSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

For MediaPlayerHook:
  Same listener but register on flowerAdView.adsManager:
  flowerAdView.adsManager.addListener(adsManagerListener: listener)

--------------------------------------------------
If AD_TYPE is "vod":

For FlowerPlayer:
  Same as linear-tv — listener is optional for UI control only.

For MediaPlayerHook:
  VOD requires active content pause/resume.
  - onPrepare: Call flowerAdView.adsManager.play()
  - onPlay: Pause content (player.pause())
  - onCompleted: Resume content (player.play()) if not ended
  - onError: Resume content if not ended

  SwiftUI:
  class AdsManagerListenerImpl: FlowerAdsManagerListener {
      var view: PlaybackView
      init(_ view: PlaybackView) { self.view = view }

      func onPrepare(adDurationMs: Int32) {
          DispatchQueue.main.async {
              if self.view.player.rate != 0.0 {
                  Task {
                      try await Task.sleep(nanoseconds: 5_000_000_000)
                      self.view.flowerAdView.adsManager.play()
                  }
              } else {
                  self.view.flowerAdView.adsManager.play()
              }
          }
      }
      func onPlay() {
          DispatchQueue.main.async { self.view.player.pause() }
      }
      func onCompleted() {
          DispatchQueue.main.async {
              if !self.view.isContentEnd { self.view.player.play() }
          }
      }
      func onError(error: FlowerError?) {
          DispatchQueue.main.async {
              if !self.view.isContentEnd { self.view.player.play() }
          }
      }
      func onAdSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

  Detect content end:
  NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: playerItem, queue: .main) { _ in
      isContentEnd = true
      flowerAdView.adsManager.notifyContentEnded()
  }

--------------------------------------------------
If AD_TYPE is "interstitial":

  - onPrepare: Call flowerAdView.adsManager.play()
  - onCompleted/onError: Call stop() and removeListener()

  class AdsManagerListenerImpl: FlowerAdsManagerListener {
      var adView: FlowerAdView
      init(_ adView: FlowerAdView) { self.adView = adView }

      func onPrepare(adDurationMs: Int32) {
          DispatchQueue.main.async { self.adView.adsManager.play() }
      }
      func onPlay() {}
      func onCompleted() {
          DispatchQueue.main.async {
              self.adView.adsManager.stop()
              self.adView.adsManager.removeListener(adsManagerListener: self)
          }
      }
      func onError(error: FlowerError?) {
          DispatchQueue.main.async {
              self.adView.adsManager.stop()
              self.adView.adsManager.removeListener(adsManagerListener: self)
          }
      }
      func onAdSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

========================================
STEP 3-2 — Request Ads / Start Playback
========================================

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "flower-player":

  Use values from your config data — do NOT hardcode URLs or parameters.

  let adConfig = FlowerLinearTvAdConfig(
      adTagUrl: config.adTagUrl,
      prerollAdTagUrl: config.prerollAdTagUrl,
      channelId: config.channelId,
      extraParams: config.extraParams,
      adTagHeaders: config.adTagHeaders ?? [:],
      channelStreamHeaders: config.channelStreamHeaders ?? [:]
  )
  player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: config.contentUrl)!), adConfig: adConfig)
  player.play()

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "media-player-hook":

  Use values from your config data — do NOT hardcode URLs or parameters.

  class MediaPlayerHookImpl: MediaPlayerHook {
      private let fn: () -> Any
      init(_ fn: @escaping () -> Any) { self.fn = fn }
      func getPlayer() -> Any? { fn() }
  }

  let hook = MediaPlayerHookImpl { self.player }
  let changedUrl = adView.adsManager.changeChannelUrl(
      videoUrl: config.contentUrl,
      adTagUrl: config.adTagUrl,
      channelId: config.channelId,
      extraParams: config.extraParams,
      mediaPlayerHook: hook,
      adTagHeaders: config.adTagHeaders ?? [:],
      channelStreamHeaders: config.channelStreamHeaders ?? [:],
      prerollAdTagUrl: config.prerollAdTagUrl
  )
  player.removeAllItems()
  player.insert(AVPlayerItem(url: URL(string: changedUrl)!), after: nil)
  player.play()

--------------------------------------------------
If AD_TYPE is "vod" AND APPROACH is "flower-player":

  Use values from your config data — do NOT hardcode URLs or parameters.

  let adConfig = FlowerVodAdConfig(
      adTagUrl: config.adTagUrl,
      contentId: config.contentId,
      contentDuration: config.contentDuration,
      extraParams: config.extraParams,
      adTagHeaders: config.adTagHeaders ?? [:]
  )
  player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: config.contentUrl)!), adConfig: adConfig)
  player.play()

--------------------------------------------------
If AD_TYPE is "vod" AND APPROACH is "media-player-hook":

  Use values from your config data — do NOT hardcode URLs or parameters.

  adView.adsManager.requestVodAd(
      adTagUrl: config.adTagUrl,
      contentId: config.contentId,
      durationMs: config.contentDuration,
      extraParams: config.extraParams,
      mediaPlayerHook: hook,
      adTagHeaders: config.adTagHeaders ?? [:]
  )
  let item = AVPlayerItem(url: URL(string: config.contentUrl)!)
  player.removeAllItems()
  player.insert(item, after: nil)
  player.play()

--------------------------------------------------
If AD_TYPE is "interstitial":

  Use values from your config data — do NOT hardcode URLs or parameters.

  flowerAdView.adsManager.requestAd(
      adTagUrl: config.adTagUrl,
      extraParams: config.extraParams ?? [:],
      adTagHeaders: config.adTagHeaders ?? [:]
  )

################################################################
STEP 4 — Cleanup, Release & Extras
################################################################

========================================
STEP 4-1 — Cleanup on View Disappear
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
STEP 4-2 — Picture-in-Picture Support (Optional)
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
STEP 4-3 — Audio Session Configuration (Linear TV)
========================================

For linear TV background playback, configure audio session:

  let session = AVAudioSession.sharedInstance()
  try session.setCategory(.playback, mode: .moviePlayback, options: [])
  try session.setActive(true)

################################################################
OUTPUT REQUIREMENTS
################################################################

- Generate complete, compilable Swift files for the selected UI_FRAMEWORK.
- Use the exact API names shown above (FlowerSdk.doInit(), FlowerAVPlayer, FlowerAdView, etc.).
- Include all imports (FlowerSdk, AVKit, AVFoundation, etc.).
- Provide inline comments explaining each integration point.
- Follow the conditional branches matching the specified AD_TYPE, APPROACH, and UI_FRAMEWORK only.
- Generate ONLY the code for the selected parameters. Do NOT include code from other branches.

################################################################
CONSTRAINTS (All Steps Combined)
################################################################

Step 1:
- iOS SDK uses FlowerSdk.doInit() (not FlowerSdk.init()).
- iOS SDK does NOT require an explicit destroy/release call.
- import FlowerSdk is required in all files using the SDK.

Step 2:
- For flower-player: Use FlowerAVPlayer (not AVPlayer or AVQueuePlayer).
- For media-player-hook: Use AVQueuePlayer (not AVPlayer) to support ad playlist management.
- FlowerAdView in SwiftUI is accessed via .body property inside ZStack.
- FlowerAdView in UIKit requires FlowerAdView.HostingController() wrapper.
- Supported FlowerPlayer: FlowerAVPlayer (wraps AVPlayer internally).

Step 3:
- iOS uses removeListener(adsManagerListener:) with named parameter.
- FlowerAVPlayer uses replaceCurrentItem(with:adConfig:) — NOT setMediaItem().
- MediaPlayerHook for iOS: implement getPlayer() -> Any? returning the AVQueuePlayer.
- All listener callbacks must dispatch to main thread via DispatchQueue.main.async.
- MediaPlayerAdapter is available for Linear TV only (changeChannelUrl overload).
- For VOD MediaPlayerHook, call notifyContentEnded() when AVPlayerItemDidPlayToEndTime fires.

Step 4:
- Always remove listener BEFORE stopping adsManager.
- iOS SDK does NOT require an explicit destroy/release call in applicationWillTerminate.
- For FlowerAVPlayer, replaceCurrentItem(with: nil) releases all resources.
- For AVQueuePlayer, call removeAllItems() to release.
- PiP delegate is only needed for UIKit with media-player-hook approach.
```
