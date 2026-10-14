---
sidebar_position: 2
sidebar_label: VOD with MediaPlayerHook
---

# VOD Ads with MediaPlayerHook

Use this prompt when your app keeps its own `AVPlayer` or `AVQueuePlayer` and you want pre-roll, mid-roll and post-roll ads in VOD content, with the default ad mode (ads play in the SDK's own ad player over the content). It produces the ad UI, the listener, the ad request and the content start logic. See [VOD Pre-roll, Mid-roll, Post-roll Ad Implementation](../../../ad-insertion/vod/vod-ad-implementation) for the guide.

| Parameter | Values | Description |
|-----------|--------|-------------|
| `UI_FRAMEWORK` | `swiftui` \| `uikit` | UI framework of the playback screen |
| `PLAYER_TYPE` | `AVPlayer` \| `AVQueuePlayer` | The player your app already uses |

```plain
We are adding FLOWER SDK VOD ads (pre-roll, mid-roll, post-roll) to our iOS app. Our app keeps
its own player and passes it to the SDK through MediaPlayerHook. Modify the code I paste below.

========================================
GOAL
========================================

- Show a pre-roll before the content, mid-rolls at the positions in the ad response, and a
  post-roll after the content ends.
- The content must not appear before the pre-roll, and must start even when there is no ad.

========================================
PARAMETERS
========================================

UI_FRAMEWORK: {{UI_FRAMEWORK}}   (swiftui | uikit)
PLAYER_TYPE: {{PLAYER_TYPE}}     (AVPlayer | AVQueuePlayer)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- Default mode (FlowerSdk.setIgnoreAdBreakInPIPMode(true), do not change it): the SDK plays
  every VOD ad in its own ad player, drawn by FlowerAdView over the content.
- requestVodAd(...) requests the ad schedule (VMAP). Then exactly one of these happens first:
  - there is a pre-roll: onPrepare -> (app calls play()) -> onPlay -> onCompleted or onError
  - there is no pre-roll, the VMAP has no ad breaks, or the request failed or timed out:
    the SDK calls onCompleted without onPrepare.
  So the FIRST onCompleted/onError is always the moment to load and start the content.
- Mid-roll: the SDK calls onPrepare when the content reaches the mid-roll position. When
  onPrepare is called, the SDK pauses the content itself. When the break ends (onCompleted or
  onError), the SDK seeks the content back 5 seconds (rewindDuration) and resumes it.
  requestVodAd has no parameter to change these timings. The app still calls player.play() in
  onError after a mid-roll (no seek, no reload): the content is normally already playing again;
  resuming is a harmless safety net.
- onError with a message starting with "playback unrecoverable": the content stopped and the
  SDK cannot recover it. Reload the content or show an error; do not call player.play() for it.
- Post-roll: requested when the app calls notifyContentEnded(). The content has ended, so it is
  not resumed afterwards.
- A mid-roll with no ad is reported as onAdBreakSkipped + onCompleted without onPrepare.

========================================
IMPLEMENTATION
========================================

1. SDK setup (skip if it already exists): Swift Package https://github.com/anypointmedia/flower-sdk-ios
   (product FlowerSdk). In application(_:didFinishLaunchingWithOptions:):
     FlowerSdk.setEnv(env: "local")   // "dev" or "prod" as appropriate
     FlowerSdk.doInit()
   SwiftUI apps: use @UIApplicationDelegateAdaptor(AppDelegate.self).

2. MediaPlayerHook (returns the app's content player):

   import FlowerSdk

   class MediaPlayerHookImpl: MediaPlayerHook {
       private let getPlayerFn: () -> Any?
       init(_ getPlayerFn: @escaping () -> Any?) { self.getPlayerFn = getPlayerFn }
       func getPlayer() -> Any? { getPlayerFn() }
   }

3. Ad UI. FlowerAdView must cover the content player.

   If UI_FRAMEWORK is "swiftui": keep the player, FlowerAdView and the state in one
   ObservableObject (step 4), and draw:
     ZStack {
         VideoPlayer(player: model.player)
         model.flowerAdView.body
     }
     .onAppear { model.start() }
     .onDisappear { model.release() }

   If UI_FRAMEWORK is "uikit":
     private let flowerAdViewHostingController = FlowerAdView.HostingController()
     private var flowerAdView: FlowerAdView { flowerAdViewHostingController.adView }
   Add flowerAdViewHostingController.view (addChild + addSubview + didMove(toParent:)) after
   the player view, and pin its four edges to the player view.

4. State and listener (in the SwiftUI ObservableObject, or in the UIKit view controller):

   var isContentPrepared = false
   var isContentEnd = false
   var contentEndObserver: NSObjectProtocol?
   var mediaPlayerHook: MediaPlayerHookImpl?

   FlowerAdsManagerListener requires all 8 methods:

   func onPrepare(adDurationMs: Int32) {
       DispatchQueue.main.async {
           // Pre-roll, mid-roll and post-roll alike: play right away.
           self.flowerAdView.adsManager.play()
       }
   }
   func onPlay() {
       // UI only (e.g. hide your own controls). Do NOT pause the player.
   }
   func onCompleted() {
       DispatchQueue.main.async {
           if !self.isContentPrepared {
               self.prepareContentSource()   // end of pre-roll, or no pre-roll / no ads / failure
           } else if self.isContentEnd {
               // The post-roll has finished: post-playback actions (close, next episode, ...)
           }
           // After a mid-roll: nothing. The SDK has already resumed the content.
       }
   }
   func onError(error: FlowerError?) {
       DispatchQueue.main.async {
           if !self.isContentPrepared {
               self.prepareContentSource()   // pre-roll error: start the content
           } else if error?.message?.hasPrefix("playback unrecoverable") == true {
               // The content stopped and the SDK cannot recover it:
               // reload the content or show an error. No safety-net play() here.
           } else if !self.isContentEnd {
               // Mid-roll error: resume the content. It is normally already playing again;
               // this is a harmless safety net. No seek, no reload.
               self.player.play()
           }
           // Post-roll error: the content has already ended - do not resume it.
       }
   }
   func onAdBreakSkipped(reason: Int32) {}
   func onAdBreakPrepare(adInfos: NSMutableArray) {}
   func onAdPlay(adInfo: AdInfo) {}
   func onAdUserAction(action: String, adInfo: AdInfo) {}

5. Request the ads, and do NOT load the content here:

   func start() {   // UIKit: call from viewDidLoad
       isContentPrepared = false
       isContentEnd = false
       flowerAdView.adsManager.addListener(adsManagerListener: self)
       let hook = MediaPlayerHookImpl { [weak self] in self?.player }
       mediaPlayerHook = hook
       flowerAdView.adsManager.requestVodAd(
           adTagUrl: config.adTagUrl,          // issued by Anypoint Media
           contentId: config.contentId,        // registered in the Flower backend
           durationMs: config.durationMs,      // Int64, content length in ms
           extraParams: config.extraParams,    // [String: String]? targeting values, or nil
           mediaPlayerHook: hook,
           adTagHeaders: config.adTagHeaders ?? [:]
       )
   }

6. Load and start the content once:

   func prepareContentSource() {
       isContentPrepared = true
       let item = AVPlayerItem(url: config.contentUrl)
       contentEndObserver = NotificationCenter.default.addObserver(
           forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main
       ) { [weak self] _ in
           guard let self = self, !self.isContentEnd else { return }
           self.isContentEnd = true
           self.flowerAdView.adsManager.notifyContentEnded()   // requests the post-roll
       }
       // PLAYER_TYPE AVQueuePlayer: player.removeAllItems(); player.insert(item, after: nil)
       // PLAYER_TYPE AVPlayer:      player.replaceCurrentItem(with: item)
       player.play()
   }

7. User pause/resume and release:
   - When the user pauses or resumes the content with your own controls, also call
     flowerAdView.adsManager.pause() / flowerAdView.adsManager.resume().
   - On leaving the screen (UIKit viewWillDisappear / SwiftUI onDisappear):
       flowerAdView.adsManager.removeListener(adsManagerListener: self)
       if let observer = contentEndObserver { NotificationCenter.default.removeObserver(observer) }
       flowerAdView.adsManager.stop()
       player.pause()
       // AVQueuePlayer: player.removeAllItems()   AVPlayer: player.replaceCurrentItem(with: nil)

========================================
RULES
========================================

DO:
- Call adsManager.play() immediately in onPrepare, on the main thread.
- Start the content only from the first onCompleted/onError (isContentPrepared).
- Use values from the app's own content/config objects. Do not hardcode URLs or IDs.
- If the project uses Swift 6 strict concurrency and a @MainActor type conforms to
  FlowerAdsManagerListener, declare the 8 methods nonisolated and hop with
  Task { @MainActor in ... } instead of DispatchQueue.main.async.

DO NOT:
- Do NOT call player.pause() in onPlay or onPrepare.
- Do NOT delay play() in onPrepare (no Task.sleep, no "ads start in 5 seconds" countdown).
- Do NOT call player.play(), seek or reload the content in onCompleted after a mid-roll.
  In onError after a mid-roll, call only player.play() (no seek, no reload).
- Do NOT load or play the content right after requestVodAd(...).
- Do NOT use FlowerAVPlayer or FlowerVodAdConfig in this case (that is a different case).
- Do NOT call FlowerSdk.setIgnoreAdBreakInPIPMode(false) (that is the "ads in PIP mode" case).

========================================
VERIFY
========================================

- Pre-roll: the ad plays first, no content frame flashes, the content starts from 0 after it.
- No ad (empty VMAP or no pre-roll): the content starts right away.
- Request failure (e.g. wrong adTagUrl, no network to the ad server): the content still starts.
- Mid-roll: the content pauses at the mid-roll position, the ad plays, then the content resumes
  about 5 seconds before the point where it stopped, and the same mid-roll does not play again.
- Post-roll: after the content ends, the post-roll plays once, then post-playback actions run.
- Ad playback error: the content starts (pre-roll), resumes and does not stay paused (mid-roll),
  or is not resumed (post-roll).
- Leaving the screen during an ad stops the ad and its sound.

========================================
OUTPUT
========================================

- Modify the code I paste below; keep its structure and names.
- Generate only the code for the selected UI_FRAMEWORK and PLAYER_TYPE.
- List every file you changed or added.
- Do not add code for other cases (linear TV, FlowerAVPlayer, ads in PIP mode).

My code:
```
