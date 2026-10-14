---
sidebar_position: 3
sidebar_label: 앱의 광고 플레이어로 Linear TV 광고
---

# 앱의 광고 플레이어로 Linear TV 광고 재생 (광고 재생 직접 제어)

앱이 SDK 스트림 프록시를 사용하지 않는 경우 이 프롬프트를 사용하세요. 앱은 원본 채널 URL을 재생하고, 광고 마커(예: SCTE-35)를 직접 감지하고, `requestChannelAd()`로 SDK에 광고를 요청한 뒤, 앱이 소유한 두 번째 플레이어에서 광고를 재생합니다. LLM이 광고 플레이어용 `MediaPlayerAdapter`를 사용한 `enterChannel()`, 광고 요청, 광고 구간 시작/종료 처리, 정리 코드를 추가합니다. 배경 설명: [광고 재생 직접 제어](../../../ad-insertion/linear-tv-fast/direct-ad-playback-control.md), [플레이어를 직접 제어하는 경우](../../../ad-insertion/implement-interface-video-player/direct-player-control.md).

이 프롬프트는 ExoPlayer(Media3) 기반 광고 플레이어용 Kotlin 코드를 생성합니다.

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `SDK_VERSION` | 예: `2.9.28` | 프로젝트에 제공된 Flower SDK 버전 |
| `ENV` | `local` \| `dev` \| `prod` | `FlowerSdk.setEnv()`에 전달하는 값 |

```plain
We are integrating the FLOWER SDK (Android) for Linear TV ads WITHOUT the SDK stream proxy.
Our app detects ad markers itself and plays ads on its own ad player.
Modify the code I provide. Generate Kotlin.

========================================
GOAL
========================================
On channel entry call enterChannel() with a MediaPlayerAdapter of OUR ad player. At each ad
marker, request ads with requestChannelAd(), play them on the ad player, notify the SDK with
adsManager.play() when the break starts, and return to the channel when it ends.

========================================
PARAMETERS
========================================
SDK_VERSION: {{SDK_VERSION}}
ENV: {{ENV}}     (local | dev | prod)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- The SDK never drives the ad player. It only polls it through the MediaPlayerAdapter
  (isPlaying(), getCurrentMedia()) to follow ad progress, fire tracking beacons and render the
  ad UI (skip, learn more) on FlowerAdView.
- changeChannelUrl() is NOT used; the app plays the original channel URL.
- A channel pre-roll is NOT supported in this flow: enterChannel() has no pre-roll parameter
  (prerollAdTagUrl exists only on changeChannelUrl() and FlowerLinearTvAdConfig).
- requestChannelAd(transactionId, cueDuration, uniqueProgramId, timeout) returns
  Flow<FlowerAd>, emitting each ad as it becomes available (ads of one break can keep arriving
  while the break plays). The same transactionId again returns an empty Flow. No ad or a timeout
  makes the Flow throw FlowerError — skip the break and keep the channel playing.
- FlowerAd: id, duration (ms), creatives: List<FlowerCreative> (type, width, height, url).

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

2) Layout: channel player view, ad player view on top (gone), FlowerAdView on top (gone).

3) Ad player adapter: implement tv.anypoint.flower.android.sdk.api.MediaPlayerAdapter for the
   AD player (exact Kotlin signatures):
     getCurrentMedia(): Media                       // Media(urlOrId: String, duration: Double, position: Double)
     getVolume(): KotlinWrapped<Float>
     isPlaying(): KotlinWrapped<Boolean>
     getHeight(): KotlinWrapped<Int>
     pause(); stop(); resume()
     enqueuePlayItem(playItem: PlayItem); removePlayItem(playItem: PlayItem)   // may be empty here
     playNextItem()
     seekToPosition(absoluteStartTimeMs: KotlinWrapped<Double>?, relativeStartTimeMs: KotlinWrapped<Double>?,
                    offsetMs: KotlinWrapped<Double>?, windowDurationMs: KotlinWrapped<Double>?,
                    periodIndex: Int?)                                            // may be empty here
     getCurrentAbsoluteTime(isPrintDetails: Boolean): KotlinWrapped<Double>       // may return KotlinWrapped(-1.0)
     getPlayerType(): String?; getPlayerVersion(): String?
   Media, PlayItem, KotlinWrapped are in tv.anypoint.flower.sdk.core.api; FlowerAd and
   FlowerCreative are in tv.anypoint.flower.sdk.core.ads. Read player state on the
   Main thread (e.g. runBlocking(Dispatchers.Main) { ... }) and change it via
   CoroutineScope(Dispatchers.Main).launch { ... }.
   getCurrentMedia() is the critical method:
     urlOrId  = the creative URL EXACTLY as received (adPlayer.currentMediaItem uri)
     duration = duration of the CURRENT creative (ms), not of the whole break
     position = position within the CURRENT creative, starting at 0 for each ad
                (ExoPlayer.currentPosition, with each creative added as its own MediaItem)

4) Channel entry
     adPlayer = ExoPlayer.Builder(this).build().apply {
         setVideoSurfaceView(adPlayerView); playWhenReady = false
         addListener(object : Player.Listener {
             override fun onPlaybackStateChanged(state: Int) {
                 if (state != Player.STATE_ENDED) return
                 endAdBreak()                         // playlist drained = break over
             }
         })
     }
     flowerAdView.adsManager.addListener(flowerAdsManagerListener)
     flowerAdView.adsManager.enterChannel(
         channel.adTagUrl, channel.id,
         mapOf("serviceId" to packageName, "os" to "Android", "adId" to advertisingId),
         AdPlayerAdapter(adPlayer),                // typed as your MediaPlayerAdapter class
         null,                                     // adTagHeaders
     )
     player.setMediaItem(MediaItem.fromUri(channel.streamUrl)); player.prepare(); player.playWhenReady = true

5) At an ad marker (values from the SCTE-35 splice event)
     val adFlow = flowerAdView.adsManager.requestChannelAd(
         transactionId,      // Long, same for the same cue; the Splice Event ID is recommended
         cueDurationMs,      // Long, breakDuration (90 kHz) converted to ms
         uniqueProgramId,    // Int
         timeoutMs,          // Long, time until the marker (minus ~1 s)
     )
     adRequestJob?.cancel()
     var first = true
     adRequestJob = uiScope.launch {
         adFlow.catch { /* no ad / timeout: keep the channel */ }.collect { ad ->
             val creative = ad.creatives
                 .filter { it.url.contains(".m3u8") || it.url.contains(".mpd") }
                 .ifEmpty { ad.creatives }
                 .minByOrNull { abs(it.height - adPlayerView.height) } ?: return@collect
             adPlayer.addMediaItem(MediaItem.fromUri(creative.url))  // URL unchanged
             if (first) { first = false; adPlayer.prepare() }
         }
     }

6) At the marker time: start the break
     adPlayerView.visibility = View.VISIBLE
     flowerAdView.visibility = View.VISIBLE
     adPlayer.playWhenReady = true
     player.volume = 0f
     flowerAdView.adsManager.play()          // tells the SDK the break started

7) endAdBreak(): hide adPlayerView and flowerAdView, adPlayer.clearMediaItems(),
   player.volume = 1f. Listener onCompleted() may also be used to restore the channel.
   onError() (on the main thread): cancel the open ad request job, remove the listener,
   adsManager.stop(), stop/release the ad player and the channel player, then enter the channel
   again the same way it was first started (step 4: a new ad player, enterChannel(), the listener,
   and the channel stream). A break cut short by stop() may still report onCompleted()
   afterwards, so keep onCompleted() idempotent. Optionally give up after a few
   consecutive restarts (e.g., 3) to avoid a restart loop.

8) Leaving the channel
     player.release(); adPlayer.release(); uiScope.cancel()
     flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
     flowerAdView.adsManager.stop()

========================================
RULES
========================================
DO
- Use each creative URL exactly as received (its query identifies the ad for tracking).
- Call adsManager.play() when the break starts; show FlowerAdView during the break only.
- Keep appending ads that arrive after the break started.
DO NOT
- Do not call changeChannelUrl() in this flow.
- Do not try to add a channel pre-roll here; enterChannel() does not support one.
- Do not report a cumulative position across ads in getCurrentMedia().
- Do not reuse a transactionId for a different cue.

========================================
VERIFY
========================================
- Ads play on the ad player at the marker; impression/quartile tracking follows each ad.
- Skip / learn more appear on FlowerAdView during the break.
- No ad / timeout: the channel keeps playing; no ad view shown.
- Late-arriving ads are appended and played in the same break.
- SDK error (onError()): the ads manager and both players stop, and the channel is entered again.
- Leaving the channel cancels an open request without crashes.

========================================
OUTPUT
========================================
- Full code: Activity, MediaPlayerAdapter implementation, layout, Gradle/manifest changes.
```
