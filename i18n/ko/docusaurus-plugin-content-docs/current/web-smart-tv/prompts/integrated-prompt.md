---
sidebar_position: 5
---

# 통합 프롬프트 (전체 단계)

이 프롬프트는 HTML5/Web용 Flower SDK 연동 전체를 하나의 프롬프트로 다룹니다. Step 1–4의 전체 내용이 포함되어 있습니다.

**사용 전:** 모든 `{{...}}` 플레이스홀더를 교체하세요.

```plain
We are integrating the FLOWER SDK into our HTML5/Web project. Generate complete integration code for the following configuration:

AD_TYPE: {{AD_TYPE}} (linear-tv | vod | interstitial)
APPROACH: {{APPROACH}} (flower-hls | media-player-hook)
Note: For interstitial AD_TYPE, no APPROACH selection is needed.
SDK_VERSION: {{SDK_VERSION}}
PLAYER_TYPE: {{PLAYER_TYPE}} (hls.js | bitmovin | dash.js | none)

################################################################
STEP 1 — PROJECT SETUP & SDK INITIALIZATION
################################################################

========================================
STEP 1-1 — Load the SDK
========================================

The Flower SDK must be loaded BEFORE any other library files.

Single HTML File:

<html>
  <head>
    <!-- Flower SDK — must be loaded first -->
    <script src="https://sdk.anypoint.tv/html5/flower-sdk-{{SDK_VERSION}}.js"></script>
    <!-- Other library files (hls.js, dash.js, Bitmovin, etc.) -->
    <script src="https://cdn.jsdelivr.net/npm/hls.js"></script>
  </head>
  ...
</html>

React (if SDK is loaded via script tag in public/index.html):

// Access via window global
window.FlowerSdk.setEnv('local');
window.FlowerSdk.init();

========================================
STEP 1-2 — Initialize SDK
========================================

Environment modes:
- "local": Local environment, default log level Verbose
- "dev": Development environment, error logs saved to server, default log level Info
- "prod": Production environment, error logs saved to server, default log level Warn

Single HTML:

<script type="text/javascript">
    FlowerSdk.setEnv("local");  // Change to "dev" or "prod" as appropriate
    FlowerSdk.init();
    FlowerSdk.setLogLevel("Verbose");  // Optional: Verbose, Debug, Info, Warn, Error, Off
</script>

React:

window.FlowerSdk.setEnv('local');
window.FlowerSdk.init();
window.FlowerSdk.setLogLevel('Verbose');

========================================
STEP 1-3 — Content Security Policy (if applicable)
========================================

If your website enforces CSP via HTTP headers or <meta> tag,
you must allow the following domain:

  img-src reds-tr.anypoint.tv;

################################################################
STEP 2 — AD UI DECLARATION & PLAYER CREATION
################################################################

Note: "flower-hls" is the HTML5 equivalent of FlowerPlayer.

========================================
STEP 2-1 — Declare the Ad UI (HTML/CSS)
========================================

If APPROACH is "flower-hls":
    FlowerHls manages its own video element internally.
    Only need a container div.

    <div id="video-container" style="position: relative; width: 1920px; height: 1080px;">
    </div>

If APPROACH is "media-player-hook":
    Two layers: video element + ad container overlay.
    The ad container is absolutely positioned over the video and hidden by default.

    <div id="video-container" style="position: relative; width: 1920px; height: 1080px;">
        <video id="video-element" controls
            style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%; height: 100%;">
        </video>
        <div id="ad-container"
            style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: none;">
        </div>
    </div>

If AD_TYPE is "interstitial":
    Only the ad container is needed. No video element.

    <div id="ad-container" style="width: 100%; height: 100%;"></div>

========================================
STEP 2-2 — Create FlowerAdView Instance
========================================

If APPROACH is "flower-hls":
    FlowerHls manages ads internally. No separate FlowerAdView needed.
    (Ad listener is registered via hls.addAdListener())

If APPROACH is "media-player-hook" or AD_TYPE is "interstitial":
    const flowerAdView = new FlowerAdView(document.getElementById('ad-container'));

React:
    const adContainerRef = useRef(null);
    const flowerAdViewRef = useRef(null);
    useEffect(() => {
        if (!adContainerRef.current) return;
        flowerAdViewRef.current = new window.FlowerAdView(adContainerRef.current);
    }, []);

========================================
STEP 2-3 — Create Video Player
========================================

If APPROACH is "flower-hls":
    const hls = new FlowerHls({
        backBufferLength: 30,
        liveSyncDurationCount: 1,
    });
    hls.attachContainer(document.getElementById('video-container'));

If APPROACH is "media-player-hook":
    Choose one of the supported players:

    HLS.js:
    const player = new Hls();
    const videoElement = document.getElementById('video-element');
    player.attachMedia(videoElement);

    Bitmovin:
    const player = new bitmovin.player.Player(
        document.getElementById('video-container'),
        { key: 'YOUR_API_KEY' }
    );

    Dash.js:
    const player = dashjs.MediaPlayer().create();
    player.initialize(videoElement, null, false);

If AD_TYPE is "interstitial":
    No player creation needed.

################################################################
STEP 3 — AD INTEGRATION
################################################################

========================================
STEP 3-1 — Implement Listener
========================================

IMPORTANT: Declare the listener variable at module/function scope using `let` (not `const`),
initialized to `null`, because it is needed later for cleanup (removeListener).
Similarly, declare flowerAdView as `let` at module scope and create it inside the play function.

--------------------------------------------------
If AD_TYPE is "linear-tv":

For FlowerHls:
  let adsManagerListener = {
      onPrepare(adDurationMs) {},
      onPlay() {},
      onCompleted() {},
      onError(error) { console.error(error); },
      onAdBreakSkipped(reason) {},
      onAdBreakPrepare(adInfos) {}
  };
  hls.addAdListener(adsManagerListener);

For MediaPlayerHook:
  let adsManagerListener = {
      onPrepare(adDurationMs) {},
      onPlay() {},
      onCompleted() {},
      onError(error) {
          flowerAdView.adsManager.removeListener(adsManagerListener);
          flowerAdView.adsManager.stop();
          player.destroy();
          playLinearTv();  // restart
      },
      onAdBreakSkipped(reason) {},
      onAdBreakPrepare(adInfos) {}
  };
  flowerAdView.adsManager.addListener(adsManagerListener);

--------------------------------------------------
If AD_TYPE is "vod" (media-player-hook only):
⚠ Do NOT use changeChannelUrl() for VOD — it is for linear-tv only. Use requestVodAd() instead.

  let isContentEnd = false;

  let adsManagerListener = {
      onPrepare(adDurationMs) {
          if (!videoElement.paused) {
              setTimeout(() => { flowerAdView.adsManager.play(); }, 5000);
          } else {
              flowerAdView.adsManager.play();
          }
      },
      onPlay() {
          videoElement.pause();
      },
      onCompleted() {
          if (!isContentEnd) { videoElement.play(); }
      },
      onError(error) {
          if (!isContentEnd) { videoElement.play(); }
      },
      onAdBreakSkipped(reason) {},
      onAdBreakPrepare(adInfos) {}
  };
  flowerAdView.adsManager.addListener(adsManagerListener);

  Detect content end:
  videoElement.addEventListener('ended', () => {
      isContentEnd = true;
      flowerAdView.adsManager.notifyContentEnded();
  });

--------------------------------------------------
If AD_TYPE is "interstitial":

  let adsManagerListener = {
      onPrepare(adDurationMs) {
          flowerAdView.adsManager.play();
      },
      onPlay() {},
      onCompleted() {
          flowerAdView.adsManager.removeListener(adsManagerListener);
          flowerAdView.adsManager.stop();
      },
      onError(error) {
          flowerAdView.adsManager.removeListener(adsManagerListener);
          flowerAdView.adsManager.stop();
      },
      onAdBreakSkipped(reason) {},
      onAdBreakPrepare(adInfos) {}
  };
  flowerAdView.adsManager.addListener(adsManagerListener);

========================================
STEP 3-2 — Request Ads / Start Playback
========================================

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "flower-hls":
⚠ Do NOT use changeChannelUrl() here — it is for media-player-hook only.

  Use values from your config data — do NOT hardcode URLs or parameters.

  hls.setAdConfig({
      adTagUrl: config.adTagUrl,
      prerollAdTagUrl: config.prerollAdTagUrl,   // Optional
      channelId: config.channelId,
      extraParams: config.extraParams || {}
  });
  hls.loadSource(config.contentUrl);

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "media-player-hook":
⚠ Do NOT use setAdConfig() here — it is for flower-hls only.

  Use values from your config data — do NOT hardcode URLs or parameters.

  const mediaPlayerHook = { getPlayer() { return player; } };

  const changedUrl = flowerAdView.adsManager.changeChannelUrl(
      config.contentUrl,                                       // Required
      config.adTagUrl,                                         // Required
      config.channelId,                                        // Required
      new Map(Object.entries(config.extraParams || {})),        // Required (Map)
      mediaPlayerHook,                                         // Required
      new Map(),                                               // adTagHeaders (Optional)
      new Map(),                                               // channelStreamHeaders (Optional)
      config.prerollAdTagUrl                                   // Optional
  );

  // HLS.js:
  player.loadSource(changedUrl);
  player.once(Hls.Events.MANIFEST_PARSED, () => { videoElement.play(); });

  // Bitmovin:
  player.load({ hls: changedUrl }).then(() => { player.play(); });

--------------------------------------------------
If AD_TYPE is "vod" AND APPROACH is "media-player-hook":

  Use values from your config data — do NOT hardcode URLs or parameters.

  const mediaPlayerHook = { getPlayer() { return player; } };

  flowerAdView.adsManager.requestVodAd(
      config.adTagUrl,                                         // Required
      config.contentId,                                        // Required
      config.contentDuration,                                  // Required (ms)
      new Map(Object.entries(config.extraParams || {})),        // Required (Map)
      mediaPlayerHook                                          // Required
  );

  // HLS.js:
  player.loadSource(config.contentUrl);
  player.once(Hls.Events.MANIFEST_PARSED, () => { videoElement.play(); });

--------------------------------------------------
If AD_TYPE is "interstitial":

  Use values from your config data — do NOT hardcode URLs or parameters.

  flowerAdView.adsManager.requestAd(
      config.adTagUrl,                                         // Required
      new Map(Object.entries(config.extraParams || {})),        // Optional
      new Map()                                                // adTagHeaders (Optional)
  );

========================================
MEDIA PLAYER ADAPTER (Advanced — Linear TV only)
========================================

For unsupported players, use enterChannel() with MediaPlayerAdapter.
Use values from your config data — do NOT hardcode URLs or parameters.

  flowerAdView.adsManager.enterChannel(
      config.adTagUrl,                                         // Required
      config.channelId,                                        // Required
      new Map(Object.entries(config.extraParams || {})),        // Required (Map)
      mediaPlayerHook,                                         // Required
      new Map(),                                               // adTagHeaders (Optional)
      mediaPlayerAdapter                                       // Required
  );

MediaPlayerAdapter must implement:
  getCurrentMedia() -> Media (urlOrId, duration, position)
  getVolume() -> number
  isPlaying() -> boolean
  getHeight() -> number
  pause(), stop(), resume()
  enqueuePlayItem(playItem), removePlayItem(playItem), playNextItem()
  seekToPosition(absoluteStartTimeMs, relativeStartTimeMs, offsetMs, windowDurationMs, periodIndex)
  getCurrentAbsoluteTime(isPrintDetails) -> number | null
  getPlayerType() -> string | null
  getPlayerVersion() -> string | null

################################################################
STEP 4 — CLEANUP & RELEASE
################################################################

========================================
STEP 4-1 — Cleanup Function
========================================

IMPORTANT: For proper cleanup to work:
1. Declare flowerAdView and adsManagerListener at module scope using `let`, initialized to `null`.
2. Create FlowerAdView INSIDE the play function so it can be recreated on each playback.
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
STEP 4-2 — Page Unload (Optional)
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
STEP 4-3 — VOD Playback State Control (media-player-hook only)
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

################################################################
OUTPUT REQUIREMENTS
################################################################

- Generate a complete, working integration based on the parameters above.
- Include all necessary HTML, CSS, and JavaScript code.
- Use the exact API calls shown for the selected APPROACH and AD_TYPE.
- Generate ONLY the code for the selected parameters. Do NOT include code from other branches.
- Include error handling in all listener callbacks.
- Include cleanup logic that runs on page unload or component unmount.

################################################################
CONSTRAINTS
################################################################

Step 1 — Project Setup:
- HTML5 SDK does NOT require an explicit release/destroy call.
- The SDK script must be loaded before any player library scripts.
- In React, access SDK via window.FlowerSdk (not import).
- Supported browsers/platforms:
  - Chrome >= 87, Firefox >= 78, Edge >= 88, Safari >= 13
  - webOS TV >= 23, Tizen OS TV >= 7.0

Step 2 — Ad UI & Player:
- FlowerHls is a wrapper around HLS.js with integrated ad support.
- For media-player-hook, the ad container must have "display: none" initially.
- Supported players for media-player-hook: HLS.js, Video.js, Bitmovin Player, Dash.js.
- FlowerAdView constructor requires a DOM element reference.

Step 3 — Ad Integration:
- FlowerHls uses hls.setAdConfig() + hls.loadSource() — NOT changeChannelUrl().
- FlowerHls uses hls.addAdListener() — NOT flowerAdView.adsManager.addListener().
- For media-player-hook, extraParams and headers must be Map objects (not plain objects).
- HTML5 MediaPlayerAdapter uses enterChannel() API (not changeChannelUrl overload).
- VOD is not available with FlowerHls approach.

Step 4 — Cleanup:
- Always remove listener BEFORE calling stop().
- FlowerHls uses hls.removeAdListener() and hls.destroy().
- Media-player-hook uses flowerAdView.adsManager.removeListener() and flowerAdView.adsManager.stop().
- HTML5 SDK does NOT require FlowerSdk.destroy() — no explicit SDK release needed.
- Always destroy the player instance to prevent memory leaks.
```
