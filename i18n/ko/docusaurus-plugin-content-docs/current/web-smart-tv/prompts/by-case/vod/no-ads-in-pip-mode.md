---
sidebar_position: 3
sidebar_label: 광고 없는 VOD PIP 모드(기본)
---

# VOD — 광고 없는 PIP 모드(기본)

기본 광고 모드(`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`, 광고는 SDK 자체 video 요소에서 재생)로 VOD 광고를 이미 표시하고 있고, 본편 video를 PIP(Picture-in-Picture)로 전환할 수 있는 웹 앱에서 이 프롬프트를 사용하세요. 기본적으로 PIP 모드에서는 광고가 표시되지 않으므로, 그대로 두면 사용자가 PIP를 이용해 광고를 우회할 수 있습니다. LLM이 사용자가 앱을 떠날 때(다른 탭이나 앱으로 전환, 홈 화면으로 이동, TV 앱이 백그라운드로 이동) `FlowerSdk.notifyUserLeftApp(true)`를, 다시 돌아올 때 `FlowerSdk.notifyUserLeftApp(false)`를 SDK에 알리고, 광고 재생 중에는 본편 video가 PIP로 전환되지 않도록 수정하게 합니다. PIP가 없는 Smart TV 플랫폼에서는 앱을 떠나고 돌아오는 것을 알리는 부분만 적용됩니다. PIP 모드에서도 광고가 계속 재생되게 하려면 [앱의 플레이어 안에서 재생되는 VOD 광고](./ads-in-pip-mode.md)를 사용하세요. [PIP 모드 지원](../../../getting-started/pip-mode-support.md) 페이지를 참고하세요.

:::danger 광고 재생 중일 때
리스너의 `onPlay()`부터 `onCompleted()` 또는 `onError()`를 받기 전까지는, 사용자가 앱을 떠나더라도(수동이든 자동이든) 본편 플레이어를 PIP 모드로 **전환하면 안 됩니다**. 사용자가 앱으로 돌아오면 앱은 **반드시** `FlowerSdk.notifyUserLeftApp(false)`를 호출해야 합니다. 그래야만 일시정지된 광고가 재개됩니다. 이 호출이 없으면 광고는 일시정지된 상태로 남습니다.
:::

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `PLAYER` | `hls.js` \| `bitmovin` \| `dash.js` \| `shaka` | 앱에서 VOD 재생에 사용하는 플레이어 라이브러리 |

```plain
Our HTML5/Web (or Smart TV web app) VOD player already shows FLOWER SDK VOD ads with the
default ad mode, and the content video can go into PIP. Ads are not shown in PIP mode, so
make sure PIP cannot be used to bypass an ad. Modify the code I paste after this prompt.

========================================
GOAL
========================================

- Call FlowerSdk.notifyUserLeftApp(true) every time the user leaves the app (another tab
  or app, the home screen, the TV app in the background, or the content video in PIP)
  and FlowerSdk.notifyUserLeftApp(false) every time the user comes back.
- Never let the content video enter PIP while an ad is playing.
- Keep the existing VOD ad integration unchanged otherwise.

========================================
PARAMETERS
========================================

PLAYER: {{PLAYER}}   (hls.js | bitmovin | dash.js | shaka)

========================================
IMPORTANT — WHILE AN AD IS PLAYING
========================================

An ad is playing from the listener's onPlay() until onCompleted() or onError().
During that window:
- Do NOT switch the content video into PIP when the user leaves the app: no manual PIP
  (PIP button, requestPictureInPicture()) and no automatic PIP. The ad would be bypassed.
- The user leaving the app is still reported with FlowerSdk.notifyUserLeftApp(true).
  The SDK pauses the ad and hides the ad UI.
- When the user comes back, the app MUST call FlowerSdk.notifyUserLeftApp(false). Only
  then does the paused ad resume from where it stopped. Without this call the ad stays
  paused.

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

1. Default mode (FlowerSdk.setIgnoreAdBreakInPIPMode(true), no call needed): VOD ads play
   in the SDK's own video element over the content, not in the content video. Ads are
   not shown in PIP mode.
2. The SDK does not detect the user leaving or coming back by itself. The app calls
   FlowerSdk.notifyUserLeftApp(true) when the user leaves and
   FlowerSdk.notifyUserLeftApp(false) when the user comes back.
   FlowerSdk.notifyPictureInPictureModeChanged() is deprecated and replaced by
   notifyUserLeftApp(). Existing calls keep working.
3. While the user is away:
   - an ad that is playing is paused and its UI hidden; its progress stops. After
     notifyUserLeftApp(false) it resumes where it stopped and plays to the end; then
     onCompleted() is called and the content continues as usual.
   - mid-roll and post-roll ad breaks are not requested. A post-roll skipped this way
     produces no listener callback after notifyContentEnded().
4. The app decides which video goes into PIP: on the web, the <video> element the app
   calls requestPictureInPicture() on, i.e. the content video. Because it stays out of
   PIP during an ad, PIP does not start when the user leaves then; that is why the app
   reports the user leaving the app, not PIP enter/exit.
5. When no ad is playing, the content video may enter PIP as usual; the user is reported
   as away while it is in the PIP window.
6. On the web the page becomes hidden ('visibilitychange') when the user switches to
   another tab or app, goes to the home screen, or the TV app goes to the background.
   Many Smart TV platforms have no PIP; there only the visibility reporting applies.

========================================
IMPLEMENTATION
========================================

STEP 1 — Find the content video element

  hls.js / dash.js / shaka: the app's <video> element.
  bitmovin: player.getVideoElement().

STEP 2 — Track whether an ad is playing and block PIP during it

  let isAdPlaying = false;

  Add to the EXISTING FlowerAdsManagerListener (do not create a second flow):
      onPlay() {
          isAdPlaying = true;
          videoElement.disablePictureInPicture = true;
          ...existing code
      },
      onCompleted() {
          isAdPlaying = false;
          videoElement.disablePictureInPicture = false;
          ...existing code
      },
      onError(error) {
          isAdPlaying = false;
          videoElement.disablePictureInPicture = false;
          ...existing code
      },

  disablePictureInPicture also blocks automatic PIP (for example the autopictureinpicture
  attribute). If the app has its own PIP button, hide or disable it while isAdPlaying and
  never call videoElement.requestPictureInPicture() then. If the app enters PIP through
  another API (a TV platform API, the player's UI, a custom mini-player), check
  isAdPlaying there too.

STEP 3 — Report the user leaving the app and coming back

  function reportUserLeftApp() {
      const hasLeftApp = document.visibilityState === 'hidden'
          || document.pictureInPictureElement === videoElement;
      FlowerSdk.notifyUserLeftApp(hasLeftApp);
  }
  document.addEventListener('visibilitychange', reportUserLeftApp);
  videoElement.addEventListener('enterpictureinpicture', reportUserLeftApp);
  videoElement.addEventListener('leavepictureinpicture', reportUserLeftApp);

  Register these once (the PIP listeners once per video element). If the TV platform
  reports going to the background or coming back through its own event, call
  FlowerSdk.notifyUserLeftApp(true) / (false) from that code path too. Every
  notifyUserLeftApp(true) must be followed by notifyUserLeftApp(false) when the user
  comes back.

STEP 4 — Nothing else

  Do not pause, resume, seek, or reload the ad or the content because the user left or
  came back. The SDK pauses the ad on notifyUserLeftApp(true) and resumes it on
  notifyUserLeftApp(false).

========================================
RULES
========================================

DO:
- Set isAdPlaying = true in onPlay() and false in both onCompleted() and onError().
- Keep the content video out of PIP (manual and automatic) while isAdPlaying.
- Re-enable PIP in both onCompleted() and onError().
- Call notifyUserLeftApp(true) when the user leaves, whether or not PIP starts.
- Call notifyUserLeftApp(false) when the user comes back; this is what resumes a paused
  ad.
- Keep the existing listener logic (isContentPrepared, notifyContentEnded, etc.) as is.

DO NOT:
- Switch the content video into PIP between onPlay() and onCompleted()/onError().
- Report only PIP enter/exit; the user leaving during an ad does not start PIP.
- Forget notifyUserLeftApp(false) on return; the ad would stay paused.
- Call flowerAdView.adsManager.pause()/resume() or play()/pause() on the content when
  the user leaves or comes back.
- Add new calls to the deprecated FlowerSdk.notifyPictureInPictureModeChanged().
- Call FlowerSdk.setIgnoreAdBreakInPIPMode(false) (that is the ads-in-PIP case).

========================================
VERIFY
========================================

- Content playing, user goes home / switches app (with automatic PIP) or presses the PIP
  button: the content continues in PIP; notifyUserLeftApp(true) is logged.
- Leave PIP / come back: notifyUserLeftApp(false) is logged; the content continues inline.
- Pre-roll or mid-roll playing: the PIP button is disabled and PIP requests are refused.
- Ad playing, user goes home / switches tab or app: no PIP window opens;
  notifyUserLeftApp(true) is logged; the ad pauses.
- User comes back: notifyUserLeftApp(false) is logged; the ad resumes from where it
  stopped and completes; the content then continues (pre-roll: starts).
- After the ad break ends (onCompleted or onError), PIP is available again.
- User away (another tab or the content in PIP) when a mid-roll position or the content
  end is reached: no ad is requested.
- Smart TV: the app goes to the background during an ad and comes back: the ad pauses
  and resumes.

========================================
OUTPUT
========================================

- Modify the code I paste; keep only the {{PLAYER}} branch.
- List every changed file and the listener callbacks you extended.
- Do not add new ad requests or change the ad mode.
```
