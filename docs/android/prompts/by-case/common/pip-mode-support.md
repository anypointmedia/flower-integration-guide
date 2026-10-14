---
sidebar_position: 1
sidebar_label: PIP Mode Support
---

# PIP Mode Support

Use this prompt when an app that already shows Flower ads supports Picture-in-Picture. It applies to every Unicast case (Linear TV / FAST, VOD, inline ads, Flower Player or your own player) in the default ad mode. The LLM reports the user leaving and returning to the app to the SDK, whether or not the app enters PIP, keeps the app from entering PIP while an ad is playing, and adds the API-level checks. Background: [PIP Mode Support](../../../getting-started/pip-mode-support.md), [VOD PIP Mode Support](../../../ad-insertion/vod/pip-mode-support.md). To keep VOD ads playing in PIP instead, use [VOD Ads in PIP Mode](../vod/ads-in-pip-mode.md).

The prompt generates Kotlin code.

| Parameter | Values | Description |
|-----------|--------|-------------|
| `PIP_TRIGGER` | `user-leave-hint` \| `auto-enter` \| `button` | How the app enters PIP: from `onUserLeaveHint()`, with `setAutoEnterEnabled(true)` (API 31+), or from a UI button |

```plain
Our Android app shows FLOWER SDK ads and supports Picture-in-Picture (PIP).
Make PIP handling correct for the SDK. Modify the code I provide. Generate Kotlin.

========================================
GOAL
========================================
Report to the SDK every time the user leaves the app and comes back (whether or not the app
enters PIP), never enter PIP while an ad is playing, and guard the PIP APIs by API level. Requires Flower Android SDK 2.8.0 or later.

========================================
PARAMETERS
========================================
PIP_TRIGGER: {{PIP_TRIGGER}}   (user-leave-hint | auto-enter | button)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- The SDK does not detect by itself that the user left the app. FlowerSdk.notifyUserLeftApp(true)
  tells it the user left (home screen, another app, or the app's video moved to a PIP window);
  FlowerSdk.notifyUserLeftApp(false) tells it the user came back. Report leaving whether or not
  the app enters PIP: the app must not enter PIP while an ad is playing, so a report sent only on
  PIP changes would never reach the SDK during an ad.
  The SDK detects neither by itself, with any player (Bitmovin included).
- FlowerSdk.notifyPictureInPictureModeChanged() is deprecated and replaced by
  notifyUserLeftApp(). Existing calls keep working; use notifyUserLeftApp() in this integration.
- Default ad mode (FlowerSdk.setIgnoreAdBreakInPIPMode(true)):
  - An ad playing in the SDK's ad player (VOD ads, inline ads, a linear-channel pre-roll) is
    paused and its UI hidden when the app reports that the user left, and resumes and plays to
    completion when the app reports that the user came back. While paused, its progress and
    quartile tracking do not advance.
  - VOD mid-roll and post-roll breaks are not requested while the user is away.
  - Linear TV ads inside the stream keep playing while the user is away; only the ad UI is hidden.
- On Android the whole Activity goes into PIP, so the content player cannot be kept out of the
  PIP window. Entering PIP during an ad would let the user bypass it.
- API levels: enterPictureInPictureMode(PictureInPictureParams) and PictureInPictureParams need
  API 26 (Android 8.0); PictureInPictureParams.Builder.setAutoEnterEnabled() needs API 31
  (Android 12). The Flower SDK supports lower API levels.

========================================
IMPLEMENTATION
========================================
1) Manifest — on the playback Activity:
     android:supportsPictureInPicture="true"
     android:configChanges="screenSize|smallestScreenSize|screenLayout|orientation"

2) Track whether an ad is playing, in the FlowerAdsManagerListener the app already registers
   (flowerAdView.adsManager.addListener, or player.addAdListener for Flower Players):
     private var isAdPlaying = false
     override fun onPlay()                       { isAdPlaying = true;  updatePipParams() }
     override fun onCompleted()                  { isAdPlaying = false; updatePipParams() }
     override fun onError(error: FlowerError?)   { isAdPlaying = false; updatePipParams() }
   Keep the listener's existing logic; only add these lines. updatePipParams() is only needed
   for PIP_TRIGGER = auto-enter; run it on the Main thread.

3) Report the user leaving, then enter PIP
   PIP_TRIGGER = user-leave-hint:
     override fun onUserLeaveHint() {
         super.onUserLeaveHint()
         FlowerSdk.notifyUserLeftApp(true)   // always, before deciding on PIP
         if (isAdPlaying) return
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

4) Report the user coming back
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
   android.os.Build, tv.anypoint.flower.android.sdk.api.FlowerSdk.

5) While in PIP and an ad is paused, do not resume the content player from the PIP window
   (e.g., hide/disable PIP play actions while isAdPlaying). The SDK resumes the content after
   the break.

========================================
RULES
========================================
DO
- Notify both leaving (notifyUserLeftApp(true)) and returning (notifyUserLeftApp(false)), with
  every integration approach, whether or not the app enters PIP.
- Check Build.VERSION.SDK_INT before PIP API calls.
DO NOT
- Do not enter PIP (or leave auto-enter enabled) while an ad is playing.
- Do not report only PIP changes: during an ad the app does not enter PIP, so the SDK would never
  learn that the user left.
- Do not use the deprecated FlowerSdk.notifyPictureInPictureModeChanged().
- Do not rely on the SDK to detect the user leaving, or Bitmovin's own PIP events to report it.
- Do not call FlowerSdk.setIgnoreAdBreakInPIPMode(false) in this prompt — that changes how VOD
  ads are played (see the VOD Ads in PIP Mode prompt).

========================================
VERIFY
========================================
- Leave the app during content: PIP starts; returning restores full screen.
- Leave the app during an ad: PIP does not start (or auto-enter is off), and the ad pauses and its
  UI hides; after returning, the ad resumes from where it stopped and the content resumes after
  the break.
- If PIP starts during an ad anyway (e.g., system-triggered): the ad pauses in the same way.
- VOD: no mid-roll / post-roll starts while the user is away (in PIP or in another app).
- Devices below API 26: no crash; PIP is simply not offered.

========================================
OUTPUT
========================================
- Changed Activity code and manifest entries, with a short list of the changes.
```
