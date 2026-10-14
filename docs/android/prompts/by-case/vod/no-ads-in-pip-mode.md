---
sidebar_position: 3
sidebar_label: VOD PIP Without Ads (Default)
---

# VOD — PIP Without Ads (Default)

Use this prompt when a VOD app supports Picture-in-Picture in the default ad mode (`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`), where ads are not shown in PIP mode. To keep the ad from being bypassed through PIP, the app reports the user leaving the app with `FlowerSdk.notifyUserLeftApp(true)` when the user goes to the home screen, and `FlowerSdk.notifyUserLeftApp(false)` when the user comes back. The LLM adds these reports, tracks whether an ad is playing, and blocks PIP while an ad plays. Background: [PIP Mode Support](../../../getting-started/pip-mode-support.md), [VOD PIP Mode Support](../../../ad-insertion/vod/pip-mode-support.md). To keep ads playing in PIP mode instead, use [VOD Ads in PIP Mode](./ads-in-pip-mode.md).

:::danger While an ad is playing, do not enter PIP
While an ad is playing — from the listener's `onPlay()` until `onCompleted()` or `onError()` — the app must **not** switch the content player into PIP when the user goes to the home screen. When the user comes back to the app, the app **must** call `FlowerSdk.notifyUserLeftApp(false)`: only then does the paused ad resume. Without it, the ad stays paused.
:::

The prompt generates Kotlin code and assumes a VOD integration from [VOD with Your Own Player](./media-player-hook.md) or [VOD with Flower Player](./flower-player.md) (or the code you provide).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `SDK_VERSION` | e.g., `2.9.29` | Flower SDK version provided to your project |
| `PIP_TRIGGER` | `user-leave-hint` \| `auto-enter` \| `button` | How the app enters PIP: from `onUserLeaveHint()`, with `setAutoEnterEnabled(true)` (API 31+), or from a UI button |

```plain
We use the FLOWER SDK (Android) for VOD ads (requestVodAd with MediaPlayerHook, or a Flower Player
with FlowerVodAdConfig) in the default ad mode, and our app supports Picture-in-Picture (PIP).
Ads are NOT shown in PIP mode. Modify the code I provide. Generate Kotlin.

========================================
GOAL
========================================
Keep VOD ads from being bypassed through PIP: report every time the user leaves the app
(FlowerSdk.notifyUserLeftApp(true)) and comes back (FlowerSdk.notifyUserLeftApp(false)), never
switch the content player into PIP while an ad is playing, and guard the PIP APIs by API level.
Keep FlowerSdk.setIgnoreAdBreakInPIPMode(true) (the default). Requires Flower Android SDK 2.9.29
or later (notifyUserLeftApp).

========================================
PARAMETERS
========================================
SDK_VERSION: {{SDK_VERSION}}
PIP_TRIGGER: {{PIP_TRIGGER}}   (user-leave-hint | auto-enter | button)

========================================
IMPORTANT — WHILE AN AD IS PLAYING
========================================
- An ad is playing from the listener's onPlay() until onCompleted() or onError().
  Track it in an isAdPlaying flag set ONLY from these callbacks.
- While isAdPlaying is true, the app must NOT switch the content player into PIP when the user
  goes to the home screen: no enterPictureInPictureMode() from onUserLeaveHint() or a button,
  and auto-enter (setAutoEnterEnabled) must be OFF.
- The app still calls FlowerSdk.notifyUserLeftApp(true) when the user leaves. The SDK then
  pauses the ad and hides its UI.
- When the user comes back to the app, the app MUST call FlowerSdk.notifyUserLeftApp(false).
  Only then does the paused ad resume. Without it, the ad stays paused.

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- Default ad mode (FlowerSdk.setIgnoreAdBreakInPIPMode(true)): the SDK plays every VOD ad in its
  OWN ad player inside FlowerAdView, over the content. Ads are not shown in PIP mode.
- The SDK does not detect by itself that the user left the app, with any player (Bitmovin
  included). FlowerSdk.notifyUserLeftApp(true) tells it the user left (home screen, another app,
  or the app's video moved to a PIP window); FlowerSdk.notifyUserLeftApp(false) tells it the user
  came back. Report leaving whether or not the app enters PIP: during an ad the app does not
  enter PIP, so a report sent only on PIP changes would never reach the SDK.
- An ad playing when the app reports notifyUserLeftApp(true) is paused and its UI hidden; while
  paused, its progress and quartile tracking do not advance. After notifyUserLeftApp(false) it
  resumes from where it stopped and plays to completion; then the SDK resumes the content
  (after a mid-roll) or onCompleted() lets the app start it (after a pre-roll), as usual.
- When no ad is playing, the content player may enter PIP as usual.
- VOD mid-roll and post-roll breaks are not requested while the user is away (in PIP or in
  another app).
- On Android the whole Activity goes into PIP, so the content player cannot be kept out of the
  PIP window. Entering PIP during an ad would let the user bypass it.
- FlowerSdk.notifyPictureInPictureModeChanged() is deprecated and replaced by
  notifyUserLeftApp(). Existing calls keep working; use notifyUserLeftApp() here.
- API levels: enterPictureInPictureMode(PictureInPictureParams) and PictureInPictureParams need
  API 26 (Android 8.0); PictureInPictureParams.Builder.setAutoEnterEnabled() needs API 31
  (Android 12). The Flower SDK supports lower API levels.

========================================
IMPLEMENTATION
========================================
1) Keep the default ad mode. Do not call FlowerSdk.setIgnoreAdBreakInPIPMode(false); remove such a
   call if present (or call FlowerSdk.setIgnoreAdBreakInPIPMode(true) before requesting ads).

2) Manifest — on the playback Activity:
     android:supportsPictureInPicture="true"
     android:configChanges="screenSize|smallestScreenSize|screenLayout|orientation"

3) Track whether an ad is playing, in the FlowerAdsManagerListener the app already registers
   (flowerAdView.adsManager.addListener, or player.addAdListener for Flower Players):
     private var isAdPlaying = false
     override fun onPlay()                       { isAdPlaying = true;  updatePipParams() }
     override fun onCompleted()                  { isAdPlaying = false; updatePipParams() }
     override fun onError(error: FlowerError?)   { isAdPlaying = false; updatePipParams() }
   Keep the listener's existing logic (play() in onPrepare(), starting the content on the first
   onCompleted()/onError(), resuming after a mid-roll error); only add these lines.
   updatePipParams() is only needed for PIP_TRIGGER = auto-enter; run it on the Main thread.

4) User goes to the home screen: report leaving, then enter PIP only if no ad is playing
   PIP_TRIGGER = user-leave-hint:
     override fun onUserLeaveHint() {
         super.onUserLeaveHint()
         FlowerSdk.notifyUserLeftApp(true)   // always, before deciding on PIP
         if (isAdPlaying) return             // ad playing: do NOT enter PIP
         if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
             enterPictureInPictureMode(PictureInPictureParams.Builder().build())
         }
     }
   PIP_TRIGGER = button: call FlowerSdk.notifyUserLeftApp(true) right before
     enterPictureInPictureMode(), with the same checks; disable or hide the button while
     isAdPlaying. Also override onUserLeaveHint() to call FlowerSdk.notifyUserLeftApp(true)
     (home screen / another app), without entering PIP there.
   PIP_TRIGGER = auto-enter (API 31+): override onUserLeaveHint() to call
     FlowerSdk.notifyUserLeftApp(true), and turn auto-enter OFF while an ad plays:
     private fun updatePipParams() {
         if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
             setPictureInPictureParams(
                 PictureInPictureParams.Builder().setAutoEnterEnabled(!isAdPlaying).build()
             )
         }
     }
     Below API 31 fall back to the user-leave-hint behavior.

5) User comes back to the app: report returning (this resumes a paused ad)
     override fun onResume() {
         super.onResume()
         FlowerSdk.notifyUserLeftApp(false)
     }
   The Activity resumes when the user comes back to the app, including when the PIP window is
   expanded back to full screen. Remove any FlowerSdk.notifyPictureInPictureModeChanged() call;
   keep only UI work in onPictureInPictureModeChanged(), e.g.:
     override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
         super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
         playerView.useController = !isInPictureInPictureMode      // optional UI
     }
   Imports: android.app.PictureInPictureParams, android.content.res.Configuration,
   android.os.Build, tv.anypoint.flower.android.sdk.api.FlowerSdk,
   tv.anypoint.flower.sdk.core.api.FlowerError.

6) Do not resume the content player yourself while an ad is paused (e.g., from a PIP play action
   or in onResume()). The SDK resumes the content after the break.

========================================
RULES
========================================
DO
- Call FlowerSdk.notifyUserLeftApp(true) every time the user leaves the app (home screen,
  another app, PIP), whether or not the app enters PIP.
- Call FlowerSdk.notifyUserLeftApp(false) every time the user comes back to the app (onResume()).
  This is what resumes a paused ad.
- Set isAdPlaying only from onPlay() (true) and onCompleted()/onError() (false).
- Check Build.VERSION.SDK_INT before PIP API calls.
DO NOT
- Do not switch the content player into PIP while an ad is playing (from onPlay() until
  onCompleted()/onError()): no enterPictureInPictureMode(), no auto-enter.
- Do not skip notifyUserLeftApp(false) on return: the ad would stay paused.
- Do not report only PIP changes: during an ad the app does not enter PIP, so the SDK would never
  learn that the user left.
- Do not use the deprecated FlowerSdk.notifyPictureInPictureModeChanged().
- Do not call FlowerSdk.setIgnoreAdBreakInPIPMode(false) — that is the VOD Ads in PIP Mode case.
- Do not resume, seek or reload the content while an ad is paused.

========================================
VERIFY
========================================
- Go home during the content: notifyUserLeftApp(true) is sent and PIP starts; no mid-roll or
  post-roll is requested while in PIP.
- Return from PIP to full screen: notifyUserLeftApp(false) is sent; the content keeps playing.
- Go home during a pre-roll or mid-roll: PIP does NOT start (auto-enter is off),
  notifyUserLeftApp(true) is sent, and the ad pauses with its UI hidden.
- Return to the app: notifyUserLeftApp(false) is sent, the ad resumes from where it stopped and
  plays to completion, and then the content starts (pre-roll) or continues (mid-roll).
- Go to another app (no PIP) and come back: same reports as above.
- Devices below API 26: no crash; PIP is simply not offered.

========================================
OUTPUT
========================================
- Changed Activity code and manifest entries, with a short list of the changes.
```
