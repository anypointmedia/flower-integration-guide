---
sidebar_position: 1
sidebar_label: 앱의 플레이어를 이용한 VOD
---

# 앱의 플레이어를 이용한 VOD 광고 (MediaPlayerHook)

앱의 HLS.js, Bitmovin, dash.js, Shaka Player 인스턴스로 재생하는 VOD 콘텐츠에 프리롤, Mid-roll, Post-roll 광고를 기본 광고 모드(광고가 SDK의 별도 video 요소에서 본편 위에 재생됨)로 추가할 때 이 프롬프트를 사용하세요. LLM이 기존 플레이어 코드에 `requestVodAd`, 광고 리스너, 본편 종료 처리를 연결하도록 안내합니다. [VOD 광고 적용](../../../ad-insertion/vod/vod-ad-implementation.md) 페이지를 참고하세요.

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `SDK_VERSION` | 예: `2.3.17` | 프로젝트에 제공된 Flower SDK 버전 |
| `PLAYER` | `hls.js` \| `bitmovin` \| `dash.js` \| `shaka` | 앱에서 VOD 재생에 사용하는 플레이어 라이브러리 |

```plain
We are adding FLOWER SDK VOD ads (pre-roll, mid-roll, post-roll) to our HTML5/Web
(or Smart TV web app) VOD player. Modify the code I paste after this prompt.

========================================
GOAL
========================================

- Request VOD ads with FlowerAdsManager.requestVodAd() when the user opens a VOD title.
- Start the content only after the pre-roll (or when there is no pre-roll).
- Let the SDK handle mid-rolls and the post-roll; the app only plays ads on onPrepare.
- Clean up when the user leaves the VOD screen.

========================================
PARAMETERS
========================================

SDK_VERSION: {{SDK_VERSION}}
PLAYER: {{PLAYER}}   (hls.js | bitmovin | dash.js | shaka)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

Respect every fact below. Do not "fix" the SDK's behavior from the app.

1. By default (FlowerSdk.setIgnoreAdBreakInPIPMode(true)), the SDK plays VOD ads in its
   own <video> element inside the FlowerAdView container, shown over the content.
   The SDK shows and hides the ad container itself.
2. Pre-roll: the SDK does NOT pause the content. Content loaded before the pre-roll ends
   plays, with audio, under the ad. So the content must be loaded only on the first
   onCompleted() or onError().
3. The SDK calls onCompleted() also when there is no pre-roll, the VMAP has no ad breaks,
   no ad is served (onAdBreakSkipped(1) comes first), or the ad request fails or times out.
   The content therefore always starts from the first onCompleted()/onError().
4. onError() is called when an ad fails to play. onCompleted() may follow it, so both
   callbacks must be guarded by the same isContentPrepared flag. On a mid-roll error the
   SDK seeks the content back by rewindDuration and resumes it BEFORE it calls onError();
   the app still calls play() on the content in onError() as a safety net (play() only,
   no seek or reload; it continues from the rewound position). After a post-roll error
   the content stays ended.
5. Mid-roll: the SDK requests it requestTimeout + minPrepareDuration (default 5000 + 5000 ms)
   before its position, and calls onPrepare() when the content reaches the position.
   On onPrepare() the SDK pauses the content. When the break ends (onCompleted/onError),
   the SDK seeks the content back by rewindDuration (default 5000 ms) and resumes it.
   The same mid-roll does not play again after this rewind.
6. Post-roll: requested only after the app calls notifyContentEnded(). The content stays
   ended afterwards. If the VMAP has no post-roll, NO listener callback follows
   notifyContentEnded().
7. Seeking past a mid-roll position does not play the skipped mid-roll. After an ad break,
   further mid-rolls are not requested for (ad duration + 60 seconds).
8. The SDK identifies the player when requestVodAd() is called. Supported: HLS.js,
   Bitmovin Player, dash.js, Shaka Player. With any other player (e.g. Video.js), or when
   getPlayer() returns null, the SDK inserts no ads and calls NO listener callback.
9. requestVodAd(), requestAd() and changeChannelUrl() first stop the previous session of
   the same FlowerAdsManager. stop() can make an in-progress break report onCompleted(),
   so always remove the listener before calling stop().
10. extraParams and adTagHeaders accept a plain object or a Map.
11. On a webOS TV the SDK reads the LGUDID through webOS.service.request (webOSTV.js must
    be loaded); on a Tizen TV it reads the TIFA through webapis.adinfo. Without them the
    SDK falls back to its own device identifier. Supported: webOS TV >= 23, Tizen >= 7.0.

========================================
IMPLEMENTATION
========================================

STEP 1 — Load and initialize the SDK (skip if already done)

  <script src="https://sdk.anypoint.tv/html5/flower-sdk-{{SDK_VERSION}}.js"></script>
  <!-- load the player library AFTER the Flower SDK -->

  FlowerSdk.setEnv('local');   // 'local' | 'dev' | 'prod'
  FlowerSdk.init();
  // React: use window.FlowerSdk

STEP 2 — Ad UI over the player

  <div id="video-container" style="position: relative;">
      <video id="video-element" style="position: absolute; top: 0; right: 0; bottom: 0; left: 0;"></video>
      <div id="ad-container" style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: none;"></div>
  </div>

  For Bitmovin, the ad container must cover the element the Bitmovin player renders into.

STEP 3 — Module-scope state

  let flowerAdView = null;
  let adsManagerListener = null;
  let player = null;
  let isContentPrepared = false;
  let isContentEnd = false;

STEP 4 — Create the player BEFORE requestVodAd (the SDK inspects it at request time)

  hls.js:    player = new Hls(); player.attachMedia(videoElement);   // attachMedia is required
  bitmovin:  player = new bitmovin.player.Player(containerElement, playerConfig);
  dash.js:   player = dashjs.MediaPlayer().create(); player.initialize(videoElement, null, true);
  shaka:     player = new shaka.Player(); await player.attach(videoElement);

  Keep the app's existing player configuration; only the creation order matters.

STEP 5 — Content loading, called once from the first onCompleted()/onError()

  function prepareContentSource() {
      // hls.js
      player.once(Hls.Events.MANIFEST_PARSED, () => { videoElement.play(); });
      player.loadSource(config.contentUrl);
      // bitmovin
      // player.load({ hls: config.contentUrl }).then(() => player.play());
      // dash.js (autoPlay was set to true in initialize)
      // player.attachSource(config.contentUrl);
      // shaka
      // player.load(config.contentUrl).then(() => videoElement.play());
  }

  Move the app's existing "load and play the content" code here, unchanged otherwise.
  Keep only the branch for {{PLAYER}}.

STEP 6 — Listener

  adsManagerListener = {
      onPrepare(adDurationMs) {
          // Pre-roll, mid-roll and post-roll: play right away. Never delay this call.
          flowerAdView.adsManager.play();
      },
      onPlay() {
          // UI only (e.g. hide custom player controls). Do NOT pause the content here.
      },
      onCompleted() {
          if (!isContentPrepared) {
              isContentPrepared = true;
              prepareContentSource();
          } else if (isContentEnd) {
              // The post-roll finished: VOD playback is fully done (e.g. go to next episode).
          }
          // After a mid-roll the SDK resumes the content by itself. Do nothing here.
      },
      onError(error) {
          console.warn('Flower ad error', error);
          if (!isContentPrepared) {
              // Pre-roll error: load and start the content.
              isContentPrepared = true;
              prepareContentSource();
          } else if (!isContentEnd) {
              // Mid-roll error: resume the content - play() only, no seek or reload.
              // hls.js / dash.js / shaka: videoElement.play();  bitmovin: player.play();
              videoElement.play();
          }
          // Post-roll error (isContentEnd): playback is over - nothing to resume.
      },
      onAdBreakSkipped(reason) {
          // 0: Unknown, 1: No Ad, 2: Timeout, 3: Error. Informational only.
      }
  };

STEP 7 — Content end (notify once)

  hls.js / dash.js / shaka:
      videoElement.addEventListener('ended', onContentEnded);
  bitmovin:
      player.on(bitmovin.player.PlayerEvent.PlaybackFinished, onContentEnded);

  function onContentEnded() {
      if (isContentEnd) return;
      isContentEnd = true;
      flowerAdView.adsManager.notifyContentEnded();
  }

STEP 8 — Request ads when the VOD screen opens

  function playVod(config) {
      stopPlayback();                       // clean up any previous session first
      isContentPrepared = false;
      isContentEnd = false;
      flowerAdView = new FlowerAdView(document.getElementById('ad-container'));
      // create the player here (STEP 4) if the app recreates it per title
      flowerAdView.adsManager.addListener(adsManagerListener);

      const mediaPlayerHook = { getPlayer() { return player; } };
      flowerAdView.adsManager.requestVodAd(
          config.adTagUrl,           // ad tag URL issued by Anypoint Media
          config.contentId,          // must be registered in the Flower backend
          config.contentDurationMs,  // content duration in milliseconds
          { serviceId: config.serviceId, os: 'Web', adId: config.adId, ...config.extraParams },
          mediaPlayerHook,
          config.adTagHeaders || null
          // optional: requestTimeout, minPrepareDuration, rewindDuration (ms); null = default
      );
      // Do NOT load or play the content here.
  }

STEP 9 — User pause / resume (optional, as in the guide)

  On a user pause:  pause the player, then flowerAdView.adsManager.pause();
  On a user resume: resume the player, then flowerAdView.adsManager.resume();

STEP 10 — Cleanup when leaving the VOD screen

  function stopPlayback() {
      if (flowerAdView && adsManagerListener) {
          flowerAdView.adsManager.removeListener(adsManagerListener);  // BEFORE stop()
          flowerAdView.adsManager.stop();
      }
      // destroy the player: hls.js / bitmovin / shaka -> player.destroy(); dash.js -> player.reset()
      flowerAdView = null;
  }
  Call stopPlayback() on screen exit, on beforeunload, and in a React useEffect cleanup.

========================================
RULES
========================================

DO:
- Call flowerAdView.adsManager.play() immediately in onPrepare() for every break.
- Load the content only in the first onCompleted()/onError() (isContentPrepared).
- Register the listener before requestVodAd().
- Call notifyContentEnded() exactly once per content.
- Remove the listener before stop().
- In onError() after a mid-roll (isContentPrepared && !isContentEnd), call play() on the
  content as a safety net.

DO NOT:
- Load or play the content right after requestVodAd().
- Pause the content in onPlay() or onPrepare().
- Delay play() in onPrepare() (no setTimeout, no "ads start in 5 seconds" countdown).
- Call play(), seek, or reload the content in onCompleted() after a mid-roll.
- Seek or reload the content in onError() after a mid-roll, or resume it after a post-roll.
- Seek back after a mid-roll yourself (the SDK already rewinds by rewindDuration).
- Use changeChannelUrl() or FlowerHls for VOD.
- Use Video.js or another unsupported player: no ads and no callbacks would arrive,
  so the content would never start.

========================================
VERIFY
========================================

- Pre-roll: the ad plays over a black/empty player; no content audio under the ad;
  the content starts right after the ad.
- No pre-roll / no ad / ad server unreachable: the content starts within requestTimeout.
- Mid-roll: at the mid-roll position the content pauses and the ad plays; afterwards the
  content resumes about 5 s before where it stopped and the same mid-roll does not repeat.
- Post-roll: after the content ends, the post-roll plays once and onCompleted() reports
  the end of playback; the content does not restart.
- Ad playback error: the content starts (pre-roll) or resumes (mid-roll, from about 5 s
  before where it stopped) once, not twice; after a post-roll error it stays ended.
- Leave the screen during an ad: no content starts after leaving; no console errors.
- Open a second title: ads are requested again and the previous session is fully stopped.

========================================
OUTPUT
========================================

- Modify the code I paste; do not rewrite unrelated parts.
- Keep only the {{PLAYER}} branch of every snippet above.
- List every changed file and summarize the change in each.
- Do not add code for linear TV, FlowerHls, interstitial ads, or
  setIgnoreAdBreakInPIPMode(false).
```
