---
sidebar_position: 2
sidebar_label: Manual Player Control
---

# Linear TV / FAST with Manual Player Control (changeChannelUrl)

Use this prompt when you keep your own HLS.js, Bitmovin, dash.js or Shaka Player instance for a linear channel or FAST stream, and get an ad-inserted stream URL from `changeChannelUrl()`. The prompt makes the LLM add the ad UI, request the ad-inserted URL, handle the optional channel pre-roll, and update targeting during playback. See [Manual Player Control](../../../ad-insertion/linear-tv-fast/manual-player-control.md).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `SDK_VERSION` | e.g. `2.3.17` | Flower SDK version provided to your project |
| `PLAYER` | `hls.js` \| `bitmovin` \| `dash.js` \| `shaka` | The player library your app uses |
| `USE_PREROLL` | `yes` \| `no` | Whether a channel pre-roll ad tag URL (`prerollAdTagUrl`) was issued |

```plain
We are adding FLOWER SDK ads to our HTML5/Web (or Smart TV web app) linear channel /
FAST player. We keep our own player and load the stream URL returned by
FlowerAdsManager.changeChannelUrl(). Modify the code I paste after this prompt.

========================================
GOAL
========================================

- Add a FlowerAdView over the player.
- Get the ad-inserted stream URL with changeChannelUrl() and load it instead of the
  original URL, on every channel start or change.
- Handle the channel pre-roll when USE_PREROLL is yes (not on a restart after onError()).
- Update targeting with changeChannelExtraParams() when the program changes.
- Clean up when the channel screen closes.

========================================
PARAMETERS
========================================

SDK_VERSION: {{SDK_VERSION}}
PLAYER: {{PLAYER}}           (hls.js | bitmovin | dash.js | shaka)
USE_PREROLL: {{USE_PREROLL}} (yes | no)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

1. changeChannelUrl(videoUrl, adTagUrl, channelId, extraParams, mediaPlayerHook,
   adTagHeaders, channelStreamHeaders, prerollAdTagUrl) returns the URL to load.
   The last three arguments are optional. extraParams and headers accept a plain object
   or a Map.
2. changeChannelUrl() first stops the previous ad session of the same FlowerAdsManager,
   so calling it again is how a channel change works.
3. If the URL is not http(s), getPlayer() returns null, or the player is not supported
   (supported: HLS.js, Bitmovin Player, dash.js, Shaka Player), changeChannelUrl()
   returns the original URL: the channel plays without ads. Load whatever it returns.
4. The SDK identifies the player during changeChannelUrl(): create the player first
   (for hls.js, call attachMedia() first).
5. Linear ads are inserted into the stream at the ad markers. The app does not call
   flowerAdView.adsManager.play() for them; listener callbacks are for UI only.
6. With prerollAdTagUrl, the SDK requests the pre-roll, plays it in its own video element
   over the player when it is ready, pauses the player meanwhile, and when it ends calls
   onCompleted() and resumes the player. It also calls onCompleted() when there is no
   pre-roll ad or the pre-roll fails. To avoid loading the stream under the pre-roll, the
   guide loads the returned URL only from a temporary pre-roll listener.
   A channel change (item 2) or stop() ends a pending pre-roll without calling that
   temporary listener, so remove it before the next changeChannelUrl() call and before
   stop(). With the default setIgnoreAdBreakInPIPMode(true), the pre-roll is paused in PIP
   and resumed on exit.
7. changeChannelExtraParams(extraParams) updates targeting for the next ad requests of
   the current channel.
8. onError() is the signal to recover the channel: call flowerAdView.adsManager.stop(),
   release the player, and start the channel again (a new changeChannelUrl() call, load the
   URL it returns, play). A restart leaves the channel pre-roll out (prerollAdTagUrl
   omitted): the viewer has already seen it. So the restart passes the same arguments as the
   first start except prerollAdTagUrl = null, registers no temporary pre-roll listener, and
   loads the returned URL right away with the main listener registered. stop() ends any ad
   break in progress, and the SDK can still call onCompleted() for that break after the
   restart has registered its listener. The main listener only does UI work there, so that
   is harmless.
   A pre-roll that fails is reported through onCompleted() (item 6), so the temporary
   pre-roll listener does not call stop() in onError(); it only starts the stream.
9. On a webOS TV the SDK reads the LGUDID through webOS.service.request (webOSTV.js must
   be loaded); on a Tizen TV it reads the TIFA through webapis.adinfo. Without them the
   SDK falls back to its own device identifier. Supported: webOS TV >= 23, Tizen >= 7.0.

========================================
IMPLEMENTATION
========================================

STEP 1 — Load the SDK BEFORE the player library, then initialize

  <script src="https://sdk.anypoint.tv/html5/flower-sdk-{{SDK_VERSION}}.js"></script>
  FlowerSdk.setEnv('local');   // 'local' | 'dev' | 'prod'
  FlowerSdk.init();

STEP 2 — Ad UI over the player

  <div id="video-container" style="position: relative;">
      <video id="video-element" style="position: absolute; top: 0; right: 0; bottom: 0; left: 0;"></video>
      <div id="ad-container" style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: none;"></div>
  </div>
  const flowerAdView = new FlowerAdView(document.getElementById('ad-container'));

STEP 3 — Player (create before changeChannelUrl) and how to load a URL

  hls.js:   player = new Hls(); player.attachMedia(videoElement);
            load(url): player.loadSource(url); player.once(Hls.Events.MANIFEST_PARSED, () => videoElement.play());
  bitmovin: player = new bitmovin.player.Player(containerElement, playerConfig);
            load(url): player.load({ hls: url }).then(() => player.play());
  dash.js:  player = dashjs.MediaPlayer().create();
            load(url): player.initialize(videoElement, url, true);
  shaka:    player = new shaka.Player(); await player.attach(videoElement);
            load(url): player.load(url).then(() => videoElement.play());
  Keep the app's existing player configuration and loading code; only the URL changes.

STEP 4 — Listener

  const adsManagerListener = {
      onPrepare(adDurationMs) {},
      onPlay() { /* optional: hide custom player controls */ },
      onCompleted() { /* optional: show custom player controls */ },
      onError(error) {
          // As in the guide: stop the ads manager, release the player, restart the channel.
          console.warn('Flower ad error', error);
          restartChannel();   // see STEP 7
      },
      onAdBreakSkipped(reason) {}
  };

STEP 5 — Start or change a channel

  let currentChannel = null;
  let prerollListener = null;   // the temporary listener while a channel pre-roll is pending

  // A channel change or stop() ends a pending pre-roll without calling its listener.
  function clearPendingPreroll() {
      if (!prerollListener) return;
      flowerAdView.adsManager.removeListener(prerollListener);
      prerollListener = null;
  }

  // withPreroll: true for the first start and a channel change, false for a restart after
  // onError(). A restart leaves the channel pre-roll out (prerollAdTagUrl omitted): the
  // viewer has already seen it.
  function playChannel(channel, { withPreroll = true } = {}) {
      currentChannel = channel;
      clearPendingPreroll();
      const mediaPlayerHook = { getPlayer() { return player; } };
      // USE_PREROLL = no, or a restart: null
      const prerollAdTagUrl = withPreroll ? (channel.prerollAdTagUrl || null) : null;

      const url = flowerAdView.adsManager.changeChannelUrl(
          channel.streamUrl,                       // original stream URL
          channel.adTagUrl,                        // issued by Anypoint Media
          channel.channelId,                       // registered in the Flower backend
          { serviceId: channel.serviceId, os: 'Web', adId: channel.adId },
          mediaPlayerHook,
          channel.adTagHeaders || null,
          channel.streamHeaders || null,
          prerollAdTagUrl
      );

      if (prerollAdTagUrl == null) {
          // No pre-roll (USE_PREROLL = no, or a restart): play right away.
          flowerAdView.adsManager.addListener(adsManagerListener);
          load(url);
          return;
      }

      // USE_PREROLL = yes, first start or channel change: load the stream only after the pre-roll
      flowerAdView.adsManager.removeListener(adsManagerListener);
      prerollListener = {
          onPrepare(adDurationMs) {},
          onPlay() {},
          onCompleted() { startAfterPreroll(); },
          onError(error) { startAfterPreroll(); },
          onAdBreakSkipped(reason) {}
      };
      let started = false;   // onCompleted() can arrive more than once
      function startAfterPreroll() {
          if (started) return;
          started = true;
          clearPendingPreroll();
          flowerAdView.adsManager.addListener(adsManagerListener);
          load(url);
      }
      flowerAdView.adsManager.addListener(prerollListener);
  }

  Keep only the USE_PREROLL = {{USE_PREROLL}} path. With USE_PREROLL = no there is no pre-roll
  branch, so the withPreroll option can be dropped.

STEP 6 — Targeting update during playback

  function onProgramChanged(program) {
      flowerAdView.adsManager.changeChannelExtraParams({ myTargetingKey: program.targetingValue });
  }

STEP 7 — Cleanup

  function stopPlayback() {
      clearPendingPreroll();                                        // BEFORE stop()
      flowerAdView.adsManager.removeListener(adsManagerListener);  // BEFORE stop()
      flowerAdView.adsManager.stop();
      // destroy the player: hls.js / bitmovin / shaka -> player.destroy(); dash.js -> player.reset()
  }

  // On onError(): stop the ads manager, release the player, and start the channel again
  // without the pre-roll. Keep onCompleted() UI-only.
  // (Optional) Count restarts and give up after a few attempts so a broken channel does not loop.
  function restartChannel() {
      stopPlayback();                 // removeListener() -> adsManager.stop() -> destroy the player
      // recreate the player as in STEP 3 (for hls.js: new Hls() + attachMedia())
      // A restart leaves the channel pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it.
      playChannel(currentChannel, { withPreroll: false });   // new changeChannelUrl() -> load -> play right away
  }

========================================
RULES
========================================

DO:
- Load the URL returned by changeChannelUrl(), never the original one.
- Call changeChannelUrl() again for every channel change.
- Remove the listener before stop().
- Remove a pending temporary pre-roll listener before the next changeChannelUrl() call and
  before stop().
- On onError(), call stop(), release the player, and start the channel again with a new
  changeChannelUrl() call. Never reload the URL returned before the error.
- On that restart, pass prerollAdTagUrl = null and load the returned URL right away. A restart
  leaves the channel pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it.

DO NOT:
- Start or reload playback in the main listener's onCompleted(): stop() can still call it.
- Call requestVodAd() or FlowerHls APIs (setAdConfig, addAdListener) in this case.
- Call flowerAdView.adsManager.play() for linear ads.
- Load the returned URL before the pre-roll ends when prerollAdTagUrl is set.
- Register the temporary pre-roll listener or hold the stream on a restart after onError().
- Pause, seek or resume the player yourself around the pre-roll.

If the player is not supported, do not invent an adapter here: the guide's
MediaPlayerAdapter + enterChannel() path is a separate integration. Report it instead.

========================================
VERIFY
========================================

- Channel start: the returned URL is loaded (check the network log); ads replace the
  stream at ad markers.
- USE_PREROLL = yes: the pre-roll plays before the stream; with no pre-roll ad or an ad
  error, the stream still starts.
- Channel change: ads continue on the new channel; the old session is stopped.
- Program change: the next ad request carries the new extraParams.
- Leave the player: no audio, no further segment or ad requests.
- onError() (e.g. make the stream fail): the ads manager is stopped, the player is
  recreated, changeChannelUrl() is called again without prerollAdTagUrl, and the channel
  plays right away with ads and no pre-roll; it does not restart a second time.

========================================
OUTPUT
========================================

- Modify the code I paste; keep only the {{PLAYER}} and USE_PREROLL = {{USE_PREROLL}} paths.
- List every changed file.
- Do not add VOD, FlowerHls, or interstitial code.
```
