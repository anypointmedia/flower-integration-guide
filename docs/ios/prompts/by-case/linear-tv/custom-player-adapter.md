---
sidebar_position: 4
sidebar_label: Custom Player Adapter
---

# Linear TV Ads with a Custom Player (MediaPlayerAdapter)

Use this prompt when your live channel plays in a player the SDK does not support through `MediaPlayerHook` (supported: AVPlayer, AVQueuePlayer, VLCMediaListPlayer of MobileVLCKit 3). You implement `MediaPlayerAdapter` for your player and pass it to the `changeChannelUrl(...)` overload that takes `mediaPlayerAdapter`. See [Manual Player Control](../../../ad-insertion/linear-tv-fast/manual-player-control#using-mediaplayeradapter) and [Implement an Interface for Passing Video Player](../../../ad-insertion/implement-interface-video-player).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `PLAYER_NAME` | e.g. `SwiftVLC MediaListPlayer` | The player class your app uses |

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
                                         // the first onCompleted/onError. Always nil on a
                                         // restart after onError (step 5).
   )
   // load changedUrl into the player and play

5. Listener: all 8 methods (onPrepare, onPlay, onCompleted, onError, onAdBreakSkipped,
   onAdBreakPrepare, onAdPlay, onAdUserAction). For linear TV they are UI-only, except onError:
   hop to the main thread and restart the channel - flowerAdView.adsManager.stop(), stop and
   release the player's current item, make the old adapter stop touching the player, then
   step 4 again with a new adapter and a new changeChannelUrl(...) (the old loopback URL dies
   with stop()). A restart leaves the channel pre-roll out (prerollAdTagUrl omitted): the
   viewer has already seen it. So the restart passes prerollAdTagUrl: nil and loads changedUrl
   right away, with no pre-roll wait. A break cut short by stop() may still report onCompleted afterwards, so keep
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
  a pre-roll.

========================================
OUTPUT
========================================

- Modify the code I paste below; add the adapter as a new file if needed.
- List every file you changed or added.
- Do not add code for other cases (VOD, FlowerAVPlayer, direct ad playback).

My code:
```
