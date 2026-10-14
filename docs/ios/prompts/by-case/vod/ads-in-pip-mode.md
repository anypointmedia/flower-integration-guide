---
sidebar_position: 3
sidebar_label: VOD Ads in PIP Mode
---

# VOD Ads that Keep Playing in PIP Mode

Use this prompt when VOD ads must keep playing while the app is in PIP mode (`FlowerSdk.setIgnoreAdBreakInPIPMode(false)`). In this mode the SDK plays the ads inside your own player, and the content comes back as a new `AVPlayerItem` after each ad break, so the prompt also rewrites how your app detects the end of the content. Start from a working [VOD with MediaPlayerHook](./media-player-hook) or [VOD with FlowerAVPlayer](./flower-avplayer) integration. See [PIP Mode Support](../../../ad-insertion/vod/pip-mode-support#supporting-ads-in-pip-mode).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `PLAYER` | `AVPlayer` \| `AVQueuePlayer` \| `FlowerAVPlayer` | The content player |

```plain
Our iOS app already plays FLOWER SDK VOD ads. We want the ads to keep playing in PIP mode.
Switch the integration to FlowerSdk.setIgnoreAdBreakInPIPMode(false) and fix everything that
depends on the content AVPlayerItem. Modify the code I paste below.

========================================
GOAL
========================================

- VOD ads (pre-roll, mid-roll, post-roll) play inside the app's player, also in PIP mode.
- Content-end detection, post-roll and post-playback actions keep working after ad breaks.

========================================
PARAMETERS
========================================

PLAYER: {{PLAYER}}   (AVPlayer | AVQueuePlayer | FlowerAVPlayer)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- setIgnoreAdBreakInPIPMode(false) is read when ads are requested, so it must be called before
  requestVodAd(...) or FlowerAVPlayer.replaceCurrentItem(with:adConfig:).
- Only AVPlayer and AVQueuePlayer (including FlowerAVPlayer) play ads inside the app's player.
  Any other player keeps using the SDK's own ad player.
- When an ad break starts, the SDK replaces the player's current item with the ad items
  (AVQueuePlayer: queues them in front of the content). The ads are the player's items now, so
  pausing the player pauses the ad.
- When the break ends, the SDK puts the content back as a NEW AVPlayerItem created from the
  content URL only, at the interrupted position minus 5 seconds (rewindDuration; configurable
  only through FlowerVodAdConfig with FlowerAVPlayer).
- Not carried over to the new item: AVURLAsset options (HTTP headers, cookies), resourceLoader
  delegates (FairPlay), preferredForwardBufferDuration / preferredPeakBitRate, selected audio and
  subtitle tracks, and KVO/notification observers registered on the old item.
- When an ad fails to play, the SDK puts the content back the same way before it calls onError.
  With AVPlayer it seeks only once the new item is ready, so a player.play() from onError can
  land before that seek: the content may briefly play from the start of the item before it
  jumps to the resume point.
- Mid-roll and post-roll breaks are also requested and played while in PIP mode.
- The first onCompleted/onError still marks the moment to start the content (MediaPlayerHook
  apps): the SDK calls onCompleted also when there is no pre-roll or the request failed.

========================================
IMPLEMENTATION
========================================

1. Check first: if the app relies on any item-level setting listed above (for example FairPlay
   or request headers on AVURLAsset), STOP and tell me - this mode cannot keep them. Keep the
   default mode instead.

2. Before requesting ads (e.g. right before requestVodAd / replaceCurrentItem(with:adConfig:)):

   // Play ads in the app's player so that they keep playing in PIP mode
   FlowerSdk.setIgnoreAdBreakInPIPMode(false)

3. Detect the end of the content by URL, for every item (not object: playerItem):

   let contentURL = config.contentUrl
   var isContentEnd = false

   contentEndObserver = NotificationCenter.default.addObserver(
       forName: .AVPlayerItemDidPlayToEndTime, object: nil, queue: .main
   ) { [weak self] notification in
       guard let self = self,
             let item = notification.object as? AVPlayerItem,
             (item.asset as? AVURLAsset)?.url == self.contentURL else { return }  // an ad ended
       guard !self.isContentEnd else { return }   // the content may end again after the post-roll
       self.isContentEnd = true
       self.adsManager.notifyContentEnded()
   }
   adsManager is flowerAdView.adsManager (MediaPlayerHook) or player.flowerAdView.adsManager
   (FlowerAVPlayer).

4. Move every other per-item observer (status / KVO on a specific item, currentItem change
   handlers, a library's end-of-playback callback) to logic that checks the content URL of
   player.currentItem, and re-attach it when the current item becomes the content again.

5. Listener (MediaPlayerHook apps): keep play() in onPrepare and the isContentPrepared start
   logic. After a mid-roll, do nothing in onCompleted. Keep the onError handling: pre-roll
   error -> start the content; mid-roll error -> player.play() as a safety net (no seek, no
   reload); post-roll error -> do not resume. FlowerAVPlayer apps keep the onError handling of
   the FlowerAVPlayer case (pre-roll error -> start the content in a new FlowerAVPlayer once;
   mid-roll error -> player.play()).

6. Leaving the app: keep calling FlowerSdk.notifyUserLeftApp(true) when the user leaves the app
   and (false) when the user comes back, from the app lifecycle (didEnterBackground /
   willEnterForeground, or scenePhase in SwiftUI). If the code still calls the deprecated
   FlowerSdk.notifyPictureInPictureModeChanged, replace it with notifyUserLeftApp. Remove any
   code that blocks PIP while an ad plays (that belongs to the default mode).

========================================
RULES
========================================

DO:
- Call setIgnoreAdBreakInPIPMode(false) before the ad request, every time the screen starts.
- Compare URLs to tell ad items from the content.
- Call notifyContentEnded() only once per content.

DO NOT:
- Do NOT call player.pause() in onPlay/onPrepare or around a break - it stops the ad itself.
- Do NOT assume the AVPlayerItem the app created is still playing after the first break.
- Do NOT register .AVPlayerItemDidPlayToEndTime with object: playerItem.
- Do NOT seek or reload the content after a break; the SDK puts it back itself. (player.play()
  in onError after a mid-roll is the one allowed call.)
- Do NOT call insert/removeAllItems/advanceToNextItem/items on FlowerAVPlayer (unavailable).

========================================
VERIFY
========================================

- Pre-roll, then content from 0; no content frame before the ad.
- Mid-roll in the foreground: ad plays in the player, content resumes about 5 s earlier.
- Enter PIP during the content and wait for a mid-roll: the ad plays in the PIP window.
- Enter PIP during an ad: the ad keeps playing.
- Post-roll after the content ends, then post-playback actions run exactly once.
- No ad / request failure: the content starts and ends normally.
- Ad playback error during a mid-roll: the content comes back and keeps playing.

========================================
OUTPUT
========================================

- Modify the code I paste below; keep its structure and names.
- List every file you changed or added.
- Do not add code for other cases (linear TV, default-mode PIP blocking).

My code:
```
