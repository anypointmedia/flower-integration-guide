---
sidebar_position: 1
sidebar_label: Linear TV with FlowerAVPlayer
---

# Linear TV / FAST Ads with FlowerAVPlayer

Use this prompt when you can replace your `AVPlayer` with the SDK's `FlowerAVPlayer` for a live channel or FAST stream. The player rewrites the stream through the SDK, replaces the ad breaks marked in the stream, and optionally plays a channel pre-roll. The prompt produces the player setup, `FlowerLinearTvAdConfig`, an ad listener that restarts the channel on `onError`, and cleanup. See [Using Extended AVPlayer](../../../ad-insertion/linear-tv-fast/using-extended-avplayer).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `UI_FRAMEWORK` | `swiftui` \| `uikit` | UI framework of the playback screen |
| `USE_PREROLL` | `yes` \| `no` | Whether a pre-roll plays when the channel starts (`prerollAdTagUrl`) |

```plain
We are adding FLOWER SDK ads to a live channel / FAST stream in our iOS app by replacing our
AVPlayer with FlowerAVPlayer. Modify the code I paste below.

========================================
GOAL
========================================

- Play the channel in FlowerAVPlayer with ad breaks replaced by Flower ads.
- Optionally play a pre-roll before the channel starts.

========================================
PARAMETERS
========================================

UI_FRAMEWORK: {{UI_FRAMEWORK}}   (swiftui | uikit)
USE_PREROLL: {{USE_PREROLL}}     (yes | no)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- FlowerAVPlayer is an AVQueuePlayer subclass with its own FlowerAdView (player.flowerAdView).
- player.replaceCurrentItem(with: item, adConfig: FlowerLinearTvAdConfig(...)) passes the stream
  through the SDK's local proxy, which replaces the ad breaks marked in the stream (e.g. SCTE-35).
  The ads are part of the stream; the app does nothing per break.
- Channel pre-roll: with prerollAdTagUrl, the player requests a pre-roll, holds the channel
  item, plays the pre-roll once in the SDK's ad player over the content, and loads the channel
  after it ends. The pre-roll starts on player.play(); a play() called right after
  replaceCurrentItem is remembered until the pre-roll is ready. The app needs no temporary
  listener. Listeners added with addAdListener also get the pre-roll's onPrepare/onPlay/
  onCompleted. No pre-roll ad or a failed request ends with onCompleted and the channel starts.
- Calling replaceCurrentItem(with:adConfig:) again (channel change) stops the previous ad
  session and requests the new channel's pre-roll. replaceCurrentItem(with: nil) stops the ads, clears the ad config the player holds
  and releases the player.
- onError (called off the main thread) means the channel cannot continue as it is: stop the
  ads manager (player.flowerAdView.adsManager.stop()), release the item
  (replaceCurrentItem(with: nil)), and start the channel again the same way:
  replaceCurrentItem(with:adConfig:) with a new AVPlayerItem + play(), with exactly the same
  FlowerLinearTvAdConfig as the first start, including prerollAdTagUrl. If the channel has not
  changed, the pre-roll is skipped: the viewer does not see the pre-roll twice and the player
  loads the channel right away. (A -> B -> A, or a VOD/inline ad request in between, plays the
  pre-roll again; stop() and leaving the screen are not a channel change.) A break cut short by
  stop() may still report onCompleted afterwards, so keep onCompleted idempotent (UI-only).
  This applies to every onError: an ad error, a message starting with "playback unrecoverable"
  (content playback stopped and the SDK cannot recover it), and an internal SDK error.
- A pre-roll playback error also arrives as onError. FlowerAVPlayer then does NOT load the
  channel, and that player stays set up for its pre-roll and would act again on the next ad
  events. So when onError arrives before the channel item was
  loaded (player.currentItem == nil), restart in a NEW FlowerAVPlayer.
- While the user is away from the app (FlowerSdk.notifyUserLeftApp(true), see the PIP mode
  support case), stream ads keep playing and only the ad UI is hidden; a pre-roll that is
  playing is paused and resumes when the user comes back (notifyUserLeftApp(false)) (default
  FlowerSdk.setIgnoreAdBreakInPIPMode(true)).
- The URL the proxy plays is a loopback URL: it cannot be cast (see the screen casting case).

========================================
IMPLEMENTATION
========================================

1. SDK setup (skip if it already exists): Swift Package https://github.com/anypointmedia/flower-sdk-ios
   (product FlowerSdk). In application(_:didFinishLaunchingWithOptions:):
     FlowerSdk.setEnv(env: "local")   // "dev" or "prod" as appropriate
     FlowerSdk.doInit()
   For background audio: Info.plist UIBackgroundModes = audio, and
     try AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback, options: [])
     try AVAudioSession.sharedInstance().setActive(true)

2. Player and view.

   If UI_FRAMEWORK is "swiftui":
     @State private var player = FlowerAVPlayer()
     var body: some View {
         FlowerVideoPlayer(player: player)
             .onAppear { playLinearTv() }
             .onDisappear { releasePlayer() }
     }

   If UI_FRAMEWORK is "uikit":
     private var player = FlowerAVPlayer()   // var: may be replaced on a restart (step 5)
     private let playerViewController = FlowerAVPlayerViewController()
     // viewDidLoad
     playerViewController.player = player
     addChild(playerViewController)
     view.addSubview(playerViewController.view)
     playerViewController.didMove(toParent: self)
     // pin its edges, then playLinearTv(); call releasePlayer() in viewWillDisappear

3. Start the channel:

   // Used for the first start, a channel change and a restart after onError (step 5).
   func playLinearTv() {
       let adConfig = FlowerLinearTvAdConfig(
           adTagUrl: channel.adTagUrl,                  // issued by Anypoint Media
           prerollAdTagUrl: channel.prerollAdTagUrl,    // USE_PREROLL no: nil
           channelId: channel.channelId,                // registered in the Flower backend
           extraParams: channel.extraParams,            // [String: String]? targeting values
           adTagHeaders: channel.adTagHeaders,          // [String: String]? or nil
           channelStreamHeaders: channel.streamHeaders  // headers the stream needs, or nil
       )
       player.replaceCurrentItem(with: AVPlayerItem(url: channel.streamUrl), adConfig: adConfig)
       player.play()
   }
   Pass stream headers through channelStreamHeaders, not through AVURLAsset options: the
   player builds its own item from the proxy URL.

4. Ad listener (all 8 methods are required), kept in a property. It is needed for onError;
   the other methods are for UI only:

   class AdListener: FlowerAdsManagerListener {
       private let onAdError: () -> Void
       init(onAdError: @escaping () -> Void) { self.onAdError = onAdError }
       func onPrepare(adDurationMs: Int32) {}
       func onPlay() { /* hide your own controls */ }
       func onCompleted() { /* show them again */ }
       func onError(error: FlowerError?) {
           // Every onError restarts the channel, including "playback unrecoverable".
           DispatchQueue.main.async { self.onAdError() }
       }
       func onAdBreakSkipped(reason: Int32) {}
       func onAdBreakPrepare(adInfos: NSMutableArray) {}
       func onAdPlay(adInfo: AdInfo) {}
       func onAdUserAction(action: String, adInfo: AdInfo) {}
   }
   adListener = AdListener(onAdError: restartAfterAdError)   // [weak self] in a class
   player.addAdListener(listener: adListener)   // in playLinearTv(), before replaceCurrentItem
   Hop to the main thread before touching UI (DispatchQueue.main.async).

5. Restart the channel after an ad error (main thread):

   private var errorRestartCount = 0   // reset when the user changes the channel
                                       // (SwiftUI: keep it and player in @State)
   func restartAfterAdError() {
       guard errorRestartCount < 3 else { return }   // simple retry limit
       errorRestartCount += 1
       let channelLoaded = player.currentItem != nil
       player.flowerAdView.adsManager.stop()   // 1. stop the ads manager
       releasePlayer()                         // 2. release the item (also clears the ad config)
       if !channelLoaded {
           // The error came during the pre-roll: continue in a new player (see above).
           player = FlowerAVPlayer()
           // UIKit: playerViewController.player = player
           // (SwiftUI: FlowerVideoPlayer(player:) picks up the new @State player)
       }
       playLinearTv()                          // 3. same start: replaceCurrentItem(with:adConfig:) + play()
   }
   The restart passes the same prerollAdTagUrl as the first start. The channel has not changed,
   so the SDK skips the pre-roll and the viewer does not see it again. Do not add a flag that
   drops prerollAdTagUrl on a restart.

6. Release:

   func releasePlayer() {
       player.removeAdListener(listener: adListener)
       player.pause()
       player.replaceCurrentItem(with: nil)
   }

========================================
RULES
========================================

DO:
- Use replaceCurrentItem(with:adConfig:) for every channel, including channel changes.
- Use the original stream URL in the AVPlayerItem; the player builds the proxy URL.
- Use values from the app's channel/config objects; do not hardcode URLs or IDs.
- On onError, stop the ads manager and restart the channel (step 5), on the main thread.

DO NOT:
- Do NOT call changeChannelUrl(...) or add a separate FlowerAdView / MediaPlayerHook - that is
  the MediaPlayerHook case.
- Do NOT call insert(_:after:), removeAllItems(), advanceToNextItem() or items() on
  FlowerAVPlayer - they are unavailable and do not compile.
- Do NOT pause or seek the player in listener callbacks.
- Do NOT cast the player's current URL to AirPlay/Chromecast.

========================================
VERIFY
========================================

- The channel plays; at an ad break marker the Flower ad replaces the stream, then the channel
  continues.
- USE_PREROLL yes: the pre-roll plays first with no channel frame, then the channel starts.
- Pre-roll with no ad or a request failure: the channel still starts.
- Pre-roll playback error: the channel restarts in a new FlowerAVPlayer and plays.
- onError while the channel plays: the ads manager stops and the channel restarts (at most 3
  times in a row) without the pre-roll playing again, even with USE_PREROLL yes.
- Channel change: the new channel plays, no ad from the old channel appears.
- USE_PREROLL yes, A -> B -> A: A's pre-roll plays again.
- Leaving the app during a stream ad: the ad keeps playing, the ad UI is hidden; back in the
  app it shows.
- Leaving the screen stops the playback and the ads.

========================================
OUTPUT
========================================

- Modify the code I paste below; keep its structure and names.
- Generate only the code for the selected UI_FRAMEWORK and USE_PREROLL.
- List every file you changed or added.
- Do not add code for other cases (VOD, MediaPlayerHook, direct ad playback).

My code:
```
