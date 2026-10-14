---
sidebar_position: 1
sidebar_label: VOD with FlowerAVPlayer
---

# VOD Ads with FlowerAVPlayer

Use this prompt when you can replace your `AVPlayer` with the SDK's `FlowerAVPlayer` and want pre-roll, mid-roll and post-roll ads in VOD content with the least code. The player handles the ad flow itself; the prompt produces the player setup, `FlowerVodAdConfig` (including the optional timing values), the content-end notification and the `onError` handling (start the content after a pre-roll error, resume it after a mid-roll error). See [Using Extended AVPlayer](../../../ad-insertion/linear-tv-fast/using-extended-avplayer#flowervodadconfig) and [VOD Pre-roll, Mid-roll, Post-roll Ad Implementation](../../../ad-insertion/vod/vod-ad-implementation).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `UI_FRAMEWORK` | `swiftui` \| `uikit` | UI framework of the playback screen |

```plain
We are adding FLOWER SDK VOD ads (pre-roll, mid-roll, post-roll) to our iOS app by replacing
our AVPlayer with FlowerAVPlayer. Modify the code I paste below.

========================================
GOAL
========================================

- Play VOD content in FlowerAVPlayer with pre-roll, mid-roll and post-roll ads.
- Keep the app code minimal: the player runs the ad flow.

========================================
PARAMETERS
========================================

UI_FRAMEWORK: {{UI_FRAMEWORK}}   (swiftui | uikit)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- FlowerAVPlayer is an AVQueuePlayer subclass with its own FlowerAdView (player.flowerAdView).
- player.replaceCurrentItem(with: item, adConfig: FlowerVodAdConfig(...)) requests the VOD ads.
  The player does NOT load the item yet. When the pre-roll ends (or there is no pre-roll, no ad
  break, or the request failed), the player loads the item itself.
- player.play() called right after replaceCurrentItem is remembered: the pre-roll plays as soon
  as it is ready, then the content plays.
- Mid-roll: the player plays the ad when the content reaches the mid-roll position. By default
  (FlowerSdk.setIgnoreAdBreakInPIPMode(true)) the ad plays in the SDK's own ad player over the
  content; the SDK pauses the content and, after the break, resumes it rewindDuration earlier.
- Post-roll: requested only when the app calls player.flowerAdView.adsManager.notifyContentEnded().
  FlowerAVPlayer does not detect the end of the content by itself.
- Optional timing values in FlowerVodAdConfig (all in ms, nil = default 5000):
  - requestTimeout: timeout of the VMAP request and of each mid-roll ad request
  - minPrepareDuration: a mid-roll is requested requestTimeout + minPrepareDuration before
    its position
  - rewindDuration: how far before the interrupted position the content resumes after a mid-roll
  These can only be set here; FlowerAdsManager.requestVodAd(...) has no such parameters.
- Ad playback error (listener onError, called off the main thread):
  - During the pre-roll: FlowerAVPlayer does NOT load the content by itself, and
    replaceCurrentItem(with:) without an ad config loads nothing for VOD. The app must start the content: release this player and start the same
    content in a new FlowerAVPlayer with replaceCurrentItem(with:adConfig:) + play(). This
    requests the ads again, so do it only once per content.
  - During a mid-roll: the SDK rewinds and resumes the content itself. The app still calls
    player.play() (no seek, no reload): the content is normally already playing again;
    resuming is a harmless safety net.
  - A message starting with "playback unrecoverable": the content stopped and the SDK cannot
    recover it. Reload the content or show an error; do not call player.play() for it.
  - During the post-roll: the content has already ended; it is not resumed.
- The first onCompleted is where FlowerAVPlayer loads the content (end of the pre-roll, or no
  pre-roll / no ad break / request failure). Until then the content has not started.
- An ad listener (player.addAdListener / removeAdListener) is needed for onCompleted / onError
  above; its other methods are for UI only.

========================================
IMPLEMENTATION
========================================

1. SDK setup (skip if it already exists): Swift Package https://github.com/anypointmedia/flower-sdk-ios
   (product FlowerSdk). In application(_:didFinishLaunchingWithOptions:):
     FlowerSdk.setEnv(env: "local")   // "dev" or "prod" as appropriate
     FlowerSdk.doInit()

2. Player and view.

   If UI_FRAMEWORK is "swiftui":
     import FlowerSdk
     @State private var player = FlowerAVPlayer()
     var body: some View {
         FlowerVideoPlayer(player: player)
             .onAppear { playVod() }
             .onDisappear { releasePlayer() }
     }

   If UI_FRAMEWORK is "uikit":
     import FlowerSdk
     private var player = FlowerAVPlayer()   // var: replaced after a pre-roll error (step 4)
     private let playerViewController = FlowerAVPlayerViewController()
     // in viewDidLoad
     playerViewController.player = player
     addChild(playerViewController)
     view.addSubview(playerViewController.view)
     playerViewController.didMove(toParent: self)
     // pin playerViewController.view to the view's edges, then call playVod()
   FlowerAVPlayerViewController adds the ad UI and hides the playback controls during ads.

3. Start playback with the ad config:

   private var contentEndObserver: NSObjectProtocol?
   private var isContentPrepared = false   // true from the first onCompleted (content loaded)
   private var isContentEnd = false

   func playVod() {
       isContentPrepared = false
       isContentEnd = false
       let item = AVPlayerItem(url: config.contentUrl)
       let adConfig = FlowerVodAdConfig(
           adTagUrl: config.adTagUrl,          // issued by Anypoint Media
           contentId: config.contentId,        // registered in the Flower backend
           contentDuration: config.durationMs, // Int64, content length in ms
           extraParams: config.extraParams,    // [String: String]? targeting values
           adTagHeaders: config.adTagHeaders,  // [String: String]? or nil
           requestTimeout: nil,                // optional, ms
           minPrepareDuration: nil,            // optional, ms
           rewindDuration: nil                 // optional, ms
       )
       contentEndObserver = NotificationCenter.default.addObserver(
           forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main
       ) { _ in
           guard !isContentEnd else { return }
           isContentEnd = true
           // Requests the post-roll
           player.flowerAdView.adsManager.notifyContentEnded()
       }
       player.replaceCurrentItem(with: item, adConfig: adConfig)
       player.play()
   }
   (In a class, capture [weak self] and use self.; in a SwiftUI View keep isContentPrepared,
   isContentEnd, didRestartAfterPrerollError and the observer token in @State.)

4. Ad listener (all 8 methods are required). The SDK calls it off the main thread, so hop to
   the main thread before touching the player or the state:

   class AdListener: FlowerAdsManagerListener {
       private let onAdCompleted: () -> Void
       private let onAdError: (FlowerError?) -> Void
       init(onAdCompleted: @escaping () -> Void, onAdError: @escaping (FlowerError?) -> Void) {
           self.onAdCompleted = onAdCompleted
           self.onAdError = onAdError
       }
       func onPrepare(adDurationMs: Int32) {}
       func onPlay() { /* e.g. hide your own overlay */ }
       func onCompleted() { DispatchQueue.main.async { self.onAdCompleted() } }
       func onError(error: FlowerError?) { DispatchQueue.main.async { self.onAdError(error) } }
       func onAdBreakSkipped(reason: Int32) {}
       func onAdBreakPrepare(adInfos: NSMutableArray) {}
       func onAdPlay(adInfo: AdInfo) {}
       func onAdUserAction(action: String, adInfo: AdInfo) {}
   }
   Keep it in a property (adListener = AdListener(onAdCompleted: handleAdCompleted,
   onAdError: handleAdError), capturing [weak self] in a class) and call
   player.addAdListener(listener: adListener) before playVod().

   private var didRestartAfterPrerollError = false   // reset for each new content

   // onCompleted (main thread). The first one is where FlowerAVPlayer loads the content.
   func handleAdCompleted() {
       isContentPrepared = true
       // e.g. show your own overlay again
   }

   // onError (main thread)
   func handleAdError(_ error: FlowerError?) {
       if !isContentPrepared {
           // Pre-roll error: FlowerAVPlayer does not load the content after a pre-roll
           // playback error. Start the content in a new FlowerAVPlayer, once.
           guard !didRestartAfterPrerollError else { return }
           didRestartAfterPrerollError = true
           releasePlayer()
           player = FlowerAVPlayer()
           // UIKit: playerViewController.player = player
           // (SwiftUI: FlowerVideoPlayer(player:) picks up the new @State player)
           player.addAdListener(listener: adListener)
           playVod()
       } else if error?.message?.hasPrefix("playback unrecoverable") == true {
           // The content stopped and the SDK cannot recover it:
           // reload the content or show an error. No safety-net play() here.
       } else if !isContentEnd {
           // Mid-roll error: resume the content. It is normally already playing again;
           // this is a harmless safety net. Do not seek or reload.
           player.play()
       } else {
           // Post-roll error: the content has already ended - do not resume it.
       }
   }

5. Release (UIKit viewWillDisappear / SwiftUI onDisappear):

   func releasePlayer() {
       if let observer = contentEndObserver { NotificationCenter.default.removeObserver(observer) }
       player.removeAdListener(listener: adListener)
       player.pause()
       player.replaceCurrentItem(with: nil)   // also stops the ads
   }

========================================
RULES
========================================

DO:
- Use FlowerAVPlayer.replaceCurrentItem(with:adConfig:) for every new content.
- Call player.play() right after it; FlowerAVPlayer decides when the content really starts.
- Use values from the app's content/config objects; do not hardcode URLs or IDs.

DO NOT:
- Do NOT call flowerAdView.adsManager.play() or requestVodAd(...) yourself - the player does it.
- Do NOT pause, seek or reload the player in the listener, and do NOT delay anything in onPrepare.
  The only exceptions are in onError: player.play() after a mid-roll error, and starting the
  content in a new FlowerAVPlayer after a pre-roll error.
- Do NOT call insert(_:after:), removeAllItems(), advanceToNextItem() or items() on
  FlowerAVPlayer - they are unavailable and do not compile.
- Do NOT add a separate FlowerAdView or MediaPlayerHook - that is the MediaPlayerHook case.
- Do NOT set timing values unless the user asked for them; nil keeps the 5000 ms defaults.

========================================
VERIFY
========================================

- Pre-roll: the ad plays first with no content frame, then the content starts from 0.
- No ad / empty VMAP / ad server unreachable: the content starts right away.
- Ad playback error during the pre-roll: the content still starts (in a new FlowerAVPlayer,
  after the ads are requested once more).
- Mid-roll: the content pauses at the mid-roll position, the ad plays, then the content resumes
  rewindDuration (5 s by default) before where it stopped.
- Ad playback error during a mid-roll: the content resumes and does not stay paused.
- Post-roll: plays once after the content ends. An error during the post-roll does not resume
  the content.
- Leaving the screen during an ad stops the ad and its sound.

========================================
OUTPUT
========================================

- Modify the code I paste below; keep its structure and names.
- Generate only the code for the selected UI_FRAMEWORK.
- List every file you changed or added.
- Do not add code for other cases (MediaPlayerHook, linear TV, ads in PIP mode).

My code:
```
