---
sidebar_position: 4
---

# 외부 화면 송출 (Screen Casting To TV)

Android 환경에서 실시간 TV 스트림에 대체 광고를 삽입할 때, Flower SDK는 내부적으로 **Proxy Server**를 구동하여 원본 manifest(m3u8/mpd)를 실시간으로 가공합니다. 이로 인해 `changeChannelUrl()`이 반환하는 URL은 원본 CDN 주소가 아니라 앱 내부 Proxy Server를 가리키는 **LoopBack(루프백) 주소**입니다.

LoopBack 주소는 해당 URL을 생성한 기기 내부에서만 접근 가능합니다. 이 URL을 다른 화면(예: Chromecast, AirPlay, Smart TV 등 외부 TV)으로 그대로 전달하면 외부 화면에서 주소를 해석할 수 없어 재생이 실패합니다.

이러한 외부 화면 송출(Screen Casting) 시나리오에서는 `FlowerAdsManager.getScreenCastingUrl()`을 사용하여 외부 화면에서도 재생 가능한 URL을 받아 사용해야 합니다.

## FlowerAdsManager.getScreenCastingUrl

외부 화면 송출에 사용 가능한 스트림 URL을 반환합니다.

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| _(없음)_ |  |  |

| **반환값** | **유형** | **설명** |
| ---| ---| --- |
| screenCastingUrl | string | 외부 화면에서 재생 가능한 URL.<br/>송출용 URL을 생성할 수 없는 경우 원본 스트림 URL을 반환합니다.<br/>`changeChannelUrl()` 호출 이전에 호출된 경우에는 빈 문자열(`""`)을 반환합니다. |

:::note 사용 조건
- `getScreenCastingUrl()`은 반드시 `changeChannelUrl()`을 **호출한 이후에** 호출해야 합니다. 그 이전에 호출하면 Proxy Server가 아직 초기화되지 않았기 때문에 빈 문자열(`""`)이 반환됩니다.
- 내부 오류가 발생한 경우 SDK는 원본 스트림 URL을 그대로 반환하므로 호출 자체는 항상 안전하지만, 이 경우 외부 화면에서는 광고 대체가 적용되지 않습니다.
:::

:::caution 송출 중에는 SDK를 중지하지 마세요
외부 화면 송출은 원본 스트림을 실시간으로 재작성하는 **본 기기의 광고 SDK(Proxy Server)** 를 통해 수행됩니다. 따라서 송출이 진행되는 동안에는 다음을 반드시 지켜야 합니다.

- **`FlowerAdsManager.stop()`을 호출하지 마세요.** SDK를 중지하면 Proxy Server가 종료되어 외부 화면에서 광고 대체가 중단되고 재생이 실패할 수 있습니다.
- **앱이 백그라운드로 전환되더라도 SDK가 계속 동작하도록 백그라운드 실행을 설정하세요.** 사용자가 앱을 이탈하더라도 송출이 유지되어야 합니다.

즉, **사용자가 명시적으로 송출을 중지하기 전까지는** SDK를 백그라운드에서 활성 상태로 유지해야 한다는 점이 중요합니다.
:::

## 예시

```kotlin
private fun playLinearTv() {
    // TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
    val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        "https://XXX",
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

// TODO GUIDE: 외부 화면(예: TV)으로 송출할 때는 getScreenCastingUrl을 사용
fun startCastingToTv() {
    // 반드시 changeChannelUrl() 이후에 호출해야 합니다.
    // 오류 시 원본 스트림 URL을 반환하므로 호출 자체는 항상 안전합니다.
    val castingUrl = flowerAdView.adsManager.getScreenCastingUrl()

    castSession.loadMedia(castingUrl)
}
```

## 사용 시점

| 상황 | 사용할 URL |
| ---| --- |
| 앱 내부 로컬 재생 | `changeChannelUrl()`이 반환한 URL |
| 외부 화면으로 송출 (Chromecast, AirPlay 수신기, Smart TV 등) | `getScreenCastingUrl()`이 반환한 URL |
