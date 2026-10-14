---
sidebar_position: 4
sidebar_label: Migrate to SDK-Managed Content
---

# Migrate an Existing VOD Integration to SDK-Managed Content

Use this prompt when the app already integrates VOD ads with an earlier SDK version, and its code pauses or resumes the content around ad breaks, delays `play()` in `onPrepare`, or rewinds the content itself. Starting with the next SDK version, the SDK plays VOD ads in its own ad player by default and pauses, rewinds, and resumes the content around a mid-roll by itself, so that app-side code now fights the SDK. The LLM finds and removes those patterns. Background: [Release Notes](../../../release-notes.md), [VOD Ad Implementation](../../../ad-insertion/vod/vod-ad-implementation.md), [VOD PIP Mode Support](../../../ad-insertion/vod/pip-mode-support.md).

The prompt generates Kotlin code.

| Parameter | Values | Description |
|-----------|--------|-------------|
| `SDK_VERSION` | e.g., the next release | The new Flower SDK version you are upgrading to |
| `AD_MODE` | `default` \| `ads-in-pip` | `default`: ads play in the SDK's ad player (`setIgnoreAdBreakInPIPMode(true)`). `ads-in-pip`: keep ads in the app's player (`setIgnoreAdBreakInPIPMode(false)`) |

```plain
We are upgrading the FLOWER SDK (Android) and must update our existing VOD ad integration.
Review the code I provide, remove what conflicts with the new SDK behavior, and output the
updated Kotlin code.

========================================
GOAL
========================================
Make the app stop pausing, delaying, rewinding or resuming the content around VOD ad breaks,
because the SDK now does it, while keeping pre-roll, mid-roll and post-roll working. The one
app-side action kept is a plain resume of the content on a mid-roll ad error (onError()).

========================================
PARAMETERS
========================================
SDK_VERSION: {{SDK_VERSION}}
AD_MODE: {{AD_MODE}}     (default | ads-in-pip)

========================================
HOW THE SDK BEHAVES AFTER THE UPGRADE
========================================
- FlowerSdk.setIgnoreAdBreakInPIPMode now defaults to true: VOD ads play in the SDK's own ad
  player inside FlowerAdView, over the content. (Before, supported players — Media3 ExoPlayer,
  ExoPlayer2, Bitmovin — played the ads inside the app's player.)
- Mid-roll: the ad is requested requestTimeout + minPrepareDuration before its position;
  onPrepare() now arrives when the content REACHES the position. In the default mode the SDK
  pauses the content at onPrepare(), and after the break seeks it back by rewindDuration
  (5000 ms) and resumes it.
- Pre-roll: the SDK does not touch the content. onCompleted() (or onError()) always ends the
  pre-roll phase, also when there is no pre-roll or the request fails.
- Post-roll: requested by notifyContentEnded(); the content is not resumed afterwards.
- Ad error (onError()): the app resumes the content on a mid-roll error (no seek, no reload);
  the content is normally already playing again, so resuming is a harmless safety net.
  On a post-roll error it does not resume.
- With setIgnoreAdBreakInPIPMode(true), an ad playing when the user leaves the app is paused and
  resumed when the user comes back (the app must report both with FlowerSdk.notifyUserLeftApp(),
  whether or not it enters PIP).

========================================
IMPLEMENTATION — find and fix
========================================
1) onPrepare(): remove any delay, countdown, "ads start in N seconds" wait, or
   "if (player.isPlaying) { delay(...) }" branch before adsManager.play(). Call
   flowerAdView.adsManager.play() immediately for every break. A notice UI may still be shown,
   but it must not delay play().

2) onPlay(): remove player.pause() / player.playWhenReady = false / player.stop().
   Keep only UI work (hide controls, show an ad indicator).

3) onCompleted() / onError(): keep "load and start the content" ONLY for the first call
   (pre-roll phase). Remove resume / seek / reload code that ran after a completed mid-roll.
   In onError() after the content started, keep (or add) only a plain resume for a mid-roll:
     private var isContentPrepared = false
     private var isContentEnd = false
     private fun onAdBreakFinished() {          // onCompleted()
         if (!isContentPrepared) {
             isContentPrepared = true
             startContent()
         }
         // after a mid-roll: nothing - the SDK resumes the content
     }
     private fun onAdBreakFailed() {            // onError()
         if (!isContentPrepared) {
             isContentPrepared = true
             startContent()
         } else if (!isContentEnd) {
             player.playWhenReady = true        // mid-roll error: resume only (Bitmovin: play())
         }
         // after a post-roll error: do not resume
     }
   Remove "if (!isContentEnd) player.playWhenReady = true" patterns from onCompleted(); in
   onError() that resume is the one allowed app action. Remove any seek or reload in both.

4) Remove app-side rewind logic (saving the position at the break and seeking back by N seconds).
   The SDK rewinds by rewindDuration. With a Flower Player, set FlowerVodAdConfig.rewindDuration
   (and requestTimeout / minPrepareDuration) instead; with requestVodAd() they are fixed at 5000 ms.

5) Request step: requestVodAd() must not be followed by loading/starting the content. Move that
   into step 3 (first onCompleted/onError). Keep mediaPlayerHook = { player } as a named argument.

6) Flower Player onError(): do not restart the whole VOD on every error. Only an error before the
   content started (pre-roll playback error) needs recovery: play the content without an ad
   config. On a mid-roll error, resume the content with player.play() (no seek, no reload);
   on a post-roll error, do not resume.

7) Player state mirroring: if the app calls adsManager.pause()/resume() from player callbacks
   (onIsPlayingChanged, onPlaybackStateChanged), move those calls to explicit user actions only.
   The SDK now pauses/resumes the content itself, and mirroring would pause the ad.

8) AD_MODE = default:
   - Make sure FlowerAdView is in the layout on top of the player (MediaPlayerHook), same size,
     android:visibility="gone". Flower Players add it themselves.
   - PIP: report the user leaving with FlowerSdk.notifyUserLeftApp(true) in onUserLeaveHint()
     before deciding on PIP, and the user returning with FlowerSdk.notifyUserLeftApp(false) in
     onResume(). notifyPictureInPictureModeChanged() is deprecated and replaced by
     notifyUserLeftApp(); existing calls keep working, but replace them here. Do not
     enter PIP while an ad is playing (track isAdPlaying: true in onPlay, false in
     onCompleted/onError). enterPictureInPictureMode(PictureInPictureParams) requires API 26.
   AD_MODE = ads-in-pip:
   - Call FlowerSdk.setIgnoreAdBreakInPIPMode(false) before requesting ads.
   - Keep the ad-aware handlers: check the current item is the content before treating
     STATE_ENDED / onMediaItemTransition as the content's, call notifyContentEnded() once,
     and compute the content position as clippingConfiguration.startPositionMs + currentPosition
     (Media3 / ExoPlayer2; Bitmovin currentTime is already absolute).
   - Steps 1, 3, 4, 5 still apply; pausing the player in onPlay() would pause the ad itself.

9) Update the dependency to {{SDK_VERSION}} (and the Media3 companion artifact, if used, to the
   same Flower SDK version).

========================================
RULES
========================================
DO
- Keep behavior for pre-roll start, post-roll (notifyContentEnded once) and cleanup
  (removeListener, stop, release) unchanged.
- List every removed block in the output with the reason.
DO NOT
- Do not add new pause/seek/resume code around ad breaks (except the plain resume in onError()
  for a mid-roll).
- Do not change ad tag URLs, content IDs or extraParams.
- Do not switch approach (Flower Player <-> MediaPlayerHook) unless asked.

========================================
VERIFY
========================================
- Pre-roll: content starts after the pre-roll; no content frame before it.
- No ad / failed request: content starts.
- Mid-roll: no double pause, no jump back twice; content resumes about 5 s before the
  interrupted point exactly once.
- Mid-roll ad error: the content resumes (it does not stay paused), with no reload.
- Post-roll: plays once after the content ends.
- PIP during an ad (default mode): the ad pauses in PIP and resumes when the app returns.

========================================
OUTPUT
========================================
- Updated code for every changed file.
- A table: removed / changed code -> reason (which SDK behavior replaces it).
```
