---
sidebar_position: 3
sidebar_label: VOD Ads in PIP Mode
---

# VOD Ads That Keep Playing in PIP Mode

Use this prompt when VOD ads must keep playing while the app is in PIP mode, for more ad inventory. With `FlowerSdk.setIgnoreAdBreakInPIPMode(false)`, the SDK plays VOD ads inside the app's own Media3 ExoPlayer, ExoPlayer2, or Bitmovin Player, so the app's player-event handling has to cope with ad items in the playlist. The LLM sets the option, adjusts the ad listener, and makes content-end and media-item handling ad-aware. Background: [VOD PIP Mode Support](../../../ad-insertion/vod/pip-mode-support.md).

The prompt generates Kotlin code and assumes the MediaPlayerHook integration from [VOD Ads with Your Own Player](./media-player-hook.md) (or the code you provide).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `SDK_VERSION` | e.g., `2.9.29` | Flower SDK version provided to your project |
| `PLAYER` | `media3` \| `exoplayer2` \| `bitmovin` | The content player your app uses |

```plain
We use the FLOWER SDK (Android) for VOD ads with MediaPlayerHook (requestVodAd).
We want VOD ads to keep playing in PIP mode. Modify the code I provide. Generate Kotlin.

========================================
GOAL
========================================
Switch to FlowerSdk.setIgnoreAdBreakInPIPMode(false) so that VOD ads play inside our own player
and keep playing in PIP, and make every player-event handler ad-aware.

========================================
PARAMETERS
========================================
SDK_VERSION: {{SDK_VERSION}}
PLAYER: {{PLAYER}}     (media3 | exoplayer2 | bitmovin)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- Only Media3 ExoPlayer, ExoPlayer2 and Bitmovin Player (and their Flower Player wrappers) play
  ads in the app's player. Any other player keeps using the SDK's own ad player.
  Inline ads (requestAd) always use the SDK's own ad player, regardless of this option.
- The ad player is chosen when ads are requested, so the option must be set BEFORE requestVodAd().
- When an ad break starts (at play()), the SDK puts the ad items into the player's playlist in
  front of the content, and the player moves to the ads. The SDK does not pause the content
  separately — pausing the player now pauses the ad itself.
- When the break ends, the SDK puts the content back at the resume point
  (interrupted position - rewindDuration, 5000 ms; 0 after a pre-roll):
    media3 / exoplayer2: the original MediaItem is added again as a NEW item, clipped with
      ClippingConfiguration.startPositionMs = resume point. currentPosition then counts from the
      resume point: original position = clippingConfiguration.startPositionMs + currentPosition.
    bitmovin: the content Source is loaded again with startOffset = resume point;
      currentTime stays the absolute content position.
- If an ad fails, the SDK puts the content back in the same way. In onError() the content is
  normally already playing again; resuming is a harmless safety net.
- Because items change around every break, Player.STATE_ENDED and onMediaItemTransition (Bitmovin:
  PlaybackFinished / PlaylistTransition) also fire for ad items. After a pre-roll that played
  before any content was loaded, the playlist contains only ads, so STATE_ENDED fires on an ad item.
  After the post-roll, the content comes back at its end, so STATE_ENDED can be reported again.
- In PIP, ads keep playing; mid-roll and post-roll are still requested. The SDK hides the ad UI
  (skip / learn more) while the app reports that the user left the app
  (FlowerSdk.notifyUserLeftApp(true)).
- Pre-roll, onPrepare/play(), and "start content on the first onCompleted()/onError()" work the
  same as in the default mode.

========================================
IMPLEMENTATION
========================================
1) Set the option once, before any requestVodAd() (e.g., in Application.onCreate after init,
   or right before requesting ads):
     FlowerSdk.setIgnoreAdBreakInPIPMode(false)

2) Keep the listener from the default integration, with these points:
   - onPrepare(): flowerAdView.adsManager.play() right away.
   - onPlay(): UI only. Do NOT call player.pause()/playWhenReady = false — that pauses the ad.
   - onCompleted(): start the content only if !isContentPrepared; otherwise nothing.
   - onError(): start the content if !isContentPrepared. Otherwise, on a mid-roll error
     (!isContentEnd), only resume: player.playWhenReady = true (bitmovin: player.play()) - no seek,
     no reload; a harmless safety net if the content is already playing. On a post-roll error
     (isContentEnd), do not resume.

3) Identify the content item. Keep the content URL in a member:
     private val contentUrl: String = ...
     media3 / exoplayer2:
       private fun isPlayingContent(): Boolean =
           player.currentMediaItem?.localConfiguration?.uri?.toString() == contentUrl
     bitmovin:
       private fun isPlayingContent(): Boolean = player.source?.config?.url == contentUrl

4) Content end -> notifyContentEnded() ONLY for the content item and ONLY once:
     media3 / exoplayer2:
       override fun onPlaybackStateChanged(playbackState: Int) {
           if (playbackState != Player.STATE_ENDED || !isPlayingContent()) return
           if (isContentEnd) return
           isContentEnd = true
           flowerAdView.adsManager.notifyContentEnded()
       }
     bitmovin:
       player.on<PlayerEvent.PlaybackFinished> {
           if (!isPlayingContent() || isContentEnd) return@on
           isContentEnd = true
           flowerAdView.adsManager.notifyContentEnded()
       }

5) Every other handler that reacts to media item changes or completion (auto-next episode,
   analytics, "resume from position" saving, controls, listeners attached to a specific item)
   must check isPlayingContent() first and must not assume the MediaItem the app created is
   still the current one. Example:
     override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
         playerView.useController = mediaItem?.localConfiguration?.uri?.toString() == contentUrl
     }

6) Content position (e.g., for resume-point saving or progress UI) after a mid-roll:
     media3 / exoplayer2:
       val contentPositionMs =
           (player.currentMediaItem?.clippingConfiguration?.startPositionMs ?: 0L) + player.currentPosition
     bitmovin:
       val contentPositionMs = (player.currentTime * 1000).toLong()

7) PIP: keep reporting the user leaving and returning, whether or not the app enters PIP:
   FlowerSdk.notifyUserLeftApp(true) from onUserLeaveHint() (before entering PIP) and
   FlowerSdk.notifyUserLeftApp(false) from onResume().
   FlowerSdk.notifyPictureInPictureModeChanged() is deprecated and replaced by notifyUserLeftApp();
   existing calls keep working, but replace them here. Entering PIP during an ad is fine in this mode
   (the ad keeps playing). enterPictureInPictureMode(PictureInPictureParams) still needs API 26
   (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O).

========================================
RULES
========================================
DO
- Call setIgnoreAdBreakInPIPMode(false) before requesting ads.
- Gate every completion / transition handler on isPlayingContent().
- Call notifyContentEnded() once per title.
DO NOT
- Do not pause, stop, clear or replace the player's media items while an ad break is playing.
- Do not treat STATE_ENDED / PlaybackFinished of an ad item as the end of the content.
- Do not use currentPosition alone as the content position after a mid-roll (media3 / exoplayer2).
- Do not reload the content after a mid-roll; the SDK puts it back. On a mid-roll onError(),
  only resume it.

========================================
VERIFY
========================================
- Pre-roll plays in the app's player; STATE_ENDED of the ad item does not trigger post-roll.
- Mid-roll: ad items play in the app's player; the content returns about 5 s before the
  interrupted point; saved/displayed content position is correct.
- Mid-roll ad error: the content comes back and keeps playing (it does not stay paused); it is
  not reloaded.
- Enter PIP during a mid-roll: the ad keeps playing in the PIP window; return to full screen: UI
  returns.
- Post-roll: requested once; STATE_ENDED after the post-roll does not trigger it again.
- No ad / ad request failure: the content starts normally.

========================================
OUTPUT
========================================
- Full code of the changed files and a short list of the changes.
```
