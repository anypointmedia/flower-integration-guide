---
sidebar_position: 2
sidebar_label: MediaPlayerHook을 사용한 Linear TV
---

# MediaPlayerHook을 사용한 Linear TV / FAST 광고

앱이 실시간 채널 또는 FAST 스트림에 자체 `AVPlayer` 또는 `AVQueuePlayer`를 유지할 때 이 프롬프트를 사용하세요. 앱은 스트림 URL을 `changeChannelUrl(...)`에 전달하고 반환된 URL을 재생하며, SDK는 스트림에 표시된 Ad Break를 교체합니다. 프롬프트는 광고 UI, 리스너, 선택 프리롤을 포함한 채널 시작 로직, 타겟팅 업데이트, 정리 코드를 생성합니다. [플레이어 수동 제어](../../../ad-insertion/linear-tv-fast/manual-player-control) 페이지를 참고하세요.

| 매개변수 | 값 | 설명 |
|----------|----|------|
| `UI_FRAMEWORK` | `swiftui` \| `uikit` | 재생 화면의 UI 프레임워크 |
| `PLAYER_TYPE` | `AVPlayer` \| `AVQueuePlayer` | 앱에서 이미 사용 중인 플레이어 |
| `USE_PREROLL` | `yes` \| `no` | 채널 시작 시 프리롤 재생 여부(`prerollAdTagUrl`) |

```plain
We are adding FLOWER SDK ads to a live channel / FAST stream in our iOS app. We keep our own
player and pass it to the SDK through MediaPlayerHook. Modify the code I paste below.

========================================
GOAL
========================================

- Play the channel through the SDK so that ad breaks in the stream are replaced by Flower ads.
- Optionally play a pre-roll before the channel starts.

========================================
PARAMETERS
========================================

UI_FRAMEWORK: {{UI_FRAMEWORK}}   (swiftui | uikit)
PLAYER_TYPE: {{PLAYER_TYPE}}     (AVPlayer | AVQueuePlayer)
USE_PREROLL: {{USE_PREROLL}}     (yes | no)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- changeChannelUrl(...) starts a local proxy and returns a loopback URL. The app plays that URL;
  the proxy replaces the ad breaks marked in the stream (e.g. SCTE-35). The app does nothing per
  break; the listener is for UI only.
- Channel pre-roll: with prerollAdTagUrl, changeChannelUrl(...) still returns the URL right
  away, and the SDK requests a pre-roll and plays it once, before the channel, in its own ad
  player over the screen. The app holds the stream: it keeps the URL and loads it only after the
  pre-roll ends. The SDK reports the end with onCompleted, also when there is no pre-roll ad,
  the request failed or the pre-roll could not be played; treat onError the same way. Each
  changeChannelUrl(...) stops the previous session (also a pre-roll still playing), so a channel
  change requests the new channel's pre-roll.
- changeChannelExtraParams(extraParams:) updates targeting while the channel plays.
- stop() ends the ad session and the proxy. A break cut short by stop() may still report
  onCompleted afterwards, so keep onCompleted idempotent (UI-only).
- onError on the main listener means the channel cannot continue as it is: stop the ads
  manager, release the content item, and start the channel again with a new
  changeChannelUrl(...) (the old loopback URL dies with the proxy). The listener is called off
  the main thread. A restart passes exactly the same parameters as the first start, including
  prerollAdTagUrl, and handles the returned URL the same way (held until onCompleted). This
  applies to every onError: an ad error, a message starting with "playback unrecoverable"
  (content playback stopped and the SDK cannot recover it), and an internal SDK error.
- If the channel has not changed, the pre-roll is skipped: when changeChannelUrl(...) is called
  again without a channel change (e.g. a restart after onError), the SDK skips the pre-roll
  even though prerollAdTagUrl is passed, and calls onCompleted right after
  changeChannelUrl(...) returns, like a pre-roll with no ad. So the held URL starts right away
  and the viewer does not see the pre-roll again. stop() is not a channel change.
  A -> B -> A plays A's pre-roll again.
- While the user is away from the app (FlowerSdk.notifyUserLeftApp(true), see the PIP mode
  support case), stream ads keep playing and only the ad UI is hidden; a pre-roll that is
  playing is paused and resumes when the user comes back (notifyUserLeftApp(false)) (default
  FlowerSdk.setIgnoreAdBreakInPIPMode(true)).

========================================
IMPLEMENTATION
========================================

1. SDK setup (skip if it already exists): Swift Package https://github.com/anypointmedia/flower-sdk-ios
   (product FlowerSdk); FlowerSdk.setEnv(env: "local") and FlowerSdk.doInit() in
   application(_:didFinishLaunchingWithOptions:). For background audio: UIBackgroundModes = audio
   and an AVAudioSession with category .playback.

2. Ad UI over the player.
   If UI_FRAMEWORK is "swiftui":
     ZStack { VideoPlayer(player: player); flowerAdView.body }   // flowerAdView = FlowerAdView()
   If UI_FRAMEWORK is "uikit":
     private let flowerAdViewHostingController = FlowerAdView.HostingController()
     private var flowerAdView: FlowerAdView { flowerAdViewHostingController.adView }
     Add its view above the player view (addChild / addSubview / didMove) and pin the edges.

3. MediaPlayerHook:
   class MediaPlayerHookImpl: MediaPlayerHook {
       private let getPlayerFn: () -> Any?
       init(_ getPlayerFn: @escaping () -> Any?) { self.getPlayerFn = getPlayerFn }
       func getPlayer() -> Any? { getPlayerFn() }
   }
   Keep the hook in a property: mediaPlayerHook = MediaPlayerHookImpl { [weak self] in self?.player }

4. Listener (all 8 methods are required), registered with
   flowerAdView.adsManager.addListener(adsManagerListener: listener):
   func onPrepare(adDurationMs: Int32) {}            // nothing for linear TV
   func onPlay() { /* UI: hide your own controls */ }
   func onCompleted() { /* UI: show them again */ }
   func onError(error: FlowerError?) {
       // Every onError restarts the channel, including "playback unrecoverable".
       DispatchQueue.main.async { self.restartAfterAdError() }   // step 10
   }
   func onAdBreakSkipped(reason: Int32) {}
   func onAdBreakPrepare(adInfos: NSMutableArray) {}
   func onAdPlay(adInfo: AdInfo) {}
   func onAdUserAction(action: String, adInfo: AdInfo) {}

5. Start the channel. The same function is used for the first start, a channel change and a
   restart after onError (step 10):
   func playLinearTv() {
       // A pending pre-roll listener (step 7) of the previous channel: remove it and re-add the
       // main listener first. changeChannelUrl(...) stops that pre-roll without calling it.
       let prerollAdTagUrl = channel.prerollAdTagUrl   // USE_PREROLL no: nil
       let changedUrl = flowerAdView.adsManager.changeChannelUrl(
           videoUrl: channel.streamUrl,             // original stream URL (String)
           adTagUrl: channel.adTagUrl,              // issued by Anypoint Media
           channelId: channel.channelId,            // registered in the Flower backend
           extraParams: channel.extraParams,        // [String: String]? targeting values
           mediaPlayerHook: mediaPlayerHook,
           adTagHeaders: channel.adTagHeaders,      // [String: String]? or nil
           channelStreamHeaders: channel.streamHeaders,  // headers the stream needs, or nil
           prerollAdTagUrl: prerollAdTagUrl
       )
       // prerollAdTagUrl nil (USE_PREROLL no): load changedUrl now (step 6) and play.
       // prerollAdTagUrl set: do NOT load it yet. Swap listeners (step 7).
   }

6. Load the returned URL:
   PLAYER_TYPE AVQueuePlayer: player.removeAllItems(); player.insert(AVPlayerItem(url: URL(string: changedUrl)!), after: nil)
   PLAYER_TYPE AVPlayer:      player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: changedUrl)!))
   player.play()

7. Only when prerollAdTagUrl was passed (USE_PREROLL yes, also on a restart) - temporary
   pre-roll listener:
   private var prerollListener: PrerollListener?   // the pending pre-roll listener, if any
   flowerAdView.adsManager.removeListener(adsManagerListener: listener)
   let pending = PrerollListener(onDone: { [weak self] done in
       DispatchQueue.main.async {
           guard let self = self, self.prerollListener === done else { return }  // first call only
           self.prerollListener = nil
           // load changedUrl (kept from step 5) and play (step 6)
           self.flowerAdView.adsManager.removeListener(adsManagerListener: done)
           self.flowerAdView.adsManager.addListener(adsManagerListener: self.listener)
       }
   })
   prerollListener = pending
   flowerAdView.adsManager.addListener(adsManagerListener: pending)
   PrerollListener implements the 8 methods and calls onDone(self) from onCompleted and onError
   (the SDK calls them off the main thread). It does NOT restart the channel.

8. Targeting update while playing (if the app knows program changes):
   flowerAdView.adsManager.changeChannelExtraParams(extraParams: ["key": value])

9. Release (viewWillDisappear / onDisappear) and before switching channel:
   func releasePlayer() {
       flowerAdView.adsManager.removeListener(adsManagerListener: listener)
       if let pending = prerollListener {   // pre-roll not finished: drop it, it must not load the old URL
           flowerAdView.adsManager.removeListener(adsManagerListener: pending)
           prerollListener = nil
       }
       flowerAdView.adsManager.stop()
       player.pause()
       // AVQueuePlayer: player.removeAllItems()   AVPlayer: player.replaceCurrentItem(with: nil)
   }
   (Re-add the listener in playLinearTv() before changeChannelUrl when the screen restarts.)

10. Restart the channel after an ad error (main thread, from the main listener's onError):
   private var errorRestartCount = 0   // reset when the user changes the channel
   func restartAfterAdError() {
       guard errorRestartCount < 3 else { return }   // simple retry limit
       errorRestartCount += 1
       flowerAdView.adsManager.stop()   // 1. stop the ads manager (also ends the proxy)
       player.pause()                   // 2. release the content item
       // AVQueuePlayer: player.removeAllItems()   AVPlayer: player.replaceCurrentItem(with: nil)
       playLinearTv()                   // 3. same start as before: new changeChannelUrl -> new item -> play
   }
   The restart passes the same prerollAdTagUrl and goes through step 7 like the first start.
   The channel has not changed, so the SDK skips the pre-roll and calls onCompleted right after
   changeChannelUrl(...) returns, so the temporary listener loads the new URL right away. Do
   not add a flag that drops prerollAdTagUrl on a restart. The temporary
   pre-roll listener (step 7) does NOT restart: the channel has not started yet, so its onError
   only loads the channel and swaps the listeners back.

========================================
RULES
========================================

DO:
- Play only the URL returned by changeChannelUrl(...); pass stream headers through
  channelStreamHeaders.
- Call stop() before starting another channel with changeChannelUrl(...).
- Before the next changeChannelUrl(...) and before stop(), remove a pending temporary pre-roll
  listener and restore the main listener. A pre-roll stopped by changeChannelUrl(...) or stop()
  never calls it, so it would stay registered and load the old channel's URL.
- Use values from the app's channel/config objects; do not hardcode URLs or IDs.

DO NOT:
- Do NOT use FlowerAVPlayer or FlowerLinearTvAdConfig here (different case).
- Do NOT call requestVodAd, enterChannel or requestChannelAd in this case.
- Do NOT pause or seek the player in onPlay/onPrepare.
- Do NOT load the channel before the pre-roll ends when USE_PREROLL is yes.
- Do NOT cast the loopback URL to another screen.

========================================
VERIFY
========================================

- The channel plays; at an ad break marker the Flower ad replaces the stream and the channel
  continues afterwards.
- USE_PREROLL yes: pre-roll first with no channel frame; no ad or request failure still starts
  the channel. A channel change during the pre-roll plays the new channel's pre-roll and never
  loads the previous channel.
- Channel change and coming back to the screen work repeatedly without old ads.
- onError: the ads manager is stopped and the channel restarts with a new changeChannelUrl
  (at most 3 times in a row); with USE_PREROLL yes the pre-roll does not play again and the
  channel starts right away.
- USE_PREROLL yes, A -> B -> A: A's pre-roll plays again.
- Leaving the app during a stream ad: the ad keeps playing, the ad UI is hidden.

========================================
OUTPUT
========================================

- Modify the code I paste below; keep its structure and names.
- Generate only the code for the selected UI_FRAMEWORK, PLAYER_TYPE and USE_PREROLL.
- List every file you changed or added.
- Do not add code for other cases (VOD, FlowerAVPlayer, direct ad playback, custom adapter).

My code:
```
