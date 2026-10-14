---
sidebar_position: 2
sidebar_label: Linear TV with Your Own Player
---

# Linear TV / FAST Ads with Your Own Player (MediaPlayerHook)

Use this prompt when the app keeps its own ExoPlayer2, Media3 ExoPlayer, or Bitmovin Player for a live channel or FAST stream, and gets an ad-replaced stream URL from `changeChannelUrl()`. The LLM adds `FlowerAdView`, the listener, the `changeChannelUrl()` call with optional pre-roll handling, `changeChannelExtraParams()` for program changes, and cleanup. Background: [Manual Player Control](../../../ad-insertion/linear-tv-fast/manual-player-control.md).

The prompt generates Kotlin code.

| Parameter | Values | Description |
|-----------|--------|-------------|
| `SDK_VERSION` | e.g., `2.9.28` | Flower SDK version provided to your project |
| `ENV` | `local` \| `dev` \| `prod` | Value passed to `FlowerSdk.setEnv()` |
| `PLAYER` | `media3` \| `exoplayer2` \| `bitmovin` | The channel player your app uses |
| `USE_PREROLL` | `yes` \| `no` | Whether a pre-roll ad tag URL is used when entering a channel |

```plain
We are integrating the FLOWER SDK (Android) into our app for Linear TV / FAST ads, keeping our
own player. Modify the code I provide. Generate Kotlin.

========================================
GOAL
========================================
Play each channel through the URL returned by FlowerAdsManager.changeChannelUrl(), so ad breaks
in the stream are replaced, with FlowerAdView on top of the player for the ad UI.

========================================
PARAMETERS
========================================
SDK_VERSION: {{SDK_VERSION}}
ENV: {{ENV}}                 (local | dev | prod)
PLAYER: {{PLAYER}}           (media3 | exoplayer2 | bitmovin)
USE_PREROLL: {{USE_PREROLL}} (yes | no)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- changeChannelUrl() starts an in-app proxy and returns a loopback URL. The proxy serves the
  original manifest with ad segments put in at the ad markers (e.g. SCTE-35). The app plays the
  returned URL instead of the original URL.
- The SDK reads playback state from the player returned by the MediaPlayerHook.
- Listener: onPlay() / onCompleted() at the start / end of an ad break, onAdBreakSkipped(reason)
  when a marker had no ad, onError() on SDK errors. onPrepare() needs no action for linear TV;
  the app does not call adsManager.play() for linear TV.
- Channel pre-roll (USE_PREROLL = yes): an ad played once when the viewer enters a channel,
  before the live stream. With prerollAdTagUrl, changeChannelUrl() still returns the URL right
  away, and the SDK requests the pre-roll and plays it in its own ad player over FlowerAdView (no
  adsManager.play()). The app holds the stream until the pre-roll ends. Listeners receive
  onPrepare(), onPlay() at its start and onCompleted() at its end (no onAdPlay() /
  onAdBreakSkipped() for it). No pre-roll ad, a failed request, or a pre-roll that fails while
  playing is also reported as onCompleted(), not onError().
- With the default FlowerSdk.setIgnoreAdBreakInPIPMode(true), the pre-roll is paused while the app
  is in PIP and resumed when it returns, like VOD ads.
- A pre-roll stopped by the next changeChannelUrl() / adsManager.stop() reports nothing.
- onError() on the main listener means an ad failed to play or the channel stream can no longer
  be played. Recover by stopping the ads manager (adsManager.stop()) and the player, then entering
  the channel again with a NEW changeChannelUrl() call (step 5). A restart leaves the channel
  pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it. A break cut short by
  stop() may still report onCompleted() afterwards, so keep onCompleted() idempotent (UI-only).

========================================
IMPLEMENTATION
========================================
1) SDK dependency and initialization (skip what the project already has)
   - Repositories: google(), maven("https://maven.anypoint.tv/repository/public-release"),
     maven("https://jitpack.io")
   - implementation("flower-sdk:sdk-android-ott:{{SDK_VERSION}}")
   - Allow cleartext HTTP ONLY for prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com
     (network_security_config.xml), unless usesCleartextTraffic="true" is already set.
   - Application: FlowerSdk.setEnv("{{ENV}}"); FlowerSdk.init(this) in onCreate(),
     FlowerSdk.destroy() in onTerminate().

2) Layout: FlowerAdView after the player view, same size, android:visibility="gone":
     <tv.anypoint.flower.android.sdk.api.FlowerAdView
         android:id="@+id/flowerAdView"
         android:layout_width="match_parent"
         android:layout_height="match_parent"
         android:visibility="gone" />

3) Members
     import tv.anypoint.flower.android.sdk.api.FlowerAdView
     import tv.anypoint.flower.sdk.core.api.FlowerAdsManagerListener
     import tv.anypoint.flower.sdk.core.api.FlowerError
     import tv.anypoint.flower.sdk.core.api.MediaPlayerHook

     private lateinit var flowerAdView: FlowerAdView
     private val mediaPlayerHook = MediaPlayerHook { player }   // returns the channel player
     private var prerollListener: FlowerAdsManagerListener? = null   // set while a pre-roll is pending

4) Listener
     private val adsManagerListener = object : FlowerAdsManagerListener {
         override fun onPlay() { CoroutineScope(Dispatchers.Main).launch { /* hide controls */ } }
         override fun onCompleted() { CoroutineScope(Dispatchers.Main).launch { /* show controls */ } }
         override fun onError(error: FlowerError?) { CoroutineScope(Dispatchers.Main).launch { restartChannel() } }
         override fun onAdBreakSkipped(reason: Int) { /* optional logging */ }
     }
     flowerAdView.adsManager.addListener(adsManagerListener)

     private fun restartChannel() {
         // Optionally give up after a few consecutive restarts (e.g., 3) to avoid a restart loop.
         flowerAdView.adsManager.stop()
         player.stop()                            // bitmovin: player.unload()
         enterChannel(currentChannel, withPreroll = false)   // step 5 again, without the pre-roll
     }

5) Enter a channel: enterChannel(channel, withPreroll: Boolean = true)
   withPreroll is true for the first start of a channel and a channel switch, false for a restart
   after onError(). A restart leaves the channel pre-roll out (prerollAdTagUrl omitted): the
   viewer has already seen it.
   First drop a temporary listener left by a previous channel's pending pre-roll:
     prerollListener?.let { flowerAdView.adsManager.removeListener(it) }
     prerollListener = null
     flowerAdView.adsManager.addListener(adsManagerListener)   // listeners are a set: no duplicate
     val prerollAdTagUrl = if (withPreroll) channel.prerollAdTagUrl else null   // null when USE_PREROLL = no
     val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
         channel.streamUrl,                       // original stream URL
         channel.adTagUrl,                        // issued by Anypoint Media
         channel.id,                              // registered in the Flower backend
         mapOf("serviceId" to packageName, "os" to "Android", "adId" to advertisingId),
         mediaPlayerHook,                         // typed MediaPlayerHook
         null,                                    // adTagHeaders (optional)
         null,                                    // channelStreamHeaders (optional)
         prerollAdTagUrl,                         // String? - null when USE_PREROLL = no or on a restart
     )

   prerollAdTagUrl == null (USE_PREROLL = no, or a restart) -> play changedChannelUrl right away,
   keeping the main listener registered:
     media3 / exoplayer2: player.setMediaItem(MediaItem.fromUri(changedChannelUrl)); player.prepare(); player.play()
     bitmovin:            player.load(SourceConfig.fromUrl(changedChannelUrl)); player.play()

   prerollAdTagUrl != null (USE_PREROLL = yes, first start or channel switch) -> do NOT load
   changedChannelUrl yet. Swap in a temporary listener and load the stream when the pre-roll ends:
     flowerAdView.adsManager.removeListener(adsManagerListener)
     val listener = object : FlowerAdsManagerListener {
         override fun onCompleted() { CoroutineScope(Dispatchers.Main).launch { finish() } }
         override fun onError(error: FlowerError?) { CoroutineScope(Dispatchers.Main).launch { finish() } }
         private fun finish() {
             if (prerollListener !== this) return                // only the first call starts the stream
             prerollListener = null
             playStream(changedChannelUrl)                       // as in USE_PREROLL = no
             flowerAdView.adsManager.removeListener(this)
             flowerAdView.adsManager.addListener(adsManagerListener)
         }
     }
     prerollListener = listener
     flowerAdView.adsManager.addListener(listener)

6) Program change during playback (targeting update)
     flowerAdView.adsManager.changeChannelExtraParams(mapOf("myTargetingKey" to value))

7) Channel switch: run step 5 for the new channel with withPreroll = true (changeChannelUrl()
   stops the previous channel's ad session itself, including a pending pre-roll, and requests
   the new channel's pre-roll).

8) Cleanup
     flowerAdView.adsManager.removeListener(adsManagerListener)
     prerollListener?.let { flowerAdView.adsManager.removeListener(it) }
     flowerAdView.adsManager.stop()
     player.release()     // bitmovin: player.destroy()

========================================
RULES
========================================
DO
- Always play the URL returned by changeChannelUrl() on the local player.
- Pass the hook as a value typed MediaPlayerHook (the 8-argument overload also accepts a
  MediaPlayerAdapter typed as Any).
- On onError() of the main listener, on the main thread: adsManager.stop(), stop the player, then
  enter the channel again with a new changeChannelUrl(). Do not reuse the previous loopback URL.
- On that restart pass the same arguments as the first start except prerollAdTagUrl = null. A
  restart leaves the channel pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it.
- Before the next changeChannelUrl() and before adsManager.stop(), remove a temporary pre-roll
  listener that is still registered and register the main listener again: a pre-roll stopped
  this way never reports onCompleted(), and the stale listener would load the old channel's URL
  when the next pre-roll ends.
DO NOT
- Do not use requestVodAd() / notifyContentEnded() for live channels.
- Do not load the stream before the pre-roll ends when USE_PREROLL = yes (first start or channel
  switch).
- Do not swap in the temporary pre-roll listener or hold the stream on a restart after onError().
- Do not call adsManager.play() for linear TV ad breaks.
- Do not hand the loopback URL to another device (casting) — see the Screen Casting prompt.

========================================
VERIFY
========================================
- Channel plays from the loopback URL; at an ad marker the ad is replaced; onPlay()/onCompleted().
- Marker with no ad: onAdBreakSkipped(); original content continues.
- USE_PREROLL = yes: pre-roll plays, then the channel starts; pre-roll error still starts the channel.
- Ad or stream error (onError() on the main listener): the ads manager stops and the channel
  restarts from a new changeChannelUrl() URL without the pre-roll: the stream plays right away and
  the main listener stays registered.
- Channel switch and leaving the screen stop the previous session without crashes.

========================================
OUTPUT
========================================
- Full code for every changed file and a short list of the changes.
```
