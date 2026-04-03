---
sidebar_position: 1
---

# 실시간 채널 / FAST

## 메소드

### FlowerAdsManager.changeChannelUrl

실시간 방송의 스트림 URL을 동적으로 변경할 수 있는 함수입니다. 매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| videoUrl | string | 원본 재생 URL |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| channelId | string | 채널 ID<br/>채널 ID는 FLOWER 백엔드 시스템에 등록되어야 합니다 |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 null) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | map | (Optional) 원본 미디어 스트림 요청 시 추가할 HTTP 헤더 정보 |
| prerollAdTagUrl | string | (Optional) 프리롤 광고를 위한 광고 서버 발급 광고 태그 URL |

### FlowerAdsManager.changeChannelExtraParams

추가 타겟팅 정보인 extraParams를 실시간 방송 도중에 변경할 수 있는 함수입니다. 매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| extraParams | map | 사전 협의된 추가 타겟팅 정보 |

### FlowerAdsManager.stop

실시간 채널 재생을 중지하는 메소드입니다. 매개변수는 없습니다.

## 작업 순서

1. "광고 UI 선언"을 참고하여 적절한 타이밍에 대체 광고를 삽입합니다.
2. 광고 재생 중 추가 처리가 필요한 경우 _FlowerAdsManagerListener_ 인터페이스를 구현하여 광고 재생 또는 종료에 해당하는 이벤트를 수신할 수 있습니다.
3. 마지막으로 _FlowerAdsManager_._changeChannelUrl_을 사용하여 원본 스트리밍 URL을 변경한 후 플레이어에 전달합니다.
4. (Optional) 스트리밍 중 타겟팅 정보가 변경되는 경우 FlowerAdsManager.changeChannelExtraParams를 사용하여 SDK에 새로운 정보를 업데이트합니다.

### _Java_
```java
private void playLinearTv() {
    // TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
    // arg0: videoUrl, original LinearTV stream url
    // arg1: adTagUrl, url from flower system
    //       You must file a request to Anypoint Media to receive a adTagUrl.
    // arg2: channelId, unique channel id in your service
    // arg3: extraParams, values you can provide for targeting
    // arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
    // arg5: adTagHeaders, (Optional) values included in headers for ad request
    // arg6: channelStreamHeaders, (Optional) values included in headers for channel stream request
    String changedChannelUrl = flowerAdView.getAdsManager().changeChannelUrl(
        "https://XXX",
        "https://ad_request",
        "100",
        createMap("custom-param", "custom-param-value"),
        mediaPlayerHook,
        createMap("custom-ad-header", "custom-ad-header-value"),
        createMap("custom-stream-header", "custom-stream-header-value"),
        "https://ad_request?target=preroll"
    );
    player.setMediaItem(MediaItem.fromUri(changedChannelUrl));
}

// TODO GUIDE: change extraParams during stream playback
public void onStreamProgramChanged(String targetingInfo) {
    flowerAdView.getAdsManager().changeChannelExtraParams(createMap("myTargetingKey", targetingInfo));
}

private Map<String, String> createMap(String key, String value) {
    Map<String, String> map = new HashMap<>();
    map.put(key, value);
    return map;
}
```

### _Kotlin_
```kotlin
private fun playLinearTv() {
    // TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
    // arg0: videoUrl, original LinearTV stream url
    // arg1: adTagUrl, url from flower system
    //       You must file a request to Anypoint Media to receive a adTagUrl.
    // arg2: channelId, unique channel id in your service
    // arg3: extraParams, values you can provide for targeting
    // arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
    // arg5: adTagHeaders, (Optional) values included in headers for ad request
    // arg6: channelStreamHeaders, (Optional) values included in headers for channel stream request
    val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        "https://XXX",
        "https://ad_request",
        "100",
        mapOf("custom-param" to "custom-param-value"),
        mediaPlayerHook,
        mapOf("custom-ad-header" to "custom-ad-header-value"),
        mapOf("custom-stream-header" to "custom-stream-header-value"),
        "https://preroll_ad_request"
    )
    player.setMediaItem(MediaItem.fromUri(changedChannelUrl))
}

// TODO GUIDE: change extraParams during stream playback
fun onStreamProgramChanged(targetingInfo: String) {
    flowerAdView.adsManager.changeChannelExtraParams(mapOf("myTargetingKey" to targetingInfo))
}
```
