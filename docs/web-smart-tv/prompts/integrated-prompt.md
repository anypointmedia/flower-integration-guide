---
sidebar_position: 5
---

# Integrated Prompt (All Steps)

This prompt covers the full Flower SDK integration for HTML5/Web in a single prompt. It contains the complete content from Steps 1–4.

**Before using:** Replace all `{{...}}` placeholders.

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

On onError(), stop the ads manager, release the player, and restart the channel exactly as
it was first started, with playLinearTv() (see STEP 3-2), prerollAdTagUrl included. If the
channel has not changed, the pre-roll is skipped, so the viewer does not see it
again. Remove the listener first: stop() ends any ad break in progress and
can still call onCompleted() for it afterwards. Keep onCompleted() UI-only (never start or
reload playback there). Optionally count restarts and give up after a few attempts.
Restart for every onError(), including a message starting with "playback unrecoverable".

For FlowerHls:
  let adsManagerListener = {
      onPrepare(adDurationMs) {},
      onPlay() {},
      onCompleted() {},
      onError(error) {
          console.error(error);
          stopPlayback();  // hls.removeAdListener() -> hls.destroy() (also calls the ads manager's stop()) - STEP 4-1
          playLinearTv();  // restart as the first start: new FlowerHls -> attachContainer -> setAdConfig -> addAdListener -> loadSource
      },
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
          console.error(error);
          stopPlayback();  // removeListener() -> adsManager.stop() -> player.destroy() - STEP 4-1
          playLinearTv();  // restart as the first start: new FlowerAdView and player -> changeChannelUrl() again -> load the returned URL -> play
      },
      onAdBreakSkipped(reason) {},
      onAdBreakPrepare(adInfos) {}
  };
  flowerAdView.adsManager.addListener(adsManagerListener);

--------------------------------------------------
If AD_TYPE is "vod" (media-player-hook only):
⚠ Do NOT use changeChannelUrl() for VOD — it is for linear-tv only. Use requestVodAd() instead.

  let isContentPrepared = false;  // true once the content has been loaded (after the pre-roll)
  let isContentEnd = false;

  let adsManagerListener = {
      onPrepare(adDurationMs) {
          // Play right away: a mid-roll's onPrepare arrives when the content reaches
          // the mid-roll position. Do NOT delay it.
          flowerAdView.adsManager.play();
      },
      onPlay() {
          // Do NOT pause the player here - the SDK pauses the content for a mid-roll and,
          // after the break, rewinds it by rewindDuration (5s) and resumes it.
      },
      onCompleted() {
          if (!isContentPrepared) {
              // The pre-roll finished, or there was no pre-roll / no ad / the ad request
              // failed (the SDK calls onCompleted in all of these cases).
              // Load and start the content now - only this first time.
              isContentPrepared = true;
              prepareContentSource();
          } else if (isContentEnd) {
              // The post-roll finished: VOD playback is fully done.
          }
          // After a mid-roll the SDK resumes the content by itself.
          // Do NOT call play(), seek or reload the content here.
      },
      onError(error) {
          // onCompleted() may follow onError() for the same break - the flags keep the
          // content from loading twice.
          if (!isContentPrepared) {
              // Pre-roll error: load and start the content.
              isContentPrepared = true;
              prepareContentSource();
          } else if (error?.message?.startsWith('playback unrecoverable')) {
              // The content stopped and the SDK cannot recover it:
              // reload the content or show an error. No safety-net play() here.
          } else if (!isContentEnd) {
              // Mid-roll error: resume the content. Only play() - do NOT seek or reload.
              // The content is normally already playing again; resuming is a harmless
              // safety net.
              videoElement.play();  // Bitmovin: player.play()
          }
          // Post-roll error (isContentEnd): playback is over - nothing to resume.
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

  Put this in playLinearTv(): used for the first start, a channel change, and a restart after
  onError(). A restart passes the same values, prerollAdTagUrl included: if the channel has
  not changed, the pre-roll is skipped (also after stop()/destroy()).

  hls.setAdConfig({
      adTagUrl: config.adTagUrl,
      prerollAdTagUrl: config.prerollAdTagUrl,   // Optional; kept on a restart
      channelId: config.channelId,
      extraParams: config.extraParams || {}
  });
  hls.loadSource(config.contentUrl);

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "media-player-hook":
⚠ Do NOT use setAdConfig() here — it is for flower-hls only.

  Use values from your config data — do NOT hardcode URLs or parameters.

  Put this in playLinearTv(), as above: a restart after onError() passes the same arguments,
  prerollAdTagUrl included, and holds the stream the same way. If the channel has not
  changed, the pre-roll is skipped and the SDK calls onCompleted() right after changeChannelUrl() returns.

  const mediaPlayerHook = { getPlayer() { return player; } };
  const prerollAdTagUrl = config.prerollAdTagUrl || null;   // kept on a restart

  const changedUrl = flowerAdView.adsManager.changeChannelUrl(
      config.contentUrl,                                       // Required
      config.adTagUrl,                                         // Required
      config.channelId,                                        // Required
      new Map(Object.entries(config.extraParams || {})),        // Required (Map)
      mediaPlayerHook,                                         // Required
      new Map(),                                               // adTagHeaders (Optional)
      new Map(),                                               // channelStreamHeaders (Optional)
      prerollAdTagUrl                                          // Optional; kept on a restart
  );

  // Loads and plays the URL returned by changeChannelUrl().
  function loadChannel(url) {
      // HLS.js:
      player.loadSource(url);
      player.once(Hls.Events.MANIFEST_PARSED, () => { videoElement.play(); });

      // Bitmovin:
      // player.load({ hls: url }).then(() => { player.play(); });
  }

  if (prerollAdTagUrl == null) {
      // No pre-roll configured: play right away,
      // with adsManagerListener kept registered.
      loadChannel(changedUrl);
  } else {
      // Pre-roll: do NOT load the stream yet. The SDK plays the pre-roll in its own video
      // element, pauses the player meanwhile, and calls onCompleted() when it ends - also
      // when there is no pre-roll ad or it fails. Hold the stream until then with a
      // temporary listener (module scope: let prerollListener = null;).
      flowerAdView.adsManager.removeListener(adsManagerListener);
      let started = false;   // onCompleted() can arrive more than once
      const startAfterPreroll = () => {
          if (started) return;
          started = true;
          flowerAdView.adsManager.removeListener(prerollListener);
          prerollListener = null;
          flowerAdView.adsManager.addListener(adsManagerListener);
          loadChannel(changedUrl);
      };
      prerollListener = {
          onPrepare(adDurationMs) {},
          onPlay() {},
          onCompleted() { startAfterPreroll(); },
          onError(error) { startAfterPreroll(); },   // only start the stream; no stop() here
          onAdBreakSkipped(reason) {},
          onAdBreakPrepare(adInfos) {}
      };
      flowerAdView.adsManager.addListener(prerollListener);
  }

  A channel change or stop() ends a pending pre-roll without calling prerollListener, so
  stopPlayback() (STEP 4-1) removes it, before stop(), while it is set.

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

  // Do NOT load or play the content here. The SDK does not pause the content for a
  // pre-roll, so content loaded here plays (with audio) under the pre-roll.
  // The content is loaded in onCompleted()/onError() through prepareContentSource().

  // Called once, from the first onCompleted() or onError().
  function prepareContentSource() {
      // HLS.js:
      player.loadSource(config.contentUrl);
      player.once(Hls.Events.MANIFEST_PARSED, () => { videoElement.play(); });

      // Bitmovin:
      // player.load({ hls: config.contentUrl }).then(() => { player.play(); });
  }

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
      // linear-tv with a pre-roll: remove a pending prerollListener first (STEP 3-2)
      if (flowerAdView && prerollListener) {
          flowerAdView.adsManager.removeListener(prerollListener);
          prerollListener = null;
      }
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
- Supported players for media-player-hook: HLS.js, Bitmovin Player, dash.js, Shaka Player.
  Video.js is not supported.
- FlowerAdView constructor requires a DOM element reference.

Step 3 — Ad Integration:
- FlowerHls uses hls.setAdConfig() + hls.loadSource() — NOT changeChannelUrl().
- FlowerHls uses hls.addAdListener() — NOT flowerAdView.adsManager.addListener().
- For media-player-hook, extraParams and headers must be Map objects (not plain objects).
- HTML5 MediaPlayerAdapter uses enterChannel() API (not changeChannelUrl overload).
- VOD is not available with FlowerHls approach.
- Linear TV onError(): remove the listener, stop the ads manager (FlowerHls: hls.destroy() does it),
  release the player, then restart the channel exactly as at first start, prerollAdTagUrl included.
  If the channel has not changed, the pre-roll is skipped, so the viewer does not see it again.
- Linear TV media-player-hook with prerollAdTagUrl: load the returned URL only from the temporary
  pre-roll listener's first onCompleted()/onError(), on a restart too; with no pre-roll, right away.
- VOD onError(): pre-roll error -> load the content; message starting with "playback unrecoverable"
  -> reload the content or show an error (no play()); mid-roll error -> play() only (no seek/reload);
  post-roll error -> nothing to resume.

Step 4 — Cleanup:
- Always remove listener BEFORE calling stop().
- FlowerHls uses hls.removeAdListener() and hls.destroy().
- Media-player-hook uses flowerAdView.adsManager.removeListener() and flowerAdView.adsManager.stop().
- HTML5 SDK does NOT require FlowerSdk.destroy() — no explicit SDK release needed.
- Always destroy the player instance to prevent memory leaks.
```
