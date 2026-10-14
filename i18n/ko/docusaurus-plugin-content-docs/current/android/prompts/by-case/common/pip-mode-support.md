---
sidebar_position: 1
sidebar_label: PIP 모드 지원
---

# PIP 모드 지원

이미 Flower 광고를 표시하는 앱이 PIP(Picture-in-Picture)를 지원하는 경우 이 프롬프트를 사용하세요. 기본 광고 모드에서 모든 Unicast 케이스(Linear TV / FAST, VOD, 인라인 광고, Flower Player 또는 앱의 플레이어)에 적용됩니다. LLM이 PIP 진입 여부와 관계없이 사용자가 앱을 떠나고 돌아오는 것을 SDK에 알리고, 광고 재생 중에는 PIP에 진입하지 않도록 하고, API 레벨 확인을 추가합니다. 배경 설명: [PIP 모드 지원](../../../getting-started/pip-mode-support.md), [VOD PIP 모드 지원](../../../ad-insertion/vod/pip-mode-support.md). PIP 모드에서도 VOD 광고가 계속 재생되도록 하려면 [PIP 모드에서의 VOD 광고](../vod/ads-in-pip-mode.md)를 사용하세요.

이 프롬프트는 Kotlin 코드를 생성합니다.

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `PIP_TRIGGER` | `user-leave-hint` \| `auto-enter` \| `button` | 앱이 PIP에 진입하는 방식: `onUserLeaveHint()`에서 진입, `setAutoEnterEnabled(true)` 사용(API 31 이상), 또는 UI 버튼 |

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
- FlowerSdk.notifyPictureInPictureModeChanged() is deprecated and only passes its value to
  notifyUserLeftApp(). Replace existing calls with notifyUserLeftApp().
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
