---
sidebar_position: 1
sidebar_label: PIP Mode Support
---

# PIP Mode Support

Use this prompt when an app that already shows Flower ads supports Picture-in-Picture. It applies to every Unicast case (Linear TV / FAST, VOD, inline ads, Flower Player or your own player) in the default ad mode. The LLM reports PIP transitions to the SDK, keeps the app from entering PIP while an ad is playing, and adds the API-level checks. Background: [PIP Mode Support](../../../getting-started/pip-mode-support.md), [VOD PIP Mode Support](../../../ad-insertion/vod/pip-mode-support.md). To keep VOD ads playing in PIP instead, use [VOD Ads in PIP Mode](../vod/ads-in-pip-mode.md).

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
Report every PIP enter/exit to the SDK, never enter PIP while an ad is playing, and guard the
PIP APIs by API level. Requires Flower Android SDK 2.8.0 or later.

========================================
PARAMETERS
========================================
PIP_TRIGGER: {{PIP_TRIGGER}}   (user-leave-hint | auto-enter | button)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- The SDK does not detect PIP by itself. FlowerSdk.notifyPictureInPictureModeChanged(true/false)
  tells it. Exception: with Bitmovin Player the SDK also listens for Bitmovin's
  PictureInPictureEnter / PictureInPictureExit events, so PIP entered through the Bitmovin
  player's own PIP handling is reported automatically. When the app calls
  Activity.enterPictureInPictureMode() itself, the app must still notify the SDK.
- Default ad mode (FlowerSdk.setIgnoreAdBreakInPIPMode(true)):
  - An ad playing in the SDK's ad player (VOD ads, inline ads, a linear-channel pre-roll) is
    paused and its UI hidden when the app reports PIP, and resumes when the app reports the exit.
    While paused, its progress and quartile tracking do not advance.
  - VOD mid-roll and post-roll breaks are not requested while in PIP.
  - Linear TV ads inside the stream keep playing in PIP; only the ad UI is hidden.
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

3) Enter PIP
   PIP_TRIGGER = user-leave-hint:
     override fun onUserLeaveHint() {
         super.onUserLeaveHint()
         if (isAdPlaying) return
         if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
             enterPictureInPictureMode(PictureInPictureParams.Builder().build())
         }
     }
   PIP_TRIGGER = button: same checks before enterPictureInPictureMode(); disable or hide the
     button while isAdPlaying.
   PIP_TRIGGER = auto-enter (API 31+): turn auto-enter OFF while an ad plays:
     private fun updatePipParams() {
         if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
             setPictureInPictureParams(
                 PictureInPictureParams.Builder().setAutoEnterEnabled(!isAdPlaying).build()
             )
         }
     }
     Below API 31 fall back to the user-leave-hint behavior.

4) Report transitions
     override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
         super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
         playerView.useController = !isInPictureInPictureMode      // optional UI
         FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode)
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
- Notify both enter (true) and exit (false), with every integration approach.
- Check Build.VERSION.SDK_INT before PIP API calls.
DO NOT
- Do not enter PIP (or leave auto-enter enabled) while an ad is playing.
- Do not rely on the SDK to detect PIP (except Bitmovin's own PIP handling).
- Do not call FlowerSdk.setIgnoreAdBreakInPIPMode(false) in this prompt — that changes how VOD
  ads are played (see the VOD Ads in PIP Mode prompt).

========================================
VERIFY
========================================
- Leave the app during content: PIP starts; returning restores full screen.
- Leave the app during an ad: PIP does not start (or auto-enter is off).
- If PIP starts during an ad anyway (e.g., system-triggered): the ad pauses and its UI hides;
  after returning, the ad resumes from where it stopped and the content resumes after the break.
- VOD: no mid-roll / post-roll starts while in PIP.
- Devices below API 26: no crash; PIP is simply not offered.

========================================
OUTPUT
========================================
- Changed Activity code and manifest entries, with a short list of the changes.
```
