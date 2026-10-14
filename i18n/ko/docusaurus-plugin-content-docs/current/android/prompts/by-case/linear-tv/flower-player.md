---
sidebar_position: 1
sidebar_label: Flower Player로 Linear TV 광고
---

# Flower Player로 Linear TV / FAST 광고 재생

앱이 Media3 ExoPlayer, ExoPlayer2, Bitmovin Player로 라이브 Linear 채널이나 FAST 스트림(HLS/DASH)을 재생하고 가장 간단하게 연동하려는 경우 이 프롬프트를 사용하세요. 플레이어를 Flower Player로 감싸고 `FlowerLinearTvAdConfig`를 전달하면, SDK가 스트림에 표시된 광고 구간(예: SCTE-35)을 교체합니다. LLM이 플레이어를 감싸고, 광고 설정을 만들고, 리스너를 등록하고, 정리 코드를 추가합니다. 배경 설명: [Flower Player 사용 (Linear TV)](../../../ad-insertion/linear-tv-fast/using-flower-player.md), [Flower Player 소개](../../../ad-insertion/about-flower-players.md).

이 프롬프트는 Kotlin 코드를 생성합니다.

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `SDK_VERSION` | 예: `2.9.29` | 프로젝트에 제공된 Flower SDK 버전 |
| `ENV` | `local` \| `dev` \| `prod` | `FlowerSdk.setEnv()`에 전달하는 값 |
| `PLAYER` | `media3` \| `exoplayer2` \| `bitmovin` | 감쌀 플레이어: `FlowerMedia3ExoPlayer`, `FlowerExoPlayer2`, `FlowerBitmovinPlayer` |
| `MEDIA3_VERSION` | 예: `1.10.1` | `media3`인 경우에만: 앱의 `androidx.media3` 버전 |

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
- The SDK remembers the channel (channelId) entered last. When the same channel's ad config is
  set again, the Flower Player skips the pre-roll even if prerollAdTagUrl is set, and loads the
  channel stream. stop() / release() do not clear the remembered channel; requestVodAd() /
  requestAd() do. A -> B -> A plays A's pre-roll again.
- Loading another channel with a new config stops the previous channel's ad session.
- onError(): an ad failed to play or the channel stream can no longer be played. Recover by
  stopping the player and the SDK ads manager, then loading the channel again as in step 5.
  media3 / exoplayer2: player.stop() also calls the SDK's adsManager.stop().
  bitmovin: there is no stop(); call player.flowerAdView.adsManager.stop() and player.unload()
  (destroy() also stops the ads manager). This also covers a pre-roll that fails while playing:
  the Flower Player does not load the channel by itself in that case.
  Load the channel again with the same FlowerLinearTvAdConfig, including prerollAdTagUrl: the
  restarted channel is the one entered last, so the Flower Player skips its pre-roll and loads
  the channel stream.

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
  again as in step 5 with the same FlowerLinearTvAdConfig, including prerollAdTagUrl. The SDK
  skips the pre-roll of the channel entered last.
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
