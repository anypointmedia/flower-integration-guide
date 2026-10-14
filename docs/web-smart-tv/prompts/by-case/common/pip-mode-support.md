---
sidebar_position: 1
sidebar_label: PIP Mode Support
---

# PIP Mode Support

Use this prompt when your web app can put the video into Picture-in-Picture (PIP) and already has a Flower ad integration (VOD, linear TV or inline ads) with the default ad mode. The prompt makes the LLM report PIP transitions to the SDK and keep the content video out of PIP while an ad plays. If your app never enters PIP, you do not need it. To keep ads playing in PIP instead, use [VOD Ads Played in the App's Player](../vod/ads-in-pip-mode.md). See [PIP Mode Support](../../../getting-started/pip-mode-support.md).

```plain
Our HTML5/Web app already shows FLOWER SDK ads and lets the user put the video into
Picture-in-Picture. Add PIP support for the Flower SDK with the default ad mode.
Modify the code I paste after this prompt.

========================================
GOAL
========================================

- Report every PIP enter and exit to the SDK.
- Prevent the content video from entering PIP while an ad is playing.
- Keep the existing ad integration unchanged otherwise.

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

1. The SDK does not detect PIP by itself. The app calls
   FlowerSdk.notifyPictureInPictureModeChanged(true) on entering PIP and
   FlowerSdk.notifyPictureInPictureModeChanged(false) on leaving it.
2. Default mode (FlowerSdk.setIgnoreAdBreakInPIPMode(true), no call needed): VOD ads and
   inline ads play in the SDK's own video element, not in the content video. In PIP:
   - an ad that is playing is paused and its UI hidden; its progress and quartile
     tracking stop. On PIP exit it resumes where it stopped and plays to the end.
   - VOD mid-roll and post-roll ad breaks are not requested. A post-roll skipped this
     way produces no listener callback after notifyContentEnded().
3. Linear TV ads inside the stream are not affected: they keep playing in PIP and only
   the ad UI is hidden. A linear channel pre-roll (prerollAdTagUrl) is paused and resumed
   like a VOD ad.
4. The app decides which video goes into PIP. On the web that is the <video> element the
   app calls requestPictureInPicture() on, i.e. the content video. Putting it into PIP
   during an ad would let the user bypass the ad.

========================================
IMPLEMENTATION
========================================

STEP 1 — Find the content video element

  Plain <video> / hls.js / dash.js / Shaka: the app's <video> element.
  FlowerHls: hls.media.
  Bitmovin: player.getVideoElement().

STEP 2 — Report PIP transitions

  videoElement.addEventListener('enterpictureinpicture', () => {
      FlowerSdk.notifyPictureInPictureModeChanged(true);
  });
  videoElement.addEventListener('leavepictureinpicture', () => {
      FlowerSdk.notifyPictureInPictureModeChanged(false);
  });

  Register these once per video element. If the app enters PIP through another API
  (for example a TV platform API or a custom mini-player), call the same two functions
  from that code path, on both enter and exit.

STEP 3 — Block PIP on the content video while an ad plays

  Add to the EXISTING FlowerAdsManagerListener (do not create a second flow):
      onPlay()       { videoElement.disablePictureInPicture = true;  ...existing code }
      onCompleted()  { videoElement.disablePictureInPicture = false; ...existing code }
      onError(error) { videoElement.disablePictureInPicture = false; ...existing code }

  If the app has its own PIP button, also hide or disable it between onPlay() and
  onCompleted()/onError(), and never call videoElement.requestPictureInPicture() then.

STEP 4 — If the app is already in PIP when an ad starts

  Nothing extra: the SDK pauses that ad and resumes it when the app reports the PIP exit.

========================================
RULES
========================================

DO:
- Report both enter and exit, every time.
- Re-enable PIP in both onCompleted() and onError().
- Keep the existing listener logic (isContentPrepared, notifyContentEnded, etc.) as is.

DO NOT:
- Pause, resume, seek, or reload the content or the ad because of PIP; the SDK handles it.
- Call flowerAdView.adsManager.pause()/resume() on PIP transitions.
- Call requestPictureInPicture() on the content video while an ad plays.
- Call FlowerSdk.setIgnoreAdBreakInPIPMode(false) here (that is the ads-in-PIP case).

========================================
VERIFY
========================================

- Content playing, enter PIP: the content continues in PIP; leave PIP: it continues inline.
- During a VOD pre-roll or mid-roll: the PIP button is disabled / PIP request is refused.
- Ad playing, app goes into PIP through another path: the ad pauses; leave PIP: the ad
  resumes from the same point and completes.
- In PIP when a mid-roll position or the content end is reached: no ad is requested.
- Linear TV in PIP: stream ads keep playing.

========================================
OUTPUT
========================================

- Modify the code I paste.
- List every changed file and the listener callbacks you extended.
- Do not add new ad requests or change the ad mode.
```
