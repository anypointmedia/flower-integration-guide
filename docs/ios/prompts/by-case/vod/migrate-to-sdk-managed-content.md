---
sidebar_position: 4
sidebar_label: Migrate to SDK-Managed Content
---

# Migrate an Existing VOD Integration to SDK-Managed Content

Use this prompt when your app already has a VOD integration with `MediaPlayerHook` that pauses, resumes, seeks or delays the content itself around ad breaks (for example `player.pause()` in `onPlay`, a countdown before `play()` in `onPrepare`, or `player.play()` after every `onCompleted`). With the default `FlowerSdk.setIgnoreAdBreakInPIPMode(true)`, the SDK now pauses and resumes the content around a mid-roll by itself, so that code must go. The prompt removes it and keeps only the pre-roll start logic and, in `onError` after a mid-roll, a `player.play()` safety net. See [VOD Pre-roll, Mid-roll, Post-roll Ad Implementation](../../../ad-insertion/vod/vod-ad-implementation).

This prompt has no parameters.

```plain
Our iOS app has an existing FLOWER SDK VOD integration (FlowerAdView + MediaPlayerHook +
requestVodAd). It was written when the app had to pause, resume or delay the content around ad
breaks itself. Update it to the current SDK behavior. Modify the code I paste below.

========================================
GOAL
========================================

- Remove all app-side content control around VOD ad breaks.
- Keep: play() in onPrepare, starting the content after the pre-roll, notifyContentEnded(),
  post-playback actions after the post-roll, and cleanup.
- Keep (or add) one app-side call: player.play() in onError after a mid-roll.

========================================
PARAMETERS
========================================

None. Keep the UI framework and player type of the pasted code.

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- Default mode (FlowerSdk.setIgnoreAdBreakInPIPMode(true)): every VOD ad plays in the SDK's own
  ad player over the content.
- Pre-roll: the content is not loaded yet; the SDK does not touch the content player.
- Mid-roll: the SDK calls onPrepare when the content reaches the mid-roll position and pauses the
  content itself at that moment. When the break ends (onCompleted or onError), it seeks the
  content back 5 seconds (rewindDuration, not configurable through requestVodAd) and resumes it.
  On a mid-roll onError the app calls player.play(); the content is normally already playing
  again, so resuming is a harmless safety net.
- Post-roll: after notifyContentEnded(); the content has ended, nothing is resumed.
- When there is no pre-roll, no ad break, or the ad request fails, the SDK still calls
  onCompleted once, so the first onCompleted/onError is where the content starts.

========================================
IMPLEMENTATION
========================================

1. Find and REMOVE these patterns:
   a. player.pause() (or rate = 0) in onPlay, onPrepare or onAdBreakPrepare.
   b. Delayed play in onPrepare, e.g.
        if player.rate != 0 { Task { try await Task.sleep(...); adsManager.play() } }
      and any "Ads will start in a moment" countdown that delays play().
   c. seek(to:) / reloading the item in onCompleted or onError after a mid-roll, and
      player.play() in onCompleted after a mid-roll (including "if !isContentEnd { player.play() }"
      in onCompleted). player.play() in onError after a mid-roll stays (step 3).
   d. Saving the playback position before a mid-roll and seeking back after it.
   e. Loading or playing the content right after requestVodAd(...).
   f. Re-requesting ads or recreating the player on a mid-roll error.

2. Make onPrepare play right away, on the main thread:
   func onPrepare(adDurationMs: Int32) {
       DispatchQueue.main.async { self.flowerAdView.adsManager.play() }
   }

3. Make onCompleted / onError start the content only the first time, and make onError resume
   the content after a mid-roll:
   func onCompleted() {
       DispatchQueue.main.async {
           if !self.isContentPrepared {
               self.prepareContentSource()   // sets isContentPrepared = true, loads, plays
           } else if self.isContentEnd {
               // post-roll finished: post-playback actions
           }
           // after a mid-roll: nothing
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
           // post-roll error: the content has ended - do not resume it
       }
   }
   If the code has no isContentPrepared flag yet, add it (false before requestVodAd) and move
   the content loading (AVPlayerItem creation, insert / replaceCurrentItem, play()) and the
   .AVPlayerItemDidPlayToEndTime observer into prepareContentSource().

4. Keep onPlay for UI-only work (hide your own controls, show an ad badge).

5. Make sure FlowerAdsManagerListener has all 8 methods: onPrepare(adDurationMs:), onPlay(),
   onCompleted(), onError(error:), onAdBreakSkipped(reason:), onAdBreakPrepare(adInfos:),
   onAdPlay(adInfo:), onAdUserAction(action:adInfo:).

6. If the code calls FlowerSdk.setIgnoreAdBreakInPIPMode(false), STOP and tell me: that is the
   "ads in PIP mode" case, where the ads play inside the app's player and different rules apply.

========================================
RULES
========================================

DO:
- Delete the old code instead of commenting it out, and keep unrelated app logic as it is.
- Keep user-initiated pause/resume calling flowerAdView.adsManager.pause() / resume().

DO NOT:
- Do NOT pause, seek, reload or play the content around a mid-roll. The only exception is
  player.play() in onError after a mid-roll.
- Do NOT delay play() in onPrepare.
- Do NOT switch to FlowerAVPlayer or change the player type.

========================================
VERIFY
========================================

- Pre-roll: ad first, then the content from 0, no content frame before the ad.
- No ad / request failure: the content starts right away.
- Mid-roll: the ad starts exactly at the mid-roll position (no extra countdown), the content
  resumes about 5 seconds before where it stopped.
- Post-roll: plays once after the content ends.
- Ad playback error: the content starts (pre-roll), resumes and does not stay paused (mid-roll),
  or is not resumed (post-roll).
- No double playback: the content audio is never heard under an ad.

========================================
OUTPUT
========================================

- Modify the code I paste below and show the final version of each changed function.
- List every file you changed and every pattern from step 1 you removed.
- Do not add code for other cases.

My code:
```
