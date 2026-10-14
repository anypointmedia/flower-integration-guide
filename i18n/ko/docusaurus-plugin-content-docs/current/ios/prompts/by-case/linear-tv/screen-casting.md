---
sidebar_position: 5
sidebar_label: 화면 캐스팅
---

# Linear TV 광고와 화면 캐스팅

앱이 SDK를 통해 실시간 채널을 재생하면서(`changeChannelUrl(...)` 또는 `FlowerAVPlayer`) 다른 화면(AirPlay, Chromecast, 스마트 TV)으로 캐스팅도 할 수 있을 때 이 프롬프트를 사용하세요. SDK의 스트림 URL은 기기에서만 동작하는 루프백 주소이므로 이를 캐스팅하면 실패합니다. 프롬프트는 캐스팅 시 SDK를 중지하고 원본 스트림을 캐스팅하도록 수정합니다. [외부 화면 송출](../../../ad-insertion/linear-tv-fast/screen-casting-to-tv) 페이지를 참고하세요.

| 매개변수 | 값 | 설명 |
|----------|----|------|
| `INTEGRATION` | `media-player-hook` \| `flower-avplayer` | 현재 채널을 재생하는 방식 |

```plain
Our iOS app plays a live channel with FLOWER SDK ads and can cast to another screen. Make casting
work with the SDK. Modify the code I paste below.

========================================
GOAL
========================================

- Casting plays the channel on the external screen.
- Local playback with ads keeps working before casting and after casting ends.

========================================
PARAMETERS
========================================

INTEGRATION: {{INTEGRATION}}   (media-player-hook | flower-avplayer)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- The URL returned by changeChannelUrl(...) (and the URL FlowerAVPlayer plays internally) points
  to an in-app proxy server on the loopback address. Other devices cannot reach it.
- Keeping the proxy alive for a casting session would need the app as a background service, so
  casting the ad-replaced stream is not supported.
- To cast: stop the SDK (this shuts down the proxy) and cast the ORIGINAL stream URL. No ads are
  replaced on the external screen.

========================================
IMPLEMENTATION
========================================

1. Keep the original stream URL in a property (the URL before changeChannelUrl / the URL of the
   AVPlayerItem given to FlowerAVPlayer).

2. When casting starts:
   INTEGRATION media-player-hook:
     flowerAdView.adsManager.removeListener(adsManagerListener: listener)
     // also remove the temporary pre-roll listener if a pre-roll has not ended yet
     flowerAdView.adsManager.stop()
     player.pause()
   INTEGRATION flower-avplayer:
     player.pause()
     player.replaceCurrentItem(with: nil)   // stops the ads and the proxy
   Then hand originalStreamUrl to the cast session (for AirPlay with AVPlayer external playback,
   play AVPlayerItem(url: originalStreamUrl) in a plain AVPlayer, not the SDK URL).

3. When casting ends and the user returns to local playback, start the channel again exactly as
   at screen start (changeChannelUrl(...) and play the returned URL, or
   replaceCurrentItem(with:adConfig:) + play()).

========================================
RULES
========================================

DO:
- Always cast the original CDN URL.
- Restart the SDK flow from the beginning when local playback resumes.

DO NOT:
- Do NOT pass the changeChannelUrl(...) result, or FlowerAVPlayer's current item URL, to any
  cast/AirPlay/Chromecast API.
- Do NOT keep the SDK session running while casting.

========================================
VERIFY
========================================

- Start casting during the channel and during an ad: the external screen plays the channel.
- Stop casting: local playback restarts with ads.
- No playback error on the receiver about an unreachable 127.0.0.1 / localhost URL.

========================================
OUTPUT
========================================

- Modify the code I paste below; keep its structure and names.
- List every file you changed or added.
- Do not add code for other cases.

My code:
```
