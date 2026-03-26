---
sidebar_position: 4
---

# Step 4: Cleanup & Release

This prompt guides LLM to implement proper resource cleanup for HTML5/Web.

**Before using:** Fill in `{{AD_TYPE}}` and `{{APPROACH}}`.

```plain
We are integrating the FLOWER SDK into our HTML5/Web project.
This step implements proper cleanup when stopping playback or leaving the page.

AD_TYPE: {{AD_TYPE}}
(linear-tv | vod | interstitial)

APPROACH: {{APPROACH}}
(flower-hls | media-player-hook)
Note: For interstitial AD_TYPE, no APPROACH selection is needed.

========================================
PART 1 — Cleanup Function
========================================

IMPORTANT: For proper cleanup to work:
1. Declare flowerAdView and adsManagerListener at module scope using `let` (not `const`),
   initialized to `null`.
2. Create FlowerAdView INSIDE the play function (not at module scope) so it can be
   recreated on each playback.
3. Call stopPlayback() at the START of the play function to clean up any previous session.
4. At the end of stopPlayback(), set flowerAdView and adsManagerListener to null.

If APPROACH is "flower-hls":

  function stopPlayback() {
      if (hls) {
          hls.removeAdListener(adsManagerListener);
          hls.destroy();
          hls = null;
      }
  }

If APPROACH is "media-player-hook":

  function stopPlayback() {
      if (flowerAdView && adsManagerListener) {
          flowerAdView.adsManager.removeListener(adsManagerListener);
          flowerAdView.adsManager.stop();
      }

      // Destroy player (depends on player type)
      // HLS.js:
      if (player) { player.destroy(); player = null; }
      // Bitmovin:
      if (player) { player.destroy(); player = null; }
      // Dash.js:
      if (player) { player.destroy(); player = null; }

      // Clear video element
      const video = document.getElementById('video-element');
      if (video) {
          video.pause();
          video.removeAttribute('src');
          video.load();
      }

      flowerAdView = null;
      adsManagerListener = null;
  }

If AD_TYPE is "interstitial":

  function stopAd() {
      if (flowerAdView && adsManagerListener) {
          flowerAdView.adsManager.removeListener(adsManagerListener);
          flowerAdView.adsManager.stop();
      }
      flowerAdView = null;
      adsManagerListener = null;
  }

========================================
PART 2 — Page Unload (Optional)
========================================

Clean up on page navigation:

If AD_TYPE is "linear-tv" or "vod":

  window.addEventListener('beforeunload', () => {
      stopPlayback();
  });

  React useEffect cleanup:
  useEffect(() => {
      return () => { stopPlayback(); };
  }, []);

If AD_TYPE is "interstitial":

  window.addEventListener('beforeunload', () => {
      stopAd();
  });

  React useEffect cleanup:
  useEffect(() => {
      return () => { stopAd(); };
  }, []);

========================================
PART 3 — VOD Playback State Control (media-player-hook only)
========================================

Notify SDK about user-initiated pause/resume:

  // User pauses content
  function onUserPause() {
      videoElement.pause();
      flowerAdView.adsManager.pause();
  }

  // User resumes content
  function onUserResume() {
      videoElement.play();
      flowerAdView.adsManager.resume();
  }

  // Exit VOD
  function onVodExit() {
      flowerAdView.adsManager.stop();
  }

========================================
CONSTRAINTS
========================================

- Always remove listener BEFORE calling stop().
- FlowerHls uses hls.removeAdListener() and hls.destroy().
- Media-player-hook uses flowerAdView.adsManager.removeListener() and flowerAdView.adsManager.stop().
- HTML5 SDK does NOT require FlowerSdk.destroy() — no explicit SDK release needed.
- Always destroy the player instance to prevent memory leaks.
```
