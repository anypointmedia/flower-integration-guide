---
sidebar_position: 4
sidebar_label: 커스텀 플레이어 어댑터
---

# 커스텀 플레이어를 사용한 Linear TV 광고 (MediaPlayerAdapter)

실시간 채널을 SDK가 `MediaPlayerHook`으로 지원하지 않는 플레이어(지원: AVPlayer, AVQueuePlayer, MobileVLCKit 3의 VLCMediaListPlayer)로 재생할 때 이 프롬프트를 사용하세요. 플레이어에 맞게 `MediaPlayerAdapter`를 구현하고, `mediaPlayerAdapter`를 받는 `changeChannelUrl(...)` 오버로드에 전달합니다. [플레이어 수동 제어](../../../ad-insertion/linear-tv-fast/manual-player-control#mediaplayeradapter-사용)와 [비디오 플레이어 전달 인터페이스 구현](../../../ad-insertion/implement-interface-video-player) 페이지를 참고하세요.

| 매개변수 | 값 | 설명 |
|----------|----|------|
| `PLAYER_NAME` | 예: `SwiftVLC MediaListPlayer` | 앱에서 사용하는 플레이어 클래스 |

```plain
Our iOS app plays a live channel / FAST stream in a player that FLOWER SDK does not support
through MediaPlayerHook. Implement MediaPlayerAdapter for it and insert Flower ads with
changeChannelUrl. Modify the code I paste below.

========================================
GOAL
========================================

- A MediaPlayerAdapter that reports our player's state accurately to the SDK.
- The channel plays through changeChannelUrl(...), with ad breaks replaced by Flower ads.

========================================
PARAMETERS
========================================

PLAYER_NAME: {{PLAYER_NAME}}

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- changeChannelUrl(videoUrl:adTagUrl:channelId:extraParams:mediaPlayerAdapter:adTagHeaders:
  channelStreamHeaders:prerollAdTagUrl:) returns a loopback proxy URL; the player must play it.
- Channel pre-roll (optional): with prerollAdTagUrl, the SDK requests a pre-roll and plays it
  once, before the channel, in its own ad player over the screen. The app holds the stream:
  keep changedUrl and load it only after the pre-roll ends - the first onCompleted/onError of a
  temporary listener (registered in place of the main listener), on the main thread; then swap
  the main listener back. The SDK ends the pre-roll with onCompleted also when there is no
  pre-roll ad, the request failed or the pre-roll could not be played. Around the pre-roll the
  SDK calls the adapter's pause() and resume(); both must be safe before changedUrl is loaded.
  A channel change (stop() + a new changeChannelUrl(...)) stops a pre-roll still playing and
  requests the new channel's pre-roll; drop the old temporary listener first.
- The SDK remembers the channel (channelId) entered last. When changeChannelUrl(...) is called
  with that same channelId (e.g. a restart after onError), the SDK skips the pre-roll even
  though prerollAdTagUrl is passed, and calls onCompleted (and the adapter's resume()) right
  after changeChannelUrl(...) returns, like a pre-roll with no ad. stop() does not clear the
  remembered channel; requestVodAd and requestAd do. A -> B -> A plays A's pre-roll again.
- The SDK calls the adapter from its own worker threads, synchronously. Every method must answer
  without waiting on the main thread (a main-queue hop that waits can deadlock).
- The SDK keeps the adapter for the whole ad session. Releasing the app's reference does not
  release it; stop driving the player from an old adapter when the session ends.
- Values: Media(urlOrId: String, duration: Double, position: Double) in milliseconds; use -1.0
  for "not known yet".
- getCurrentAbsoluteTime returns the epoch time (ms) of the playing position from
  EXT-X-PROGRAM-DATE-TIME. If the player cannot read it, return -1.0 and the SDK derives the
  clock from position; then also implement getMainTimelineRejoinCount() (number of ad breaks
  played to their end, never decreasing).
- getPlayerType(), getPlayerVersion(), getMainTimelineRejoinCount() and
  getLiveEdgeDistanceMs() have default implementations; override only what you can answer.

========================================
IMPLEMENTATION
========================================

1. SDK setup (skip if it already exists): FlowerSdk.setEnv(env:) + FlowerSdk.doInit().
2. Ad UI: FlowerAdView over the player view (UIKit: FlowerAdView.HostingController(), SwiftUI:
   flowerAdView.body in a ZStack).

3. Adapter skeleton - fill every method from PLAYER_NAME's API:

   import FlowerSdk

   final class PlayerAdapter: MediaPlayerAdapter, @unchecked Sendable {
       private let player: <PLAYER_NAME>
       init(player: <PLAYER_NAME>) { self.player = player }

       func getCurrentMedia() throws -> Media {
           // URL or ID of the item playing now, its duration and position in ms (-1.0 if unknown)
           Media(urlOrId: currentUrl, duration: durationMs, position: positionMs)
       }
       func getVolume() throws -> Float { /* 0.0 ... 1.0 */ }
       func isPlaying() throws -> Bool { /* actually rendering, not just "play requested" */ }
       func getHeight() throws -> Int32 { /* video height in px, 0 if unknown */ }
       func pause() throws { /* pause */ }
       func stop() throws { /* stop and release */ }
       func resume() throws { /* play */ }
       func enqueuePlayItem(playItem: PlayItem) throws { /* append playItem.url to the queue */ }
       func removePlayItem(playItem: PlayItem) throws { /* remove that item from the queue */ }
       func playNextItem() throws { /* jump to the next queued item */ }
       func seekToPosition(absoluteStartTimeMs: Double?, relativeStartTimeMs: Double?,
                           offsetMs: Double?, windowDurationMs: Double?, periodIndex: Int32?) throws {
           /* seek with the values the player understands */
       }
       func getCurrentAbsoluteTime(isPrintDetails: Bool) throws -> Double { /* or -1.0 */ }
       func getPlayerType() -> String? { "<PLAYER_NAME>" }
   }
   If the player is main-actor-only, keep a lock-protected snapshot refreshed on the main queue
   (e.g. every 100 ms) and answer from the snapshot.

4. Start the channel:
   let adapter = PlayerAdapter(player: player)
   flowerAdView.adsManager.addListener(adsManagerListener: listener)
   let changedUrl = flowerAdView.adsManager.changeChannelUrl(
       videoUrl: channel.streamUrl,
       adTagUrl: channel.adTagUrl,
       channelId: channel.channelId,
       extraParams: channel.extraParams,
       mediaPlayerAdapter: adapter,
       adTagHeaders: channel.adTagHeaders,
       channelStreamHeaders: channel.streamHeaders,
       prerollAdTagUrl: nil              // or the pre-roll tag; then load changedUrl only after
                                         // the first onCompleted/onError. Pass the same
                                         // value on a restart after onError (step 5).
   )
   // load changedUrl into the player and play

5. Listener: all 8 methods (onPrepare, onPlay, onCompleted, onError, onAdBreakSkipped,
   onAdBreakPrepare, onAdPlay, onAdUserAction). For linear TV they are UI-only, except onError:
   hop to the main thread and restart the channel - flowerAdView.adsManager.stop(), stop and
   release the player's current item, make the old adapter stop touching the player, then
   step 4 again with a new adapter and a new changeChannelUrl(...) (the old loopback URL dies
   with stop()). The restart passes exactly the same parameters as the first start, including
   prerollAdTagUrl, and handles changedUrl the same way (held until the first onCompleted/
   onError if a pre-roll tag was passed). The SDK skips the pre-roll of the channel entered
   last and calls onCompleted right away, so the viewer does not see it again. A break cut short by stop() may still report onCompleted afterwards, so keep
   onCompleted idempotent. Keep a simple retry limit (e.g. at most 3 restarts in a row). While waiting for
   a pre-roll, the first onCompleted/onError only loads changedUrl; it does not restart.

6. Release: removeListener, flowerAdView.adsManager.stop(), stop the player, and make the old
   adapter stop touching the player (e.g. an invalidate() that cancels its sampler).

========================================
RULES
========================================

DO:
- Report the position of the item that is playing now; when an ad item starts, it is that
  item's own position.
- Answer every adapter call quickly and thread-safely.
- Use values from the app's channel/config objects.

DO NOT:
- Do NOT use MediaPlayerHook or FlowerAVPlayer for this player.
- Do NOT block on DispatchQueue.main.sync inside adapter methods.
- Do NOT return Int32 values to Media; duration and position are Double.

========================================
VERIFY
========================================

- The channel plays from the returned URL; ad breaks are replaced and the channel continues.
- Ad UI (skip, "more info") appears during ads; quartile tracking fires.
- isPlaying() turns false while the stream is paused or buffering, and true again when it plays.
- Channel change: the old adapter no longer reads or drives the player.
- onError: the ads manager stops and the channel restarts from a new changeChannelUrl, without
  the pre-roll playing again.

========================================
OUTPUT
========================================

- Modify the code I paste below; add the adapter as a new file if needed.
- List every file you changed or added.
- Do not add code for other cases (VOD, FlowerAVPlayer, direct ad playback).

My code:
```
