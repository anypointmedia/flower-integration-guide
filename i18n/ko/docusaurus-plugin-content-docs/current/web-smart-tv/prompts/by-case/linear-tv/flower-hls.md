---
sidebar_position: 1
sidebar_label: FlowerHls (확장 HLS.js)
---

# FlowerHls를 이용한 Linear TV / FAST

Linear 채널 또는 FAST 플레이어에서 HLS.js를 사용하며 가장 간단한 연동을 원할 때 이 프롬프트를 사용하세요. `Hls`를 SDK의 `FlowerHls` 래퍼로 교체하면 래퍼가 스트림에 광고를 삽입합니다. LLM이 플레이어 클래스를 교체하고, 스트림 로드 전에 광고 설정을 전달하며, 정리 코드를 추가하도록 안내합니다. [확장 HLS.js 사용](../../../ad-insertion/linear-tv-fast/using-extended-hlsjs.md) 페이지를 참고하세요.

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `SDK_VERSION` | 예: `2.3.18` | 프로젝트에 제공된 Flower SDK 버전 |
| `USE_PREROLL` | `yes` \| `no` | 채널 프리롤용 광고 태그 URL(`prerollAdTagUrl`)을 발급받았는지 여부 |

```plain
We are adding FLOWER SDK ads to our HTML5/Web (or Smart TV web app) linear channel /
FAST player, which uses HLS.js. Replace HLS.js with the SDK's FlowerHls wrapper.
Modify the code I paste after this prompt.

========================================
GOAL
========================================

- Replace `new Hls(...)` with `new FlowerHls(...)`.
- Pass the ad configuration with setAdConfig() before every loadSource().
- Optionally listen to ad events for UI changes.
- Clean up when the channel screen closes.

========================================
PARAMETERS
========================================

SDK_VERSION: {{SDK_VERSION}}
USE_PREROLL: {{USE_PREROLL}}   (yes | no)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

1. FlowerHls extends HLS.js. HLS.js must be loaded (window.Hls); FlowerHls forwards
   unknown properties and methods to its internal Hls instance, and FlowerHls.Events is
   Hls.Events.
2. attachContainer(container) creates the <video> elements and the ad container inside
   the given element. Do not create a <video> or a FlowerAdView yourself. The playing
   video element is hls.media.
3. The ad view is created only after BOTH attachContainer() and setAdConfig() have been
   called. addAdListener() before that does nothing.
4. loadSource(url) asks the SDK for an ad-inserted stream URL and loads it. Never call changeChannelUrl() yourself with FlowerHls.
5. Linear ads are inserted into the stream at the ad markers; the app does not call
   play() for them. onPrepare/onPlay/onCompleted are informational.
6. With prerollAdTagUrl, the SDK plays the channel pre-roll in its own video element over
   the stream, pauses the stream while it plays, and resumes the stream afterwards. The
   app does nothing for it. The ad listener also receives onPrepare/onPlay/onCompleted for
   the pre-roll; with no pre-roll ad or a failed one the SDK calls onCompleted() (not
   onError()) and the stream resumes. A channel change stops a pending pre-roll and
   requests the next channel's pre-roll.
7. FlowerHls supports linear channels only. VOD is not supported with FlowerHls.
8. FlowerHls does not expose changeChannelExtraParams(). To change targeting, set a new
   ad config and call loadSource() again, or use the manual player control case.
9. destroy() also stops the SDK's ad session. stopLoad() stops loading and the ad session.
   Stopping the ad session ends any ad break in progress, and the SDK can still call
   onCompleted() for that break afterwards; a listener removed before destroy() does not
   receive it. A destroyed FlowerHls cannot be reused.
10. onError() is the signal to recover the channel: stop the ad session, release the player
   (destroy() does both), and start the channel again (new FlowerHls -> attachContainer ->
   setAdConfig -> addAdListener -> loadSource). The restart's setAdConfig() has exactly the
   same values as the first start, prerollAdTagUrl included. If the channel has not
   changed, the pre-roll is skipped, even on a new FlowerHls, so the viewer does not see it twice and the
   stream plays right away. A channel change back to a previous channel
   (A -> B -> A) plays A's pre-roll again.
11. On a webOS TV the SDK reads the LGUDID through webOS.service.request (webOSTV.js must
    be loaded); on a Tizen TV it reads the TIFA through webapis.adinfo. Without them the
    SDK falls back to its own device identifier. Supported: webOS TV >= 23, Tizen >= 7.0.

========================================
IMPLEMENTATION
========================================

STEP 1 — Load the SDK BEFORE HLS.js, then initialize

  <script src="https://sdk.anypoint.tv/html5/flower-sdk-{{SDK_VERSION}}.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/hls.js"></script>

  FlowerSdk.setEnv('local');   // 'local' | 'dev' | 'prod'
  FlowerSdk.init();

STEP 2 — Container only (FlowerHls creates the video and ad elements)

  <div id="video-container" style="position: relative; width: 100%; height: 100%;"></div>

STEP 3 — Create the player

  let hls = null;
  let adsManagerListener = null;

  function initHls() {
      hls = new FlowerHls(existingHlsConfig);    // keep the app's existing Hls config
      hls.attachContainer(document.getElementById('video-container'));
      hls.on(Hls.Events.MANIFEST_PARSED, () => { hls.media.play(); });
  }

  Replace every use of the app's own <video> element with hls.media.

STEP 4 — Start a channel

  let currentChannel = null;

  // Used for the first start, a channel change, and a restart after onError(). A restart
  // passes the same ad config, prerollAdTagUrl included: if the channel has not
  // changed, the pre-roll is skipped.
  function playChannel(channel) {
      currentChannel = channel;
      const adConfig = {
          adTagUrl: channel.adTagUrl,                 // issued by Anypoint Media
          prerollAdTagUrl: channel.prerollAdTagUrl,   // USE_PREROLL = yes only; drop it for no
          channelId: channel.channelId,               // registered in the Flower backend
          extraParams: { serviceId: channel.serviceId, os: 'Web', adId: channel.adId },
          adTagHeaders: channel.adTagHeaders,         // optional
          channelStreamHeaders: channel.streamHeaders // optional
      };
      hls.setAdConfig(adConfig);

      if (!adsManagerListener) {
          adsManagerListener = {
              onPrepare(adDurationMs) {},
              onPlay() { /* optional: hide custom player controls */ },
              onCompleted() { /* optional: show custom player controls */ },
              onError(error) {
                  console.warn('Flower ad error', error);
                  restartChannel();
              },
              onAdBreakSkipped(reason) {}
          };
          hls.addAdListener(adsManagerListener);  // after attachContainer + setAdConfig
      }

      hls.loadSource(channel.streamUrl);           // original stream URL
  }

  Channel change: call playChannel(nextChannel) again (setAdConfig, then loadSource).

  // On onError(): stop the ad session and the player, then start the channel again
  // exactly as the first time. Keep onCompleted() UI-only.
  // (Optional) Count restarts and give up after a few attempts so a broken channel does not loop.
  function restartChannel() {
      stopPlayback();                 // removeAdListener() -> destroy() (also stops the ad session)
      initHls();                      // a destroyed FlowerHls cannot be reused
      // Same ad config, prerollAdTagUrl included: the SDK skips the pre-roll of this channel.
      playChannel(currentChannel);    // setAdConfig -> addAdListener -> loadSource
  }

STEP 5 — Cleanup

  function stopPlayback() {
      if (!hls) return;
      if (adsManagerListener) hls.removeAdListener(adsManagerListener);
      hls.destroy();
      hls = null;
      adsManagerListener = null;
  }
  Call it when the player screen closes, on beforeunload, or in a React useEffect cleanup.

STEP 6 — Report the user leaving the app and coming back

  function reportUserLeftApp() {
      const hasLeftApp = document.visibilityState === 'hidden'
          || (hls && document.pictureInPictureElement === hls.media);
      FlowerSdk.notifyUserLeftApp(hasLeftApp);
  }
  document.addEventListener('visibilitychange', reportUserLeftApp);
  // Only if the app supports PIP; register on each new hls.media (after initHls()):
  hls.media.addEventListener('enterpictureinpicture', reportUserLeftApp);
  hls.media.addEventListener('leavepictureinpicture', reportUserLeftApp);
  Report it whether or not PIP starts (another tab or app, the TV app in the background,
  or PIP). Stream ads keep playing while the user is away (only the ad UI is hidden); a
  channel pre-roll is paused while the user is away and resumed when the user comes back.
  FlowerSdk.notifyPictureInPictureModeChanged() is deprecated and replaced by
  notifyUserLeftApp(). Existing calls keep working.

========================================
RULES
========================================

DO:
- Call setAdConfig() before every loadSource().
- Load the Flower SDK script before HLS.js.
- Remove the listener, then destroy() the player when leaving.
- On onError(), restart the channel: remove the listener, destroy(), new FlowerHls, then
  setAdConfig() and loadSource() exactly as at the first start, prerollAdTagUrl included.
  If the channel has not changed, the pre-roll is skipped, so the viewer does not see it
  again.

DO NOT:
- Start or reload playback in onCompleted(): stopping the ad session can still call it.
- Call changeChannelUrl(), requestVodAd() or create a FlowerAdView with FlowerHls.
- Call attachMedia() (use attachContainer()).
- Call flowerAdView.adsManager.play() or pause the stream for linear ads.
- Pause or delay the stream yourself for the channel pre-roll.
- Use FlowerHls for VOD.

========================================
VERIFY
========================================

- Channel start: the stream plays; ads replace the stream at ad markers.
- USE_PREROLL = yes: the pre-roll plays first, the stream resumes after it; with no
  pre-roll ad or an ad error, the stream still starts.
- Channel change: the next channel plays with ads; no ad from the previous channel.
- Leave the player: no network requests or audio continue.
- onError() (e.g. make the stream fail): the old FlowerHls is destroyed, a new one loads
  the channel again with the same ad config (prerollAdTagUrl included) and plays it with
  ads and no pre-roll, and the old instance's late onCompleted() does not restart it.
- On a TV, check the SDK log for the LGUDID / TIFA line.

========================================
OUTPUT
========================================

- Modify the code I paste; keep the app's existing HLS.js config and UI.
- List every changed file.
- Do not add VOD, interstitial, or manual changeChannelUrl() code.
```
