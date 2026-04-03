---
sidebar_position: 3
---

# Step 3: 광고 연동

이 프롬프트는 LLM이 HTML5/Web용 광고 리스너와 광고 요청을 구현하도록 안내합니다.

**사용 전:** `{{AD_TYPE}}`과 `{{APPROACH}}`를 입력하세요.

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

For FlowerHls:
  let adsManagerListener = {
      onPrepare(adDurationMs) {},
      onPlay() {},
      onCompleted() {},
      onError(error) { console.error(error); },
      onAdSkipped(reason) {},
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
      onAdSkipped(reason) {},
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
      onAdSkipped(reason) {},
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
      onAdSkipped(reason) {},
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

========================================
CONSTRAINTS
========================================

- FlowerHls uses hls.setAdConfig() + hls.loadSource() — NOT changeChannelUrl().
- FlowerHls uses hls.addAdListener() — NOT flowerAdView.adsManager.addListener().
- For media-player-hook, extraParams and headers must be Map objects (not plain objects).
- HTML5 MediaPlayerAdapter uses enterChannel() API (not changeChannelUrl overload).
- VOD is not available with FlowerHls approach.
```
