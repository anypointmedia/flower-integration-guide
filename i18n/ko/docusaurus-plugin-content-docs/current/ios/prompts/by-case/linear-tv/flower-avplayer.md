---
sidebar_position: 1
sidebar_label: FlowerAVPlayer를 사용한 Linear TV
---

# FlowerAVPlayer를 사용한 Linear TV / FAST 광고

실시간 채널 또는 FAST 스트림에서 `AVPlayer`를 SDK의 `FlowerAVPlayer`로 교체할 수 있을 때 이 프롬프트를 사용하세요. 플레이어가 SDK를 통해 스트림을 변환하고, 스트림에 표시된 Ad Break를 교체하며, 필요하면 채널 프리롤도 재생합니다. 프롬프트는 플레이어 설정, `FlowerLinearTvAdConfig`, `onError` 시 채널을 다시 시작하는 광고 리스너, 정리 코드를 생성합니다. [확장 AVPlayer 사용](../../../ad-insertion/linear-tv-fast/using-extended-avplayer) 페이지를 참고하세요.

| 매개변수 | 값 | 설명 |
|----------|----|------|
| `UI_FRAMEWORK` | `swiftui` \| `uikit` | 재생 화면의 UI 프레임워크 |
| `USE_PREROLL` | `yes` \| `no` | 채널 시작 시 프리롤 재생 여부(`prerollAdTagUrl`) |

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
  replaceCurrentItem(with:adConfig:) with a new AVPlayerItem + play(). A restart leaves the
  channel pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it. So the
  restart's FlowerLinearTvAdConfig has no prerollAdTagUrl and the player loads the channel
  right away. A break cut short by stop() may still report onCompleted afterwards, so keep
  onCompleted idempotent (UI-only).
- A pre-roll playback error also arrives as onError. FlowerAVPlayer then does NOT load the
  channel, and it keeps its internal pre-roll listener registered, which would act again on
  the next ad events of the same player. So when onError arrives before the channel item was
  loaded (player.currentItem == nil), restart in a NEW FlowerAVPlayer.
- In PIP mode, stream ads keep playing and only the ad UI is hidden; a pre-roll that is playing
  is paused while in PIP and resumes when the app returns (default
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

   // withPreroll: true when a channel starts (first start or channel change), false on a
   // restart after onError (step 5).
   func playLinearTv(withPreroll: Bool = true) {
       let adConfig = FlowerLinearTvAdConfig(
           adTagUrl: channel.adTagUrl,                  // issued by Anypoint Media
           prerollAdTagUrl: withPreroll ? channel.prerollAdTagUrl : nil,  // USE_PREROLL no: always nil
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
       func onError(error: FlowerError?) { DispatchQueue.main.async { self.onAdError() } }
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
       playLinearTv(withPreroll: false)        // 3. same start: replaceCurrentItem(with:adConfig:) + play()
   }
   A restart leaves the channel pre-roll out (prerollAdTagUrl omitted): the viewer has already
   seen it. This holds with USE_PREROLL yes too.

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
  times in a row) without a pre-roll, even with USE_PREROLL yes.
- Channel change: the new channel plays, no ad from the old channel appears.
- PIP during a stream ad: the ad keeps playing, the ad UI is hidden; back in the app it shows.
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
