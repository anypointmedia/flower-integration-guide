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
| prerollAdTagUrl | string | (Optional) 광고 서버에서 발급된 프리롤용 광고 태그 URL. 설정하면 SDK가 스트림 전에 채널 프리롤을 재생합니다. [프리롤 광고](#프리롤-광고) 참고 |

#### 프리롤 광고

`prerollAdTagUrl`을 설정해도 `changeChannelUrl()`은 스트림 URL을 바로 반환하며, 프리롤은 백그라운드에서 요청됩니다. SDK는 플레이어 위에 SDK 자체 video 요소로 프리롤을 재생하는 동안 플레이어를 일시정지하고, 프리롤이 끝나면 `onCompleted()`를 호출한 뒤 플레이어 재생을 재개합니다. 프리롤 광고가 없거나 프리롤이 실패한 경우에도 `onCompleted()`를 호출하며, 실패한 프리롤은 `onError()`로 알리지 않습니다.

그때까지 스트림을 기다리게 하세요. 반환된 URL을 저장해 두고 임시 리스너의 첫 `onCompleted()`(또는 `onError()`)에서 로드한 뒤, 원래 리스너를 다시 등록합니다. `changeChannelUrl()`을 호출할 때마다 대기 중인 프리롤을 포함한 이전 세션이 중지되고 새 채널의 프리롤을 요청합니다. 채널 변경 없이 `changeChannelUrl()`을 다시 호출하면 `prerollAdTagUrl`을 전달하더라도 프리롤을 생략하며, SDK는 `changeChannelUrl()`이 반환된 직후 `onCompleted()`를 호출합니다. 따라서 `onError()` 후 재시작할 때도 같은 `prerollAdTagUrl`을 전달하고 같은 방식으로 스트림을 기다리게 합니다. 전체 흐름과 예시는 [플레이어 수동 제어](../ad-insertion/linear-tv-fast/manual-player-control.md#프리롤-광고)를 참고하세요.

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
// arg7: prerollAdTagUrl, (Optional) ad tag URL for the channel pre-roll; null for no pre-roll
const changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
    'https://XXX',
    'https://ad_request',
    '100',
    null,
    mediaPlayerHook,
    new Map([['custom-ad-header', 'custom-ad-header-value']]),
    new Map([['custom-stream-header', 'custom-stream-header-value']]),
    null
);
// Without a pre-roll, load and play the returned URL right away.
// With prerollAdTagUrl, load it only after the pre-roll ends (see Pre-roll Ads above).
player.loadAndPlay(changedChannelUrl)
...
// TODO GUIDE: change extraParams during stream playback
function onStreamProgramChanged(targetingInfo) {
    flowerAdView.adsManager.changeChannelExtraParams(new Map([ [ 'myTargetingKey', targetingInfo ] ]));
}
```
