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
  - onAdBreakSkipped(reason: Int32)
  - onAdBreakPrepare(adInfos: NSMutableArray)
  - onAdPlay(adInfo: AdInfo)
  - onAdUserAction(action: String, adInfo: AdInfo)

You MUST implement all 8 methods even if some are empty. Missing methods cause compile errors.
Store the listener as a property (not a local variable) for later cleanup.

--------------------------------------------------
If AD_TYPE is "linear-tv":

For FlowerPlayer (FlowerAVPlayer):
  The listener is mainly for UI control (show/hide ad indicators), plus onError.
  onError (called off the main thread): hop to the main thread and restart the channel -
  player.flowerAdView.adsManager.stop(), player.replaceCurrentItem(with: nil) (this also
  clears the ad config), then start it again the same way: replaceCurrentItem(with:adConfig:)
  with a new AVPlayerItem of the original stream URL + play(). A restart leaves the channel
  pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it. So the restart's
  FlowerLinearTvAdConfig has no prerollAdTagUrl (withPreroll: false in STEP 3-2) and the
  channel loads right away. If onError arrives before the
  channel item was loaded (player.currentItem == nil, i.e. a pre-roll playback error), restart
  in a NEW FlowerAVPlayer: FlowerAVPlayer does not load the channel after a pre-roll error and
  keeps its internal pre-roll listener registered. Keep a simple retry limit (e.g. at most 3
  restarts in a row).

  SwiftUI — implement as class holding view reference:
  class AdsManagerListenerImpl: FlowerAdsManagerListener {
      func onPrepare(adDurationMs: Int32) {}
      func onPlay() { /* hide player controls */ }
      func onCompleted() { /* show player controls */ }
      func onError(error: FlowerError?) { /* main thread: stop + restart the channel (above) */ }
      func onAdBreakSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

  UIKit — conform on ViewController:
  extension PlaybackViewController: FlowerAdsManagerListener {
      func onPrepare(adDurationMs: Int32) {}
      func onPlay() {}
      func onCompleted() {}
      func onError(error: FlowerError?) { /* main thread: stop + restart the channel (above) */ }
      func onAdBreakSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

For MediaPlayerHook:
  Same listener but register on flowerAdView.adsManager.
  onError (called off the main thread): hop to the main thread and restart the channel -
  flowerAdView.adsManager.stop() (this also ends the SDK proxy the current URL points at),
  release the content item (removeAllItems / replaceCurrentItem(with: nil)), then start it
  again the same way: a new changeChannelUrl(...) -> a new AVPlayerItem -> play(). A restart
  leaves the channel pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it.
  So the restart passes prerollAdTagUrl: nil (withPreroll: false in STEP 3-2), has no pre-roll
  wait (no temporary pre-roll listener), loads the new URL right away and keeps the main
  listener registered. Keep a simple retry limit (e.g. at most 3 restarts in a row).

  SwiftUI:
  flowerAdView.adsManager.addListener(adsManagerListener: listener)

  UIKit (ViewController conforms to protocol, so pass self):
  flowerAdView.adsManager.addListener(adsManagerListener: self)

--------------------------------------------------
If AD_TYPE is "vod":

For FlowerPlayer:
  The listener is for UI control, plus onCompleted / onError (hop to the main thread).
  The first onCompleted is where FlowerAVPlayer loads the content (keep isContentPrepared).
  - onError before that (pre-roll playback error): FlowerAVPlayer does NOT load the content
    after it, and replaceCurrentItem(with:) without an ad config loads nothing for VOD.
    Release the player and start the same content in a NEW FlowerAVPlayer with
    replaceCurrentItem(with:adConfig:) + play(), once per content.
  - onError after that, content not ended (mid-roll error): player.play() as a safety net -
    the SDK also rewinds and resumes the content. No seek, no reload.
  - onError after the content ended (post-roll error): do not resume.

For MediaPlayerHook:
  By default the SDK plays VOD ads in its own ad player over the content. For a mid-roll it
  pauses the content itself (at onPrepare) and, after the break, rewinds it by 5 seconds
  (rewindDuration; requestVodAd has no parameter for it - it is configurable only through
  FlowerVodAdConfig with FlowerAVPlayer) and resumes it. The content is not loaded during
  the pre-roll. Do NOT pause, seek or reload the content around a VOD ad break. The one
  exception: player.play() in onError after a mid-roll.
  - onPrepare: Call flowerAdView.adsManager.play() right away (a mid-roll's onPrepare
    arrives when the content reaches the mid-roll position). Do NOT delay it.
  - onPlay: Do NOT pause the content.
  - onCompleted: Only the FIRST onCompleted/onError starts the content. If the content
    has not been prepared yet (isContentPrepared == false), call prepareContentSource()
    (see STEP 3-2) and set isContentPrepared = true. This is the end of the pre-roll, or the
    SDK found no pre-roll / no ad breaks / the ad request failed - it still calls
    onCompleted in those cases. After a mid-roll do nothing: the SDK has already resumed
    the content. After the post-roll (isContentEnd == true) only run post-playback actions.
  - onError: Same as onCompleted for the first call (start the content). After that, if the
    content has not ended (isContentEnd == false), it is a mid-roll error: call player.play()
    (no seek, no reload). The SDK also rewinds and resumes the content before it calls
    onError, so this is a safety net that keeps the content from staying paused. After the
    post-roll (isContentEnd == true) do not resume the content.

  SwiftUI (keep isContentPrepared / isContentEnd in a reference type, e.g. an
  ObservableObject, so that the listener and the view share the same state):
  class AdsManagerListenerImpl: FlowerAdsManagerListener {
      var view: PlaybackView
      init(_ view: PlaybackView) { self.view = view }

      func onPrepare(adDurationMs: Int32) {
          DispatchQueue.main.async {
              self.view.flowerAdView.adsManager.play()
          }
      }
      func onPlay() {
          // Do NOT pause the player here - the SDK pauses and resumes the content itself.
      }
      func onCompleted() {
          DispatchQueue.main.async {
              if !self.view.isContentPrepared {
                  // End of the pre-roll, or no pre-roll / no ads / request failure
                  self.view.prepareContentSource()
                  self.view.isContentPrepared = true
              } else if self.view.isContentEnd {
                  // The post-roll has finished - run post-playback actions here
              }
              // After a mid-roll: nothing to do - the SDK has already resumed the content.
          }
      }
      func onError(error: FlowerError?) {
          DispatchQueue.main.async {
              if !self.view.isContentPrepared {
                  // Pre-roll error: start the content
                  self.view.prepareContentSource()
                  self.view.isContentPrepared = true
              } else if !self.view.isContentEnd {
                  // Mid-roll error: resume the content (safety net). No seek, no reload.
                  self.view.player.play()
              }
              // Post-roll error: the content has ended - do not resume it.
          }
      }
      func onAdBreakSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
      func onAdPlay(adInfo: AdInfo) {}
      func onAdUserAction(action: String, adInfo: AdInfo) {}
  }

  UIKit: the same logic in `extension PlaybackViewController: FlowerAdsManagerListener`,
  using self.isContentPrepared, self.isContentEnd, self.prepareContentSource() and
  self.player.play().

  Detect content end: register the observer inside prepareContentSource() (see STEP 3-2),
  on the item it creates.

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
      func onAdBreakSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

========================================
STEP 3-2 — Request Ads / Start Playback
========================================

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "flower-player":

  Use values from your config data — do NOT hardcode URLs or parameters.
  withPreroll: true when a channel starts (first start or channel change), false on a restart
  after onError.

  let adConfig = FlowerLinearTvAdConfig(
      adTagUrl: config.adTagUrl,
      prerollAdTagUrl: withPreroll ? config.prerollAdTagUrl : nil,
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

  withPreroll: true when a channel starts (first start or channel change), false on a restart
  after onError.

  let hook = MediaPlayerHookImpl { self.player }
  let prerollAdTagUrl = withPreroll ? config.prerollAdTagUrl : nil
  let changedUrl = flowerAdView.adsManager.changeChannelUrl(
      videoUrl: config.contentUrl,
      adTagUrl: config.adTagUrl,
      channelId: config.channelId,
      extraParams: config.extraParams,
      mediaPlayerHook: hook,
      adTagHeaders: config.adTagHeaders ?? [:],
      channelStreamHeaders: config.channelStreamHeaders ?? [:],
      prerollAdTagUrl: prerollAdTagUrl
  )
  if prerollAdTagUrl == nil {
      // No pre-roll (or a restart after onError): load the URL right away.
      loadChannel(changedUrl)
  } else {
      // Channel pre-roll: the SDK plays it once, before the channel, in its own ad player.
      // Hold the stream until it ends - do NOT load changedUrl yet.
      pendingChannelUrl = changedUrl
      flowerAdView.adsManager.removeListener(adsManagerListener: mainListener)
      let preroll = PrerollListener { done in
          DispatchQueue.main.async {
              guard prerollListener === done else { return }   // first call only
              prerollListener = nil
              flowerAdView.adsManager.removeListener(adsManagerListener: done)
              flowerAdView.adsManager.addListener(adsManagerListener: mainListener)
              if let url = pendingChannelUrl {
                  pendingChannelUrl = nil
                  loadChannel(url)
              }
          }
      }
      prerollListener = preroll
      flowerAdView.adsManager.addListener(adsManagerListener: preroll)
  }

  func loadChannel(_ url: String) {
      player.removeAllItems()
      player.insert(AVPlayerItem(url: URL(string: url)!), after: nil)
      player.play()
  }

  - mainListener is the listener registered in STEP 3-1 (SwiftUI: listener, UIKit: self).
  - State: pendingChannelUrl: String?, prerollListener: PrerollListener? (SwiftUI: @State;
    UIKit: properties, and capture [weak self] in the closure).
  - PrerollListener is a FlowerAdsManagerListener (every protocol method, the others empty)
    that calls onDone(self) from onCompleted and onError. The SDK calls them off the main
    thread. The SDK ends the pre-roll with onCompleted, also when there is no pre-roll ad, the
    request failed or the pre-roll could not be played. Its onError does NOT restart the
    channel: the channel has not started yet.
  - A restart after onError (withPreroll: false) has no pre-roll wait: it loads right away and
    keeps the main listener registered.
  - Before the next changeChannelUrl(...) (channel change) and before every stop() (restart,
    cleanup), if prerollListener is still set, remove it from adsManager, set prerollListener
    and pendingChannelUrl to nil, and add mainListener back (cleanup removes it right after).
    Each changeChannelUrl(...) and stop() ends a pre-roll still playing WITHOUT calling the
    temporary listener, so a forgotten one would load the previous channel's URL when the next
    pre-roll ends. changeChannelUrl(...) then requests the new channel's pre-roll.

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

  Create MediaPlayerHook:
  class MediaPlayerHookImpl: MediaPlayerHook {
      private let fn: () -> Any
      init(_ fn: @escaping () -> Any) { self.fn = fn }
      func getPlayer() -> Any? { fn() }
  }

  let hook = MediaPlayerHookImpl { self.player }
  flowerAdView.adsManager.requestVodAd(
      adTagUrl: config.adTagUrl,
      contentId: config.contentId,
      durationMs: config.contentDuration,
      extraParams: config.extraParams,
      mediaPlayerHook: hook,
      adTagHeaders: config.adTagHeaders ?? [:]
  )
  // Do NOT load or play the content here - its first frame would show before the
  // pre-roll. The listener's first onCompleted/onError calls prepareContentSource().

  Load and start the content (called once, from the listener):
  func prepareContentSource() {
      let item = AVPlayerItem(url: URL(string: config.contentUrl)!)
      // Detect content end (store the observer token as a property for cleanup)
      contentEndObserver = NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main) { _ in
          self.isContentEnd = true
          self.flowerAdView.adsManager.notifyContentEnded()
      }
      player.removeAllItems()
      player.insert(item, after: nil)
      player.play()
  }

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

  Ads are not supported in PiP by default (FlowerSdk.setIgnoreAdBreakInPIPMode(true)), so do
  not let the content go into PiP while an ad is playing.
  canStartPictureInPictureAutomaticallyFromInline (iOS 14.2+) only stops automatic PiP;
  the built-in PiP button of AVPlayerViewController stays enabled. In onPlay set both
  playerViewController.allowsPictureInPicturePlayback and
  playerViewController.canStartPictureInPictureAutomaticallyFromInline to false, and set
  them back to true in onCompleted and onError (on the main thread).

SwiftUI — FlowerVideoPlayer (a SwiftUI VideoPlayer) does not report PiP transitions, and the
SDK never detects PiP by itself. If the app supports PiP, host an AVPlayerViewController
(UIViewControllerRepresentable) and notify the SDK from its delegate as above.

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
- Notify PiP transitions (FlowerSdk.notifyPictureInPictureModeChanged) in every approach that
  allows PiP, including FlowerAVPlayer. The SDK does not detect PiP by itself.
```
