---
sidebar_position: 3
sidebar_label: Direct Ad Playback Control
---

# Linear TV Ads Played by the App (Direct Ad Playback Control)

Use this prompt when your app plays the channel's original stream itself (no SDK proxy, no `changeChannelUrl`) and detects ad markers such as SCTE-35 on its own. The app asks the SDK for ads with `requestChannelAd(...)` and plays the creatives in a second, app-owned ad player; the SDK follows that ad player through a `MediaPlayerAdapter` for tracking. See [Direct Ad Playback Control](../../../ad-insertion/linear-tv-fast/direct-ad-playback-control).

A channel pre-roll is not supported in this case: `enterChannel(...)` has no `prerollAdTagUrl` parameter.

This prompt has no parameters. The guide code is UIKit; in SwiftUI keep the same logic in an `ObservableObject`.

```plain
Our iOS app plays a live channel's original stream itself and detects the ad markers
(e.g. SCTE-35) itself. Add FLOWER SDK ads that our app plays in its own second player.
Modify the code I paste below.

========================================
GOAL
========================================

- At each ad marker, request ads from the SDK, play them in an app-owned ad player over the
  channel, and return to the channel when the break ends or no ad is available.
- Ad tracking (impressions, quartiles, skip, "more info") works through the SDK.

========================================
PARAMETERS
========================================

None.

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- enterChannel(adTagUrl:channelId:extraParams:platformMediaPlayerAdapter:adTagHeaders:) starts
  the session. The adapter is for the AD player, not the channel player.
- Channel pre-roll is NOT supported in this case: enterChannel(...) has no prerollAdTagUrl
  parameter, so no pre-roll plays when the channel starts. Start the channel right away.
- requestChannelAd(transactionId:cueDuration:uniqueProgramId:timeout:onAd:onCompleted:) returns
  a ChannelAdRequest. onAd is called once per ad, onCompleted exactly once with nil (ads were
  delivered) or "NO_AD" / "TIMEOUT" / "INTERNAL_ERROR". Both run on an SDK worker thread.
- The same transactionId twice: no request, onCompleted(nil) immediately. Use one transactionId
  per break (the SCTE-35 splice event ID is recommended).
- The SDK never drives the ad player here. It only polls the adapter (getCurrentMedia(),
  isPlaying()) on a worker thread to follow ad progress.
- adsManager.play() tells the SDK that the break started. The listener's onCompleted / onError /
  onAdBreakSkipped mark the end of the break.

========================================
IMPLEMENTATION
========================================

1. SDK setup (skip if it already exists): FlowerSdk.setEnv(env:) + FlowerSdk.doInit().

2. Views: channel player view, then an ad container view (hidden by default) holding the ad
   player's AVPlayerLayer or AVPlayerViewController, then FlowerAdView on top:
     private let flowerAdViewHostingController = FlowerAdView.HostingController()
     private var flowerAdView: FlowerAdView { flowerAdViewHostingController.adView }
   Players: let contentPlayer = AVPlayer(); let adPlayer = AVQueuePlayer()

3. Ad player adapter. Copy this class (it is the guide's implementation):

   class DirectAdPlayerAdapter: NSObject, MediaPlayerAdapter, @unchecked Sendable {
       private let player: AVQueuePlayer
       private let lock = NSLock()
       private var urlByItem: [ObjectIdentifier: String] = [:]
       init(player: AVQueuePlayer) { self.player = player; super.init() }
       func register(item: AVPlayerItem, url: String) {
           lock.lock(); urlByItem[ObjectIdentifier(item)] = url; lock.unlock()
       }
       func forgetItems() { lock.lock(); urlByItem.removeAll(); lock.unlock() }
       private func url(of item: AVPlayerItem) -> String {
           lock.lock(); defer { lock.unlock() }; return urlByItem[ObjectIdentifier(item)] ?? ""
       }
       func getCurrentMedia() throws -> Media {
           guard let item = player.currentItem else { return Media(urlOrId: "", duration: -1.0, position: -1.0) }
           let durationMs = CMTimeGetSeconds(item.duration) * 1000
           let positionMs = CMTimeGetSeconds(player.currentTime()) * 1000   // per ad, from 0
           return Media(urlOrId: url(of: item),
                        duration: durationMs.isFinite ? durationMs : -1.0,
                        position: positionMs.isFinite ? positionMs : -1.0)
       }
       func getVolume() throws -> Float { player.volume }
       func isPlaying() throws -> Bool { player.rate != 0.0 }
       func getHeight() throws -> Int32 { Int32(player.currentItem?.presentationSize.height ?? 0) }
       func pause() throws { player.pause() }
       func stop() throws { player.pause(); player.removeAllItems() }
       func resume() throws { player.play() }
       func enqueuePlayItem(playItem: PlayItem) throws {}
       func removePlayItem(playItem: PlayItem) throws {}
       func playNextItem() throws { player.advanceToNextItem() }
       func seekToPosition(absoluteStartTimeMs: Double?, relativeStartTimeMs: Double?, offsetMs: Double?, windowDurationMs: Double?, periodIndex: Int32?) throws {}
       func getCurrentAbsoluteTime(isPrintDetails: Bool) throws -> Double { -1.0 }
       func getPlayerType() -> String? { "AVQueuePlayer" }
       func getPlayerVersion() -> String? { nil }
   }

4. Enter the channel and play the original stream:
   flowerAdView.adsManager.addListener(adsManagerListener: self)
   flowerAdView.adsManager.enterChannel(
       adTagUrl: channel.adTagUrl, channelId: channel.channelId,
       extraParams: channel.extraParams, platformMediaPlayerAdapter: adPlayerAdapter,
       adTagHeaders: channel.adTagHeaders
   )
   Stream headers go on your own AVURLAsset (options: ["AVURLAssetHTTPHeaderFieldsKey": headers]).
   contentPlayer.replaceCurrentItem(with: AVPlayerItem(asset: asset)); contentPlayer.play()

5. At each ad marker, request ads (timeout = time left until the marker, in ms):
   channelAdRequest = flowerAdView.adsManager.requestChannelAd(
       transactionId: spliceEventId, cueDuration: breakDurationMs,
       uniqueProgramId: programId, timeout: msUntilMarker
   ) { @Sendable [weak self] ad in
       let adId = ad.id
       let url = Self.bestFitCreativeUrl(of: ad, preferredHeight: preferredHeight)  // nonisolated static
       Task { @MainActor in self?.enqueue(adId: adId, creativeUrl: url) }
   } onCompleted: { @Sendable [weak self] error in
       Task { @MainActor in self?.handleRequestCompleted(error: error) }
   }
   preferredHeight is read on the main thread before the call. bestFitCreativeUrl picks a
   .m3u8/.mp4 creative closest to the ad view height and returns its URL unchanged.

6. Play the break (main thread):
   - enqueue: build AVPlayerItem from the URL exactly as received, adPlayerAdapter.register(item:url:),
     adPlayer.insert(item, after: nil); on the first ad of the break start it once:
     show the ad container, flowerAdView.show(), contentPlayer.volume = 0, adPlayer.play(),
     flowerAdView.adsManager.play(). Later ads of the same break keep being appended.
   - handleRequestCompleted: channelAdRequest = nil; if error != nil, finishAdBreak().
   - finishAdBreak: adPlayer.pause(); adPlayer.removeAllItems(); adPlayerAdapter.forgetItems();
     hide the ad container; flowerAdView.hide(); contentPlayer.volume = 1.

7. Listener (8 methods, declared nonisolated on a UIViewController, hop to the main actor):
   onCompleted and onAdBreakSkipped -> Task { @MainActor in self.finishAdBreak() };
   onError -> Task { @MainActor in self.finishAdBreak(); self.restartAfterAdError() };
   onPrepare, onPlay, onAdBreakPrepare, onAdPlay, onAdUserAction -> empty.

   private var errorRestartCount = 0   // reset when the user changes the channel
   func restartAfterAdError() {
       guard errorRestartCount < 3 else { return }   // simple retry limit
       errorRestartCount += 1
       channelAdRequest?.cancel(); channelAdRequest = nil
       flowerAdView.adsManager.stop()                 // 1. stop the ads manager
       contentPlayer.pause()                          // 2. release the content item
       contentPlayer.replaceCurrentItem(with: nil)
       // 3. start again the same way as step 4: enterChannel(...), new AVPlayerItem, play()
   }

8. Leaving the channel (viewWillDisappear):
   channelAdRequest?.cancel(); channelAdRequest = nil
   flowerAdView.adsManager.removeListener(adsManagerListener: self)
   flowerAdView.adsManager.stop()
   adPlayer.pause(); adPlayer.removeAllItems()
   contentPlayer.pause(); contentPlayer.replaceCurrentItem(with: nil)

========================================
RULES
========================================

DO:
- Keep onCompleted idempotent: a break cut short by adsManager.stop() may still report
  onCompleted after the restart has begun.
- Keep the creative URL exactly as received (its query identifies the ad for tracking).
- Report position per ad, starting from 0 for each creative.
- Touch players and views only on the main actor; keep SDK callbacks @Sendable.

DO NOT:
- Do NOT call changeChannelUrl(...) or use FlowerAVPlayer in this case.
- Do NOT read AVPlayerItem.asset inside the adapter (worker thread); use the registered URLs.
- Do NOT reuse a transactionId for a different break.
- Do NOT play the ads in the channel player.

========================================
VERIFY
========================================

- At a marker with ads: the ad player shows over the channel, FlowerAdView UI appears, the
  channel is muted, and the channel returns when the break ends.
- NO_AD / TIMEOUT / INTERNAL_ERROR: the channel keeps playing, nothing is shown.
- Several ads in one break play back to back; quartile tracking fires per ad.
- Leaving during a break: no further callbacks, no sound.
- onError: the break ends, the ads manager stops and the channel is entered and played again.

========================================
OUTPUT
========================================

- Modify the code I paste below; keep its structure and names.
- List every file you changed or added.
- Do not add code for other cases (changeChannelUrl, FlowerAVPlayer, VOD).

My code:
```
