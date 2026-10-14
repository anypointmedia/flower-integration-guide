---
sidebar_position: 1
sidebar_label: PIP 모드 지원
---

# PIP 모드 지원

기본 광고 모드로 Flower 광고 연동(VOD, Linear TV, 인라인 광고)이 이미 되어 있는 웹 앱에서 이 프롬프트를 사용하세요. LLM이 사용자가 앱을 떠날 때(다른 탭이나 앱으로 전환, TV 앱이 백그라운드로 이동, 영상이 PIP 창으로 이동)와 다시 돌아올 때 이를 SDK에 알리고, 앱에서 동영상을 PIP(Picture-in-Picture)로 전환할 수 있다면 광고 재생 중에는 본편 video가 PIP로 전환되지 않도록 수정하게 합니다. 사용자가 앱을 떠난 것은 PIP 시작 여부와 관계없이 알립니다. 광고 재생 중에는 본편 video가 PIP로 전환되지 않으므로 그때는 PIP가 시작되지 않기 때문입니다. PIP 모드에서도 광고가 계속 재생되게 하려면 [앱의 플레이어 안에서 재생되는 VOD 광고](../vod/ads-in-pip-mode.md)를 사용하세요. [PIP 모드 지원](../../../getting-started/pip-mode-support.md) 페이지를 참고하세요.

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
   FlowerSdk.notifyPictureInPictureModeChanged() is deprecated; do not use it.
2. Default mode (FlowerSdk.setIgnoreAdBreakInPIPMode(true), no call needed): VOD ads and
   inline ads play in the SDK's own video element, not in the content video. While the
   user is away:
   - an ad that is playing is paused and its UI hidden; its progress and quartile
     tracking stop. When the user comes back it resumes where it stopped and plays to
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
- Call the deprecated FlowerSdk.notifyPictureInPictureModeChanged().
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
