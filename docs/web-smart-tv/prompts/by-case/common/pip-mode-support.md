---
sidebar_position: 1
sidebar_label: PIP Mode Support
---

# PIP Mode Support

Use this prompt when your web app already has a Flower ad integration (VOD, linear TV or inline ads) with the default ad mode. The prompt makes the LLM report to the SDK when the user leaves the app (another tab or app, the TV app in the background, or the video in a PIP window) and comes back, and, if the app can put the video into Picture-in-Picture (PIP), keep the content video out of PIP while an ad plays. The app reports the user leaving whether or not PIP starts: while an ad plays, the content video is kept out of PIP, so PIP never starts then. To keep ads playing in PIP instead, use [VOD Ads Played in the App's Player](../vod/ads-in-pip-mode.md). See [PIP Mode Support](../../../getting-started/pip-mode-support.md).

```plain
Our HTML5/Web app already shows FLOWER SDK ads. Report to the Flower SDK when the user
leaves the app and comes back, and add PIP support with the default ad mode.
Modify the code I paste after this prompt.

========================================
GOAL
========================================

- Report every time the user leaves the app and comes back to the SDK, whether or not
  the video goes into PIP.
- Prevent the content video from entering PIP while an ad is playing.
- Keep the existing ad integration unchanged otherwise.

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

1. The SDK does not detect this by itself. The app calls
   FlowerSdk.notifyUserLeftApp(true) when the user leaves the app (switches to another
   tab or app, the TV app goes to the background, or the video moves to a PIP window) and
   FlowerSdk.notifyUserLeftApp(false) when the user comes back.
   FlowerSdk.notifyPictureInPictureModeChanged() is deprecated and replaced by
   notifyUserLeftApp(). Existing calls keep working.
2. Default mode (FlowerSdk.setIgnoreAdBreakInPIPMode(true), no call needed): VOD ads and
   inline ads play in the SDK's own video element, not in the content video. While the
   user is away:
   - an ad that is playing is paused and its UI hidden; its progress stops.
     When the user comes back it resumes where it stopped and plays to
     the end.
   - VOD mid-roll and post-roll ad breaks are not requested. A post-roll skipped this
     way produces no listener callback after notifyContentEnded().
3. Linear TV ads inside the stream are not affected: they keep playing while the user is
   away and only the ad UI is hidden. A linear channel pre-roll (prerollAdTagUrl) is
   paused and resumed like a VOD ad.
4. The app decides which video goes into PIP. On the web that is the <video> element the
   app calls requestPictureInPicture() on, i.e. the content video. Putting it into PIP
   during an ad would let the user bypass the ad. Because the content video stays out of
   PIP during an ad, PIP does not start when the user leaves then; that is why the app
   reports the user leaving the app, not PIP enter/exit.

========================================
IMPLEMENTATION
========================================

STEP 1 — Find the content video element

  Plain <video> / hls.js / dash.js / Shaka: the app's <video> element.
  FlowerHls: hls.media.
  Bitmovin: player.getVideoElement().

STEP 2 — Report the user leaving the app and coming back

  function reportUserLeftApp() {
      const hasLeftApp = document.visibilityState === 'hidden'
          || document.pictureInPictureElement === videoElement;
      FlowerSdk.notifyUserLeftApp(hasLeftApp);
  }
  document.addEventListener('visibilitychange', reportUserLeftApp);
  videoElement.addEventListener('enterpictureinpicture', reportUserLeftApp);
  videoElement.addEventListener('leavepictureinpicture', reportUserLeftApp);

  The page becomes hidden when the user switches to another tab or app, or the TV app
  goes to the background. Register these once (the PIP listeners once per video
  element). If the app enters PIP through another API (for example a TV platform API or
  a custom mini-player), or the TV platform reports going to the background through its
  own event, call FlowerSdk.notifyUserLeftApp(true) / (false) from that code path too,
  on both leaving and coming back.

STEP 3 — Block PIP on the content video while an ad plays

  Add to the EXISTING FlowerAdsManagerListener (do not create a second flow):
      onPlay()       { videoElement.disablePictureInPicture = true;  ...existing code }
      onCompleted()  { videoElement.disablePictureInPicture = false; ...existing code }
      onError(error) { videoElement.disablePictureInPicture = false; ...existing code }

  If the app has its own PIP button, also hide or disable it between onPlay() and
  onCompleted()/onError(), and never call videoElement.requestPictureInPicture() then.
  Skip this step if the app never puts the video into PIP.

STEP 4 — If the user is already away when an ad starts

  Nothing extra: the SDK pauses that ad and resumes it when the app reports that the
  user came back.

========================================
RULES
========================================

DO:
- Report both leaving and coming back, every time, whether or not PIP starts.
- Re-enable PIP in both onCompleted() and onError().
- Keep the existing listener logic (isContentPrepared, notifyContentEnded, etc.) as is.

DO NOT:
- Report only PIP enter/exit; the user leaving during an ad does not start PIP.
- Add new calls to the deprecated FlowerSdk.notifyPictureInPictureModeChanged(); use
  notifyUserLeftApp().
- Pause, resume, seek, or reload the content or the ad because the user left or came
  back; the SDK handles it.
- Call flowerAdView.adsManager.pause()/resume() when the user leaves or comes back.
- Call requestPictureInPicture() on the content video while an ad plays.
- Call FlowerSdk.setIgnoreAdBreakInPIPMode(false) here (that is the ads-in-PIP case).

========================================
VERIFY
========================================

- Content playing, enter PIP: the content continues in PIP; leave PIP: it continues inline.
- During a VOD pre-roll or mid-roll: the PIP button is disabled / PIP request is refused.
- Ad playing, user switches to another tab or app (or the TV app goes to the background):
  the ad pauses; user comes back: the ad resumes from the same point and completes.
- Ad playing, app goes into PIP through another path: the ad pauses; leave PIP: the ad
  resumes from the same point and completes.
- User away (another tab or the content in PIP) when a mid-roll position or the content
  end is reached: no ad is requested.
- Linear TV while the user is away: stream ads keep playing.

========================================
OUTPUT
========================================

- Modify the code I paste.
- List every changed file and the listener callbacks you extended.
- Do not add new ad requests or change the ad mode.
```
