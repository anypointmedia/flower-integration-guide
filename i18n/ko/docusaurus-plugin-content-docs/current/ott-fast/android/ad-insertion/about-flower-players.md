---
sidebar_position: 2
---

# Flower Player 소개

Flower SDK는 널리 사용되는 미디어 플레이어를 확장한 다양한 Flower Player를 제공하며, **실시간/리니어 광고 마커 또는 VOD 콘텐츠에 대한 광고 삽입을 간소화**하도록 설계되었습니다. 두 클래스 모두 기존 플레이어 클래스와의 호환성을 유지하며 최소한의 변경으로 광고 구현을 가능하게 합니다.

Flower Player를 사용하면 수동으로 광고 삽입을 제어하는 것보다 더 편리하게 정합할 수 있습니다. 또한 이 플레이어들을 서브클래싱하여 추가 커스터마이징이 가능합니다. 단, 메소드를 오버라이드할 때는 **반드시 상위 클래스의 구현을 호출**해야 올바르게 동작합니다.

Flower Player의 기본 사용법은 다음과 같습니다.
1. 기존 플레이어를 Flower Player로 교체합니다.
    *   예: ExoPlayer2 → FlowerExoPlayer2
2. 사전 발급받은 Tag URL 등 적절한 값으로 광고 설정 객체를 생성합니다. 사용하는 클래스는 다음과 같습니다:
    *   실시간 채널 / FAST의 경우: FlowerLinearTvAdConfig
    *   VOD 콘텐츠의 경우: FlowerVodAdConfig
3. 본 콘텐츠를 로드할 때, 마지막 매개변수에 광고 설정 객체를 플레이어에 전달합니다.
    *   예: player.setMediaItem(mediaItem) 대신 player.setMediaItem(mediaItem, flowerAdConfig)

    참고: 이 단계는 광고를 활성화하기 위해 필수입니다.

4. 필요한 경우 광고 이벤트 리스너를 플레이어에 등록합니다. 광고 이벤트 리스너는 FlowerAdsManagerListener 인터페이스를 구현하여 생성할 수 있습니다.
5. 재생을 시작합니다.

## 지원 플레이어

*   [ExoPlayer(FlowerExoPlayer2)](api/flower-exo-player2)
*   [Media3 ExoPlayer(FlowerMedia3ExoPlayer)](api/flower-media3-exo-player)
*   [Bitmovin Player(FlowerBitmovinPlayer)](api/flower-bitmovin-player)

## 예시

아래는 ExoPlayer 기반으로 Linear TV 광고 설정을 구성하고 콘텐츠를 재생하는 예시입니다.

```kotlin
val exoPlayer = ExoPlayer.Builder(context).build()
val player = FlowerExoPlayer2(exoPlayer, context)

val mediaItem = MediaItem.fromUri("https://video_url")
val adConfig = FlowerLinearTvAdConfig(
    adTagUrl = "https://ad_request",
    prerollAdTagUrl = "https://preroll_ad_request",
    channelId = "1",
    extraParams = mapOf(
        "title" to "My Summer Vacation",
        "genre" to "horror",
        "contentRating" to "PG-13"
    ),
    adTagHeaders = mapOf(
        "custom-ad-header" to "custom-ad-header-value"
    ),
    channelStreamHeaders = mapOf(
        "custom-stream-header" to "custom-stream-header-value"
    ),
)

player.setMediaItem(mediaItem, adConfig) // Overloaded method
player.prepare()
player.play()
```

## 관련 API

*   [FlowerAdConfig](api/flower-ad-config)
*   [FlowerExoPlayer2](api/flower-exo-player2)
*   [FlowerMedia3ExoPlayer](api/flower-media3-exo-player)
*   [FlowerBitmovinPlayer](api/flower-bitmovin-player)
*   [FlowerAdsManagerListener](api/flower-ads-manager-listener)
