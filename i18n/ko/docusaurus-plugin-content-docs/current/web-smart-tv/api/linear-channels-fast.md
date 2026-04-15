---
sidebar_position: 1
sidebar_label: 실시간 채널 / FAST
---

# 실시간 채널 / FAST

## 메소드

### FlowerAdsManager.changeChannelUrl

실시간 방송의 스트림 URL을 변경할 때 사용하는 함수입니다.

다음은 전달 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| videoUrl | string | 원본 재생 URL |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| channelId | string | 채널의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _null_) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | map | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |
| prerollAdTagUrl | string | (Optional) 광고 서버에서 발급된 프리롤용 광고 태그 URL |

### FlowerAdsManager.changeChannelExtraParams

추가 타겟팅 정보인 extraParams를 실시간 방송 도중에 변경할 때 사용하는 함수입니다.

다음은 전달 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보 |

### FlowerAdsManager.stop

실시간 방송을 중단할 때 사용하는 API입니다. 매개변수는 없습니다.

## 동작 흐름

1. '광고 UI 선언'을 참고하여 적절한 위치에 대체 광고를 삽입합니다.
2. 광고 재생 중 별도 처리가 필요한 경우 _FlowerAdsManagerListener_ 인터페이스를 구현하면 광고 재생 또는 종료에 대한 이벤트를 수신할 수 있습니다.
3. 마지막으로 _FlowerAdsManager_._changeChannelUrl_을 통해 원본 스트리밍 URL을 변경한 후 플레이어에 전달합니다.
4. (선택) 스트림 도중 타겟팅 정보가 변경되었다면 FlowerAdsManager.changeChannelExtraParams을 통해 새로운 타겟팅 정보를 SDK에 전달합니다.

```javascript
// TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
// arg0: videoUrl, original LinearTV stream url
// arg1: adTagUrl, url from flower system
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg2: channelId, unique channel id in your service
// arg3: extraParams, values you can provide for targeting
// arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
// arg5: adTagHeaders, (Optional) values included in headers for ad request
// arg6: channelStreamHeaders, (Optional) values included in headers for channel stream request
const changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
    'https://XXX',
    'https://ad_request',
    '100',
    null,
    mediaPlayerHook,
    new Map([['custom-ad-header', 'custom-ad-header-value']]),
    new Map([['custom-stream-header', 'custom-stream-header-value']]),
    'https://preroll_ad_request'
);
player.loadAndPlay(changedChannelUrl)
...
// TODO GUIDE: change extraParams during stream playback
function onStreamProgramChanged(targetingInfo) {
    flowerAdView.adsManager.changeChannelExtraParams(new Map([ [ 'myTargetingKey', targetingInfo ] ]));
}
```
