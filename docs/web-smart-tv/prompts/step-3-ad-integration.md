---
sidebar_position: 3
---

# Step 3: Ad Integration

This prompt guides LLM to implement ad listener and ad request for HTML5/Web.

**Before using:** Fill in `{{AD_TYPE}}` and `{{APPROACH}}`.

```plain
We are integrating the FLOWER SDK into our HTML5/Web project.
This step implements ad event listening and ad request/playback logic.

AD_TYPE: {{AD_TYPE}} (linear-tv | vod | interstitial)
APPROACH: {{APPROACH}} (flower-hls | media-player-hook)
Note: For interstitial AD_TYPE, no APPROACH selection is needed.

========================================
PART 1 — Implement Listener
========================================

IMPORTANT: Declare the listener variable at module/function scope (using `let`, not `const`),
because it is needed later for cleanup in stopPlayback (removeListener).

--------------------------------------------------
If AD_TYPE is "linear-tv":

On onError(), stop the ads manager, release the player, and restart the channel as it was
first started, but with playLinearTv({ withPreroll: false }) (see PART 2). A restart leaves
the channel pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it.
Remove the listener first: stop() ends any ad break in progress and
can still call onCompleted() for it afterwards. Keep onCompleted() UI-only (never start or
reload playback there). Optionally count restarts and give up after a few attempts.

For FlowerHls:
  let adsManagerListener = {
      onPrepare(adDurationMs) {},
      onPlay() {},
      onCompleted() {},
      onError(error) {
          console.error(error);
          stopPlayback();  // hls.removeAdListener() -> hls.destroy() (also calls the ads manager's stop()) - Step 4
          playLinearTv({ withPreroll: false });  // restart, no pre-roll: new FlowerHls -> attachContainer -> setAdConfig -> addAdListener -> loadSource
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
          stopPlayback();  // removeListener() -> adsManager.stop() -> player.destroy() - Step 4
          playLinearTv({ withPreroll: false });  // restart, no pre-roll: new FlowerAdView and player -> changeChannelUrl() again -> load the returned URL -> play
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
          } else if (!isContentEnd) {
              // Mid-roll error: resume the content. Only play() - do NOT seek or reload.
              // The SDK already rewinds and resumes the content before calling onError(),
              // so this is a safety net.
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
PART 2 — Request Ads / Start Playback
========================================

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "flower-hls":
⚠ Do NOT use changeChannelUrl() here — it is for media-player-hook only.

  Use values from your config data — do NOT hardcode URLs or parameters.

  Put this in playLinearTv({ withPreroll = true } = {}): true for the first start and a channel
  change, false for a restart after onError(). A restart leaves the channel pre-roll out
  (prerollAdTagUrl omitted): the viewer has already seen it.

  hls.setAdConfig({
      adTagUrl: config.adTagUrl,
      prerollAdTagUrl: withPreroll ? config.prerollAdTagUrl : undefined,   // Optional; omitted on a restart
      channelId: config.channelId,
      extraParams: config.extraParams || {}
  });
  hls.loadSource(config.contentUrl);

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "media-player-hook":
⚠ Do NOT use setAdConfig() here — it is for flower-hls only.

  Use values from your config data — do NOT hardcode URLs or parameters.

  Put this in playLinearTv({ withPreroll = true } = {}), as above: a restart after onError()
  passes withPreroll: false and loads the returned URL right away.

  const mediaPlayerHook = { getPlayer() { return player; } };
  const prerollAdTagUrl = (withPreroll && config.prerollAdTagUrl) || null;   // null on a restart

  const changedUrl = flowerAdView.adsManager.changeChannelUrl(
      config.contentUrl,                                       // Required
      config.adTagUrl,                                         // Required
      config.channelId,                                        // Required
      new Map(Object.entries(config.extraParams || {})),        // Required (Map)
      mediaPlayerHook,                                         // Required
      new Map(),                                               // adTagHeaders (Optional)
      new Map(),                                               // channelStreamHeaders (Optional)
      prerollAdTagUrl                                          // Optional; null on a restart
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
      // No pre-roll (none configured, or a restart after onError()): play right away,
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
  stopPlayback() (Step 4) removes it, before stop(), while it is set.

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

  // Do NOT load or play the content here. With the default
  // FlowerSdk.setIgnoreAdBreakInPIPMode(true), the SDK does not pause the content for a
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

========================================
CONSTRAINTS
========================================

- FlowerHls uses hls.setAdConfig() + hls.loadSource() — NOT changeChannelUrl().
- FlowerHls uses hls.addAdListener() — NOT flowerAdView.adsManager.addListener().
- For media-player-hook, extraParams and headers must be Map objects (not plain objects).
- HTML5 MediaPlayerAdapter uses enterChannel() API (not changeChannelUrl overload).
- VOD is not available with FlowerHls approach.
- Linear TV onError(): remove the listener, stop the ads manager (FlowerHls: hls.destroy() does it),
  release the player, then restart the channel as at first start but without prerollAdTagUrl.
  A restart leaves the channel pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it.
- Linear TV media-player-hook with prerollAdTagUrl: load the returned URL only from the temporary
  pre-roll listener's first onCompleted()/onError(); with no pre-roll (or on a restart), right away.
- VOD onError(): pre-roll error -> load the content; mid-roll error -> play() only (no seek/reload);
  post-roll error -> nothing to resume.
```
