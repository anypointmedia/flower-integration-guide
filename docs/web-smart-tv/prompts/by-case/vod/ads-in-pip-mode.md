---
sidebar_position: 2
sidebar_label: VOD Ads in the App's Player
---

# VOD Ads Played in the App's Player (Ads in PIP Mode)

Use this prompt when VOD ads must keep playing while the app is in PIP mode, by having the SDK play them inside your own HLS.js or Bitmovin player (`FlowerSdk.setIgnoreAdBreakInPIPMode(false)`). The prompt makes the LLM switch the mode and make every player event handler ignore the ad sources. See [PIP Mode Support](../../../getting-started/pip-mode-support.md) and [VOD Ad Implementation](../../../ad-insertion/vod/vod-ad-implementation.md).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `SDK_VERSION` | e.g. `2.3.18` | Flower SDK version provided to your project |
| `PLAYER` | `hls.js` \| `bitmovin` | The player library your app uses for VOD |

```plain
We are adding FLOWER SDK VOD ads to our HTML5/Web VOD player, and the ads must keep
playing in PIP mode. The SDK must play the ads inside our own player.
Modify the code I paste after this prompt.

========================================
GOAL
========================================

- Call FlowerSdk.setIgnoreAdBreakInPIPMode(false) so the SDK plays VOD ads in our player.
- Request VOD ads, start the content after the pre-roll, play every break on onPrepare.
- Make all player event handlers (ended, manifest/source loaded, analytics, quality or
  subtitle UI) react only to the content source, never to an ad source.
- Notify the SDK when the user leaves the app (another tab or app, the TV app in the
  background, or the video in PIP) and comes back.

========================================
PARAMETERS
========================================

SDK_VERSION: {{SDK_VERSION}}
PLAYER: {{PLAYER}}   (hls.js | bitmovin)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

1. setIgnoreAdBreakInPIPMode(false) must be called before requestVodAd(): the ad player
   is chosen when ads are requested. The default is true.
2. In this mode only HLS.js (including FlowerHls) and Bitmovin Player play ads inside the
   app's player. dash.js and Shaka Player still use the SDK's own video element; for them
   use the default-mode VOD prompt instead.
3. When an ad break starts (on adsManager.play()), the SDK switches the player's source to
   the ad(s). When the last ad ends, the SDK loads the
   content source again, seeks to the interrupted position minus rewindDuration (default
   5000 ms; 0 for a pre-roll or post-roll) and plays it. Ads play at normal speed; the
   content's playback rate is restored afterwards.
4. Because the source changes around every break, the content <video> fires 'ended' when
   each ad ends, and hls.js fires MANIFEST_PARSED (and other load events) for every source.
5. Pre-roll: if the content has not been loaded yet, there is nothing to return to; the
   app loads the content on the first onCompleted()/onError(), exactly as in default mode.
   The SDK calls onCompleted() also when there is no pre-roll, no ad, or a request failure.
6. The player is shared with the ads: pausing it pauses the ad. adsManager.pause()/resume()
   pause and resume this same player.
7. Mid-rolls and the post-roll are requested and played in PIP mode too. While the user is
   away from the app (reported with FlowerSdk.notifyUserLeftApp(true), including PIP), the
   ad UI (CTA, skip) is hidden; the ad itself keeps playing.
8. If the VMAP has no post-roll, no listener callback follows notifyContentEnded().
   After a post-roll the SDK hands the content back at its end, so the content's 'ended'
   handler can run again; it must notify the content end only once.
9. Supported player check happens at requestVodAd(); getPlayer() must return the player.
10. When a mid-roll ad fails, the content is normally already playing again (from the
    interrupted position minus rewindDuration); resuming is a harmless safety net. The app
    still calls play() in onError(): play() only, no seek or reload.
    onCompleted() may follow onError(). After a post-roll error the content stays ended.

========================================
IMPLEMENTATION
========================================

STEP 1 — Load, initialize, choose the mode (once, before any ad request)

  <script src="https://sdk.anypoint.tv/html5/flower-sdk-{{SDK_VERSION}}.js"></script>
  FlowerSdk.setEnv('local');   // 'local' | 'dev' | 'prod'
  FlowerSdk.init();
  FlowerSdk.setIgnoreAdBreakInPIPMode(false);

STEP 2 — Ad UI, player, state

  Keep a FlowerAdView container over the player (absolute, display: none); the SDK still
  draws the ad UI (CTA, skip button) there.
      flowerAdView = new FlowerAdView(document.getElementById('ad-container'));
  hls.js:   player = new Hls(); player.attachMedia(videoElement);
  bitmovin: player = new bitmovin.player.Player(containerElement, playerConfig);

  let contentUrl = null;
  let isContentPrepared = false;
  let isContentEnd = false;

STEP 3 — "Is the content the current source?"

  hls.js:   function isContentSource() { return player.url === contentUrl; }
  bitmovin: function isContentSource() { return player.getSource()?.hls === contentUrl; }
            (use the same key - hls or dash - that the app loads the content with)

STEP 4 — Content loading, once

  function prepareContentSource() {
      // hls.js: use once(), MANIFEST_PARSED also fires for every ad source
      player.once(Hls.Events.MANIFEST_PARSED, () => { videoElement.play(); });
      player.loadSource(contentUrl);
      // bitmovin:
      // player.load({ hls: contentUrl }).then(() => player.play());
  }

STEP 5 — Listener

  adsManagerListener = {
      onPrepare(adDurationMs) { flowerAdView.adsManager.play(); },  // never delay
      onPlay() { /* UI only. Do NOT pause the player: it is playing the ad. */ },
      onCompleted() {
          if (!isContentPrepared) { isContentPrepared = true; prepareContentSource(); }
          else if (isContentEnd) { /* post-roll done: playback finished */ }
          // after a mid-roll the SDK has already switched back to the content
      },
      onError(error) {
          if (!isContentPrepared) { isContentPrepared = true; prepareContentSource(); }  // pre-roll error
          else if (!isContentEnd) { videoElement.play(); }  // mid-roll error: play() only (bitmovin: player.play())
          // post-roll error (isContentEnd): playback is over - nothing to resume
      },
      onAdBreakSkipped(reason) {}
  };

STEP 6 — Player event handlers: filter by source

  hls.js:
      videoElement.addEventListener('ended', () => {
          if (!isContentSource()) return;          // an ad ended, not the content
          if (isContentEnd) return;                // notify only once
          isContentEnd = true;
          flowerAdView.adsManager.notifyContentEnded();
      });
  bitmovin:
      player.on(bitmovin.player.PlayerEvent.PlaybackFinished, () => {
          if (!isContentSource()) return;
          if (isContentEnd) return;
          isContentEnd = true;
          flowerAdView.adsManager.notifyContentEnded();
      });

  Apply the same isContentSource() guard to EVERY existing handler that reacts to a
  source load or end: progress saving / resume points, analytics "start"/"complete",
  audio/subtitle/quality menus, "next episode" overlays, error retry logic.

STEP 7 — Request ads

  function playVod(config) {
      stopPlayback();
      contentUrl = config.contentUrl;
      isContentPrepared = false;
      isContentEnd = false;
      flowerAdView.adsManager.addListener(adsManagerListener);
      flowerAdView.adsManager.requestVodAd(
          config.adTagUrl, config.contentId, config.contentDurationMs,
          { serviceId: config.serviceId, os: 'Web', adId: config.adId, ...config.extraParams },
          { getPlayer() { return player; } },
          config.adTagHeaders || null
      );
      // Do NOT load the content here.
  }

STEP 8 — Report the user leaving the app and coming back (ads may play in PIP; do not
         block PIP during ads)

  function reportUserLeftApp() {
      const hasLeftApp = document.visibilityState === 'hidden'
          || document.pictureInPictureElement === videoElement;
      FlowerSdk.notifyUserLeftApp(hasLeftApp);
  }
  document.addEventListener('visibilitychange', reportUserLeftApp);
  videoElement.addEventListener('enterpictureinpicture', reportUserLeftApp);
  videoElement.addEventListener('leavepictureinpicture', reportUserLeftApp);
  (Bitmovin: attach the PIP listeners to player.getVideoElement().)
  FlowerSdk.notifyPictureInPictureModeChanged() is deprecated and replaced by
  notifyUserLeftApp(). Existing calls keep working.

STEP 9 — Cleanup

  function stopPlayback() {
      if (flowerAdView && adsManagerListener) {
          flowerAdView.adsManager.removeListener(adsManagerListener);  // BEFORE stop()
          flowerAdView.adsManager.stop();
      }
  }
  Destroy the player when the VOD screen is closed.

========================================
RULES
========================================

DO:
- Set setIgnoreAdBreakInPIPMode(false) before the first requestVodAd().
- Compare the current source with the content URL in every source/end handler.
- Use hls.once(...) for one-shot load handlers.
- Notify the user leaving the app AND coming back.

DO NOT:
- Pause, seek, or reload the player in onPrepare(), onPlay(), onCompleted(), onError().
  The only player call in these callbacks is the guarded play() in onError() after a
  mid-roll (isContentPrepared && !isContentEnd).
- Treat the first 'ended' / PlaybackFinished as the end of the content.
- Call notifyContentEnded() more than once.
- Save a resume position, send analytics, or rebuild track menus while an ad is the source.
- Disable PIP on the video during ads (that is the default-mode rule, not this one).
- Load the content right after requestVodAd().

========================================
VERIFY
========================================

- Pre-roll: the ad plays in our player; the content starts after it, from 0.
- No ad / ad server unreachable: the content starts.
- Mid-roll: the ad plays in our player; the content comes back about 5 s before the
  interruption point, at the previous playback speed; no "content ended" is logged.
- Post-roll: plays once after the content ends; notifyContentEnded() is called once.
- Ad error: pre-roll -> the content starts once; mid-roll -> the content comes back about
  5 s before the interruption point and plays; post-roll -> the content stays ended.
- PIP: enter PIP during a mid-roll; the ad keeps playing in the PIP window and the content
  follows it. Exit PIP; the ad UI is shown again.
- Analytics / resume points / track menus are not triggered by ad sources.

========================================
OUTPUT
========================================

- Modify the code I paste; keep only the {{PLAYER}} branch.
- List every changed file and every event handler you guarded with isContentSource().
- Do not add code for linear TV, interstitial ads, dash.js/Shaka, or the default mode.
```
