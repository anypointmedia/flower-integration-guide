---
sidebar_position: 4
sidebar_label: Linear TV with a Custom Player
---

# Linear TV Ads with an Unsupported Player (MediaPlayerAdapter)

Use this prompt when the channel player is not one the SDK supports through `MediaPlayerHook` (ExoPlayer2, Media3 ExoPlayer, Bitmovin Player). The app implements the SDK's `MediaPlayerAdapter` for its player and passes it to the `changeChannelUrl()` overload; ads are still put into the stream by the SDK proxy. The LLM writes the adapter and the channel-entry code. Background: [Implement an Interface for Passing Video Player](../../../ad-insertion/implement-interface-video-player/index.md), [Direct Player Control](../../../ad-insertion/implement-interface-video-player/direct-player-control.md), [Manual Player Control](../../../ad-insertion/linear-tv-fast/manual-player-control.md).

The prompt generates Kotlin code. If your player is not supported, you can also contact the [Helpdesk](mailto:dev-support@anypointmedia.com).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `SDK_VERSION` | e.g., `2.9.29` | Flower SDK version provided to your project |
| `ENV` | `local` \| `dev` \| `prod` | Value passed to `FlowerSdk.setEnv()` |
| `PLAYER_NAME` | e.g., `MyPlayer 3.2` | Your player class and version (used for `getPlayerType()` / `getPlayerVersion()`) |

```plain
We are integrating the FLOWER SDK (Android) for Linear TV / FAST ads. Our player is not
supported by MediaPlayerHook, so we implement MediaPlayerAdapter. Modify the code I provide
(including our player's API). Generate Kotlin.

========================================
GOAL
========================================
Implement tv.anypoint.flower.android.sdk.api.MediaPlayerAdapter for our player and play each
channel through the URL returned by the changeChannelUrl() overload that takes the adapter.

========================================
PARAMETERS
========================================
SDK_VERSION: {{SDK_VERSION}}
ENV: {{ENV}}                   (local | dev | prod)
PLAYER_NAME: {{PLAYER_NAME}}

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- changeChannelUrl() returns a loopback URL of the in-app proxy, which puts ad segments in at
  the ad markers. The app plays that URL on its player.
- The SDK reads playback state and controls the player only through the adapter: position and
  URL (getCurrentMedia), playing state, volume, height, absolute time (live), and for skippable
  ads it queues / removes / skips play items and seeks.
- All adapter methods may be called from SDK worker threads.

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

2) FlowerAdView on top of the player view (match_parent, android:visibility="gone").

3) Adapter — exact Kotlin signatures (imports: tv.anypoint.flower.android.sdk.api.MediaPlayerAdapter,
   tv.anypoint.flower.sdk.core.api.Media / PlayItem / KotlinWrapped):
     class MyPlayerAdapter(private val player: MyPlayer) : MediaPlayerAdapter {
         override fun getCurrentMedia(): Media
             // Media(urlOrId: String, duration: Double, position: Double)
             // urlOrId: URL currently playing; duration: ms, -1.0 if unknown or live;
             // position: ms elapsed since the beginning of the FIRST loaded playlist
             //   (for live: first playlist length - last chunk length right after start if the
             //   player starts from the last chunk); -1.0 if unknown.
         override fun getVolume(): KotlinWrapped<Float>         // 0.0 - 1.0
         override fun isPlaying(): KotlinWrapped<Boolean>
         override fun getHeight(): KotlinWrapped<Int>           // video height px, 0 if unknown
         override fun pause()
         override fun stop()                                    // stop and clear the queue
         override fun resume()
         override fun enqueuePlayItem(playItem: PlayItem)       // queue playItem.url after the current item
         override fun removePlayItem(playItem: PlayItem)        // remove the queued item with that url
         override fun playNextItem()                            // skip to the next queued item
         override fun seekToPosition(
             absoluteStartTimeMs: KotlinWrapped<Double>?,
             relativeStartTimeMs: KotlinWrapped<Double>?,
             offsetMs: KotlinWrapped<Double>?,
             windowDurationMs: KotlinWrapped<Double>?,
             periodIndex: Int?,
         )                                                      // use whichever value the player supports
         override fun getCurrentAbsoluteTime(isPrintDetails: Boolean): KotlinWrapped<Double>
             // epoch ms of the current position (e.g. from EXT-X-PROGRAM-DATE-TIME), -1.0 if unknown
         override fun getPlayerType(): String?                  // e.g. "MyPlayer"
         override fun getPlayerVersion(): String?               // e.g. "3.2"
     }
   Getters must read the player state on the thread the player requires (e.g.
   runBlocking(Dispatchers.Main) { ... } for main-thread players); commands should post to that
   thread (CoroutineScope(Dispatchers.Main).launch { ... }).

4) Enter a channel
     val adapter: MediaPlayerAdapter = MyPlayerAdapter(player)
     val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
         channel.streamUrl,                // original stream URL
         channel.adTagUrl,                 // issued by Anypoint Media
         channel.id,                       // registered in the Flower backend
         mapOf("serviceId" to packageName, "os" to "Android", "adId" to advertisingId),
         adapter,                          // MediaPlayerAdapter overload
         null,                             // adTagHeaders
         null,                             // channelStreamHeaders
         prerollAdTagUrl,                  // String? - optional channel pre-roll, null for none; the same on a restart
     )
   Without a pre-roll: player.open(changedChannelUrl); player.play()     // your player's API
   With a pre-roll (an ad played once on channel entry, before the live stream): the SDK
   requests it and plays it in its own ad player. Do NOT open changedChannelUrl yet. Remove the
   main listener, register a temporary listener, and on its FIRST onCompleted() / onError() (on
   the main thread) open and play the URL, remove the temporary listener and add the main
   listener back. No pre-roll ad or a failed pre-roll is also reported as onCompleted(). The SDK
   calls the adapter's pause() when the pre-roll starts and resume() when it ends, before the URL
   is opened, so both must be safe on an empty player. Before the next changeChannelUrl() and
   before adsManager.stop(), remove a temporary listener that is still registered (a stopped
   pre-roll reports nothing) and add the main listener back.

5) Listener (onPlay / onCompleted for UI, onAdBreakSkipped, onError) registered with
   flowerAdView.adsManager.addListener(...); no adsManager.play() for linear TV.
   onError(): on the main thread, call flowerAdView.adsManager.stop(), stop your player, then
   enter the channel again as in step 4 (a NEW changeChannelUrl() call; do not reuse the old URL).
   Pass the same arguments as the first start, including prerollAdTagUrl, and handle the returned
   URL in the same way. The SDK remembers the channel (channelId) entered last: for that channel it
   skips the pre-roll and reports onCompleted() right after changeChannelUrl() returns, so the
   viewer does not see the pre-roll again. A break cut short by stop() may still report onCompleted() afterwards, so keep onCompleted()
   idempotent. Optionally give up after a few consecutive restarts (e.g., 3).

6) Cleanup: removeListener, flowerAdView.adsManager.stop(), release your player.

========================================
RULES
========================================
DO
- Return the real values; getCurrentMedia() accuracy decides when ads are inserted and tracked.
- Keep the adapter stateless apart from what the player needs (e.g., first-playlist offsets).
DO NOT
- Do not return Int/Long where the interface needs Double / KotlinWrapped.
- Do not block the main thread from a main-thread caller (avoid deadlocks with runBlocking).
- Do not use this adapter overload for VOD in this prompt; VOD uses requestVodAd().

========================================
VERIFY
========================================
- Channel plays from the loopback URL; ad breaks are replaced at the markers.
- Skippable ads: skip works (enqueuePlayItem / playNextItem / removePlayItem).
- Ad tracking events fire at the right time (position accuracy).
- Ad or stream error (onError()): the ads manager stops and the channel restarts from a new
  changeChannelUrl() URL.
- Leaving the channel stops the SDK without crashes.

========================================
OUTPUT
========================================
- The adapter class, the changed Activity, layout, and Gradle/manifest changes.
```
