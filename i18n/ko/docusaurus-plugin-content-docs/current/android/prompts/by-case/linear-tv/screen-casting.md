---
sidebar_position: 5
sidebar_label: 외부 화면 송출
---

# Linear TV 채널 외부 화면 송출 (Screen Casting)

앱이 Flower 광고와 함께 Linear 채널을 재생하면서, 사용자가 채널을 외부 화면(Chromecast, AirPlay 수신기, 스마트 TV)으로 송출할 수 있는 경우 이 프롬프트를 사용하세요. 로컬 플레이어가 재생하는 URL은 SDK 앱 내 프록시의 루프백 주소라 다른 기기에서 접근할 수 없으므로, 광고가 교체된 스트림의 송출은 지원하지 않습니다. LLM이 송출 시 SDK를 중지하고 원본 URL을 송출하도록, 그리고 송출이 끝나면 로컬 광고 재생을 복원하도록 코드를 수정합니다. 배경 설명: [외부 화면 송출 (Screen Casting To TV)](../../../ad-insertion/linear-tv-fast/screen-casting-to-tv.md).

이 프롬프트는 Kotlin 코드를 생성하며, 채널 연동이 이미 되어 있다고 가정합니다([앱의 플레이어로 Linear TV 광고](./media-player-hook.md) 또는 [Flower Player로 Linear TV 광고](./flower-player.md) 참고).

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `APPROACH` | `media-player-hook` \| `flower-player` | 현재 채널 연동 방식 |
| `PLAYER` | `media3` \| `exoplayer2` \| `bitmovin` | `flower-player`인 경우에만: 사용 중인 Flower Player |

```plain
Our Android app plays Linear TV channels with FLOWER SDK ad replacement and has a cast feature.
Make casting work correctly. Modify the code I provide. Generate Kotlin.

========================================
GOAL
========================================
When the user starts casting, stop the Flower SDK and cast the ORIGINAL stream URL. When the
user stops casting and watches locally again, restart local playback with ad replacement.

========================================
PARAMETERS
========================================
APPROACH: {{APPROACH}}   (media-player-hook | flower-player)
PLAYER: {{PLAYER}}       (media3 | exoplayer2 | bitmovin; flower-player only)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================
- changeChannelUrl() (called by the app, or internally by a Flower Player) returns a loopback URL
  served by an in-app proxy. Only this device can open it.
- Keeping the proxy alive for a cast session would need a reliable background service, which is
  not feasible, so casting the ad-replaced stream is NOT supported.
- FlowerAdsManager.stop() shuts the proxy down and ends ad replacement. Ads are not replaced on
  the external screen.

========================================
IMPLEMENTATION
========================================
1) Keep the original stream URL of the current channel in a member (originalStreamUrl). Never
   read the URL to cast from the player's current media item.

2) Start casting
   APPROACH = media-player-hook:
       player.stop()                          // local playback
       flowerAdView.adsManager.stop()         // shuts down the proxy
       <your cast code>.load(originalStreamUrl)
   APPROACH = flower-player:
       media3 / exoplayer2: player.stop()     // FlowerExoPlayer2 / FlowerMedia3ExoPlayer.stop()
                                              // also stops the SDK
       bitmovin:            player.unload(); player.flowerAdView.adsManager.stop()
                                              // FlowerBitmovinPlayer has no stop(); unload() goes
                                              // to the inner player only
       <your cast code>.load(originalStreamUrl)

3) Stop casting / back to local playback: enter the channel again exactly as on first entry
   (media-player-hook: call changeChannelUrl() again and play the NEW returned URL;
   flower-player: setMediaItem(mediaItem, adConfig) / load(sourceConfig, adConfig) again).
   Never reuse an old loopback URL.

4) Use your existing cast library (Cast SDK, MediaRouter, vendor SDK) unchanged; only the URL and
   the SDK stop/restart around it change.

========================================
RULES
========================================
DO
- Cast originalStreamUrl, after stopping the SDK.
- Restart ad replacement with a fresh changeChannelUrl() / Flower Player load when local
  playback resumes.
DO NOT
- Do not cast the URL returned by changeChannelUrl() (loopback, unreachable from the receiver).
- Do not keep the SDK running in the background for a cast session.
- Do not invent cast APIs; keep the app's cast code.

========================================
VERIFY
========================================
- Casting starts and the receiver plays the original stream.
- While casting, no Flower ad UI or ad playback happens locally.
- After casting stops, local playback resumes with ad replacement (ad breaks replaced again).

========================================
OUTPUT
========================================
- The changed casting and playback code, with a short list of the changes.
```
