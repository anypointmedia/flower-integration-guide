---
sidebar_position: 1
sidebar_label: Linear TV with Flower Player
---

# Linear TV / FAST Ads with Flower Player

Use this prompt when the app plays a live linear channel or FAST stream (HLS/DASH) with Media3 ExoPlayer, ExoPlayer2, or Bitmovin Player and you want the simplest integration: wrap the player in a Flower Player and pass a `FlowerLinearTvAdConfig`. The SDK replaces the ad breaks marked in the stream (e.g., SCTE-35). The LLM wraps the player, builds the ad config, registers the listener, and adds cleanup. Background: [Using Flower Player (Linear TV)](../../../ad-insertion/linear-tv-fast/using-flower-player.md), [About Flower Players](../../../ad-insertion/about-flower-players.md).

The prompt generates Kotlin code.

| Parameter | Values | Description |
|-----------|--------|-------------|
| `SDK_VERSION` | e.g., `2.9.29` | Flower SDK version provided to your project |
| `ENV` | `local` \| `dev` \| `prod` | Value passed to `FlowerSdk.setEnv()` |
| `PLAYER` | `media3` \| `exoplayer2` \| `bitmovin` | The player to wrap: `FlowerMedia3ExoPlayer`, `FlowerExoPlayer2`, or `FlowerBitmovinPlayer` |
| `MEDIA3_VERSION` | e.g., `1.10.1` | Only for `media3`: the app's `androidx.media3` version |

```plain
We are integrating the FLOWER SDK (Android) into our app for Linear TV / FAST ads using a
Flower Player. Modify the code I provide. Generate Kotlin.

========================================
GOAL
========================================
Replace the channel player with the matching Flower Player and pass FlowerLinearTvAdConfig when
loading each channel, so ad breaks in the stream are replaced with targeted ads.

========================================
PARAMETERS
========================================
SDK_VERSION: {{SDK_VERSION}}
ENV: {{ENV}}                       (local | dev | prod)
PLAYER: {{PLAYER}}                 (media3 | exoplayer2 | bitmovin)
MEDIA3_VERSION: {{MEDIA3_VERSION}} (only for media3)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- When a channel is loaded with a FlowerLinearTvAdConfig, the Flower Player calls the SDK's
  changeChannelUrl() itself and plays a local proxy URL (loopback) that serves the channel
  manifest with ad segments put in at the ad markers. The app keeps calling the player as usual.
- The Flower Player adds its own FlowerAdView over the video (ExoPlayer variants: when the video
  surface/texture view is set, e.g. playerView.player = player; Bitmovin: through setAdViewGroup()).
- Listener events: onPlay() when an ad break starts, onCompleted() when it ends,
  onAdBreakSkipped(reason) when a marker had no ad (1 no ad, 2 timeout, 3 error), onError() on
  SDK errors. onPrepare() needs no action for linear TV.
- prerollAdTagUrl (optional): the Flower Player plays a pre-roll before the channel and loads the
  channel stream after it ends. The app does not call adsManager.play() for it. A channel
  pre-roll is an ad played once when the viewer enters a channel, before the live stream. The
  app calls prepare() / play() as usual; the Flower Player holds them until the pre-roll is
  ready. The listener gets the pre-roll's onPlay() / onCompleted() like other ads. No pre-roll ad
  (onAdBreakSkipped()) or a failed request ends with onCompleted() and the channel starts. With
  the default FlowerSdk.setIgnoreAdBreakInPIPMode(true) the pre-roll is paused while the user is
  away from the app (reported with FlowerSdk.notifyUserLeftApp(true/false), whether or not the
  app enters PIP) and resumed when the user comes back. Loading another channel requests that
  channel's pre-roll.
- If the channel has not changed, the pre-roll is skipped: when the ad config is set again
  without a channel change, the Flower Player skips the pre-roll even if prerollAdTagUrl is set,
  and loads the channel stream. stop() / release() are not a channel change; requestVodAd() /
  requestAd() are. A -> B -> A plays A's pre-roll again.
- Loading another channel with a new config stops the previous channel's ad session.
- onError(): an ad failed to play or the channel stream can no longer be played. Recover by
  stopping the player and the SDK ads manager, then loading the channel again as in step 5.
  media3 / exoplayer2: player.stop() also calls the SDK's adsManager.stop().
  bitmovin: there is no stop(); call player.flowerAdView.adsManager.stop() and player.unload()
  (destroy() also stops the ads manager). This also covers a pre-roll that fails while playing:
  the Flower Player does not load the channel by itself in that case.
  Load the channel again with the same FlowerLinearTvAdConfig, including prerollAdTagUrl: the
  channel has not changed, so the Flower Player skips the pre-roll and loads the channel stream.

========================================
IMPLEMENTATION
========================================
1) SDK dependency and initialization (skip what the project already has)
   - Repositories: google(), maven("https://maven.anypoint.tv/repository/public-release"),
     maven("https://jitpack.io")
   - implementation("flower-sdk:sdk-android-ott:{{SDK_VERSION}}")
   - Only if PLAYER = media3, ALSO:
       implementation("flower-sdk:sdk-android-ott-media3-{{MEDIA3_VERSION}}:{{SDK_VERSION}}")
     (artifact must match the app's androidx.media3 version exactly; 1.2.1 and above. Below that,
     tell the user to contact dev-support@anypointmedia.com.)
   - Allow cleartext HTTP ONLY for prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com
     (network_security_config.xml), unless usesCleartextTraffic="true" is already set.
   - Application: FlowerSdk.setEnv("{{ENV}}"); FlowerSdk.init(this) in onCreate(),
     FlowerSdk.destroy() in onTerminate().

2) Wrap the player (Activity context as the second argument)
     media3:     player = FlowerMedia3ExoPlayer(ExoPlayer.Builder(this).build(), this)
     exoplayer2: player = FlowerExoPlayer2(ExoPlayer.Builder(this).build(), this)
     bitmovin:   player = FlowerBitmovinPlayer(PlayerBuilder(this).build(), this)
   Attach it to the existing view (playerView.player = player, setVideoSurfaceView, ...).
   Imports: tv.anypoint.flower.android.sdk.api.FlowerMedia3ExoPlayer / FlowerExoPlayer2 /
   FlowerBitmovinPlayer / FlowerLinearTvAdConfig, tv.anypoint.flower.sdk.core.api.FlowerAdsManagerListener,
   tv.anypoint.flower.sdk.core.api.FlowerError

3) Ad config per channel (values from the app's channel data). The same config is used for the
   first start of a channel, a channel switch, and a restart after onError().
     fun buildAdConfig(channel: Channel) = FlowerLinearTvAdConfig(
         adTagUrl = channel.adTagUrl,               // issued by Anypoint Media
         prerollAdTagUrl = channel.prerollAdTagUrl, // optional, null = no pre-roll; the same on a restart
         channelId = channel.id,                    // registered in the Flower backend
         extraParams = mapOf("serviceId" to packageName, "os" to "Android", "adId" to advertisingId),
         adTagHeaders = null,                       // optional
         channelStreamHeaders = null,               // optional, headers for the original stream
     )

4) Listener (class member; register once)
     private val flowerAdsManagerListener = object : FlowerAdsManagerListener {
         override fun onPlay() {
             CoroutineScope(Dispatchers.Main).launch { /* hide player controls */ }
         }
         override fun onCompleted() {
             CoroutineScope(Dispatchers.Main).launch { /* show player controls */ }
         }
         override fun onError(error: FlowerError?) {
             CoroutineScope(Dispatchers.Main).launch {
                 // Optionally give up after a few consecutive restarts (e.g., 3) to avoid a restart loop.
                 player.stop()                  // also stops the SDK ads manager (bitmovin: see above)
                 playChannel(currentChannel)    // step 5 again, same ad config
             }
         }
         override fun onAdBreakSkipped(reason: Int) { /* optional logging */ }
     }
     player.addAdListener(flowerAdsManagerListener)

5) Load and play a channel: playChannel(channel)
     val adConfig = buildAdConfig(channel)
     media3 / exoplayer2:
         player.setMediaItem(MediaItem.fromUri(channel.streamUrl), adConfig)
         player.prepare()
         player.play()
     bitmovin:
         player.load(SourceConfig.fromUrl(channel.streamUrl), adConfig)
         player.play()
   (media3 / exoplayer2 also offer setAdConfig(adConfig) followed by setMediaItem(mediaItem).)
   To switch channels, call the same code with the new channel's URL and config.

6) Cleanup
     media3 / exoplayer2: player.stop(); player.removeAdListener(flowerAdsManagerListener); player.release()
     bitmovin:            player.removeAdListener(flowerAdsManagerListener); player.destroy()

========================================
RULES
========================================
DO
- Use FlowerLinearTvAdConfig for live/FAST channels; pass it with the media item / source.
- Register listeners with player.addAdListener().
- On onError(), on the main thread, stop the player and the ads manager, then load the channel
  again as in step 5 with the same FlowerLinearTvAdConfig, including prerollAdTagUrl. Without a
  channel change, the SDK skips the pre-roll.
DO NOT
- Do not call changeChannelUrl() yourself, and do not add a FlowerAdView to the layout.
- Do not write MediaItem.fromUri(url, adConfig) — that overload does not exist; pass the config
  to setMediaItem(mediaItem, adConfig).
- Do not use FlowerVodAdConfig or requestVodAd() for live channels.
- Do not cast/share the URL the player is playing (it is a loopback proxy URL); see the
  Screen Casting prompt.
- Do not call FlowerSdk.destroy() in an Activity.

========================================
VERIFY
========================================
- Channel plays; at an ad marker the ad break is replaced; onPlay()/onCompleted() fire.
- Marker with no ad: onAdBreakSkipped() fires and the original stream keeps playing.
- prerollAdTagUrl set: pre-roll plays first, then the channel starts.
- Ad or stream error (onError()): the ad session stops and the channel is loaded again with the
  same config; the pre-roll is not shown again and the channel stream plays.
- Channel A -> B -> A: A's pre-roll plays again.
- Switching channels does not leave the previous ad session running.
- Leaving the screen releases the player without crashes.

========================================
OUTPUT
========================================
- Full code for every changed file and a short list of the changes.
```
