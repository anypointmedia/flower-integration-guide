---
sidebar_position: 3
sidebar_label: VOD PIP Without Ads (Default)
---

# VOD — PIP Without Ads (Default)

Use this prompt when your web app already shows VOD ads with the default ad mode (`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`, ads play in the SDK's own video element) and lets the content video go into Picture-in-Picture (PIP). Ads are not shown in PIP mode by default, so the user could otherwise bypass an ad through PIP. The prompt makes the LLM report the user leaving the app with `FlowerSdk.notifyUserLeftApp(true)` (another tab or app, the home screen, or the TV app in the background) and coming back with `FlowerSdk.notifyUserLeftApp(false)`, and keep the content video out of PIP while an ad plays. On Smart TV platforms without PIP, only the leave and return reporting applies. To keep ads playing in PIP instead, use [VOD Ads Played in the App's Player](./ads-in-pip-mode.md). See [PIP Mode Support](../../../getting-started/pip-mode-support.md).

:::danger While an ad is playing
From the listener's `onPlay()` until `onCompleted()` or `onError()`, the app must **not** switch the content player into PIP when the user leaves the app (manually or automatically). When the user comes back, the app **must** call `FlowerSdk.notifyUserLeftApp(false)`. Only then does the paused ad resume. Without this call the ad stays paused.
:::

| Parameter | Values | Description |
|-----------|--------|-------------|
| `PLAYER` | `hls.js` \| `bitmovin` \| `dash.js` \| `shaka` | The player library your app uses for VOD |

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
