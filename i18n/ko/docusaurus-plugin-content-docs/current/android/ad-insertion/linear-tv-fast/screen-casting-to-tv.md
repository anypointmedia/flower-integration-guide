---
sidebar_position: 4
---

# 외부 화면 송출 (Screen Casting To TV)

Android 환경에서 실시간 TV 스트림에 대체 광고를 삽입할 때, Flower SDK는 내부적으로 **Proxy Server**를 구동하여 원본 manifest(m3u8/mpd)를 실시간으로 가공합니다. 이로 인해 `changeChannelUrl()`이 반환하는 URL은 원본 CDN 주소가 아니라 앱 내부 Proxy Server를 가리키는 **LoopBack(루프백) 주소**입니다.

LoopBack 주소는 해당 URL을 생성한 기기 내부에서만 접근 가능합니다. 이 URL을 다른 화면(예: Chromecast, AirPlay, Smart TV 등 외부 TV)으로 그대로 전달하면 외부 화면에서 주소를 해석할 수 없어 재생이 실패합니다.

:::caution 외부 화면 송출은 지원하지 않습니다
앱 내부 Proxy Server에서 송출 가능한 URL을 제공하려면, 송출이 진행되는 동안 해당 Proxy Server(즉 앱)를 **백그라운드 서비스**로 계속 유지해야 합니다. 이러한 백그라운드 서비스를 안정적으로 유지하는 것은 어렵기 때문에, 광고가 대체된 스트림을 외부 화면으로 송출하는 것은 안정적이지 않아 **지원하지 않습니다.**

외부 화면(Chromecast, AirPlay, Smart TV 등)으로 송출해야 하는 경우에는 다음과 같이 처리하세요.

1. `FlowerAdsManager.stop()`을 호출하여 Proxy Server를 종료하고 광고 대체를 중단합니다.
2. 외부 화면에는 **원본 스트림 URL**(`changeChannelUrl()`이 반환한 LoopBack URL이 아닌 원본 CDN URL)을 송출합니다.

이 경우 스트림은 Proxy Server를 거치지 않고 원본 CDN에서 직접 재생되므로, 외부 화면에서는 광고 대체가 적용되지 않습니다.
:::

## 예시

```kotlin
// 송출 시 재사용할 수 있도록 원본 스트림 URL을 보관합니다.
private val originalStreamUrl = "https://XXX"

private fun playLinearTv() {
    // TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
    val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        originalStreamUrl,
        "https://ad_request",
        "100",
        mapOf("custom-param" to "custom-param-value"),
        mediaPlayerHook,
        mapOf("custom-ad-header" to "custom-ad-header-value"),
        mapOf("custom-stream-header" to "custom-stream-header-value"),
        null
    )

    // TODO GUIDE: 로컬 플레이어에는 LoopBack URL을 그대로 사용
    player.setMediaItem(MediaItem.fromUri(changedChannelUrl))
    player.prepare()
    player.play()
}

// TODO GUIDE: 외부 화면(예: TV)으로 송출할 때는 SDK를 중지하고
// LoopBack URL이 아닌 원본 스트림 URL을 송출합니다.
fun startCastingToTv() {
    // Proxy Server를 종료합니다. 이후로는 광고 대체가 적용되지 않습니다.
    flowerAdView.adsManager.stop()

    // 원본 스트림 URL을 송출합니다. (changeChannelUrl()이 반환한 URL이 아님)
    castSession.loadMedia(originalStreamUrl)
}
```

## 사용 시점

| 상황 | 사용할 URL |
| ---| --- |
| 앱 내부 로컬 재생 | `changeChannelUrl()`이 반환한 URL |
| 외부 화면으로 송출 (Chromecast, AirPlay 수신기, Smart TV 등) | `FlowerAdsManager.stop()` 호출 후 원본 스트림 URL |
