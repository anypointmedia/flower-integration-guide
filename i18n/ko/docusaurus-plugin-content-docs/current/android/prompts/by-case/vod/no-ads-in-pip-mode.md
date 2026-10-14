---
sidebar_position: 3
sidebar_label: 광고 없는 VOD PIP 모드(기본)
---

# VOD — 광고 없는 PIP 모드(기본)

VOD 앱이 기본 광고 모드(`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`)에서 PIP(Picture-in-Picture)를 지원하는 경우 이 프롬프트를 사용하세요. 기본 광고 모드에서는 PIP 모드에서 광고가 표시되지 않습니다. PIP 모드를 통해 광고를 건너뛰지 못하도록, 앱은 사용자가 홈 화면으로 갈 때 `FlowerSdk.notifyUserLeftApp(true)`로, 앱에 다시 돌아올 때 `FlowerSdk.notifyUserLeftApp(false)`로 SDK에 알려야 합니다. LLM이 이 알림을 추가하고, 광고 재생 여부를 추적하고, 광고 재생 중에는 PIP 진입을 막습니다. 배경 설명: [PIP 모드 지원](../../../getting-started/pip-mode-support.md), [VOD PIP 모드 지원](../../../ad-insertion/vod/pip-mode-support.md). PIP 모드에서도 광고가 계속 재생되도록 하려면 [PIP 모드에서의 VOD 광고](./ads-in-pip-mode.md)를 사용하세요.

:::danger 광고 재생 중에는 PIP에 진입하지 마세요
광고가 재생되는 동안, 즉 리스너에서 `onPlay()`를 받은 뒤 `onCompleted()` 또는 `onError()`를 받기 전까지는 사용자가 홈 화면으로 가더라도 본편 플레이어를 PIP 모드로 **전환하면 안 됩니다**. 사용자가 앱에 다시 돌아오면 앱은 **반드시** `FlowerSdk.notifyUserLeftApp(false)`를 호출해야 합니다. 그래야만 일시정지된 광고가 재개(resume)되며, 호출하지 않으면 광고는 일시정지된 상태로 남습니다.
:::

이 프롬프트는 Kotlin 코드를 생성하며, [앱의 플레이어로 VOD 광고](./media-player-hook.md) 또는 [Flower Player로 VOD 광고](./flower-player.md)의 VOD 연동(또는 제공한 코드)을 전제로 합니다.

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `SDK_VERSION` | 예: `2.9.29` | 프로젝트에 제공된 Flower SDK 버전 |
| `PIP_TRIGGER` | `user-leave-hint` \| `auto-enter` \| `button` | 앱이 PIP에 진입하는 방식: `onUserLeaveHint()`에서 진입, `setAutoEnterEnabled(true)` 사용(API 31 이상), 또는 UI 버튼 |

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
