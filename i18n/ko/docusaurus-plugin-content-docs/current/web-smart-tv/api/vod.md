---
sidebar_position: 2
sidebar_label: VOD
---

# VOD

## 메소드

### FlowerAdsManager.requestVodAd

VOD 콘텐츠 진입 전 사용하는 함수입니다.

다음은 전달 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| contentId | string | 콘텐츠의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| durationMs | number | VOD 콘텐츠의 전체 재생 시간(밀리세컨즈) |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _null_) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| requestTimeout | number | (Optional) VOD 광고 요청 타임아웃(밀리세컨즈). 기본값은 5000입니다. |
| minPrepareDuration | number | (Optional) 광고 준비를 위한 사전 시간(밀리세컨즈). Mid-roll 광고는 Mid-roll 위치보다 `requestTimeout + minPrepareDuration`만큼 먼저 요청되며, `onPrepare`는 본편이 해당 위치에 도달했을 때 호출됩니다. 기본값은 5000입니다. |
| rewindDuration | number | (Optional) Mid-roll 광고 구간 종료 시 콘텐츠를 되감는 시간(밀리세컨즈). 본편은 중단된 위치보다 이 시간만큼 앞에서 재개됩니다. 기본값은 5000입니다. |

`requestTimeout`, `minPrepareDuration`, `rewindDuration`은 마지막에 추가로 전달할 수 있는 선택 매개변수입니다. 생략하거나 `null`을 전달하면 기본값이 적용되므로, 기존의 6개 인자 호출도 그대로 동작합니다.

```javascript
flowerAdView.adsManager.requestVodAd(
    'https://ad_request',
    '100',
    3600000,
    null,
    mediaPlayerHook,
    null,
    5000,   // requestTimeout
    5000,   // minPrepareDuration
    5000    // rewindDuration
);
```

### FlowerAdsManager.stop

VOD 콘텐츠를 나갈 때 사용하는 API입니다. 매개변수는 없습니다.

### FlowerAdsManager.pause

VOD 콘텐츠를 정지할 때 사용하는 API입니다. 매개변수는 없습니다.

### FlowerAdsManager.resume

VOD 콘텐츠를 재개할 때 사용하는 API입니다. 매개변수는 없습니다.

## 동작 흐름

1. '광고 UI 선언'을 참고하여 적절한 위치에 대체 광고를 삽입합니다.
2. 광고 재생 중 별도 처리가 필요한 경우 _FlowerAdsManagerListener_ 인터페이스를 구현하면 광고 재생 또는 종료에 대한 이벤트를 수신할 수 있습니다.
3. 마지막으로 _FlowerAdsManager_._requestVodAd_를 통해 VOD 콘텐츠 ID 및 duration 정보를 플레이어에 전달합니다.

```javascript
// TODO GUIDE: request vod ad
// arg0: adTagUrl, url from flower system.
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: contentId, unique content id in your service
// arg2: durationMs, duration of vod content in milliseconds
// arg3: extraParams, values you can provide for targeting
// arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
// arg5: adTagHeaders, (Optional) values included in headers for ad request
flowerAdView.adsManager.requestVodAd(
    'https://ad_request',
    '100',
    3600000,
    null,
    mediaPlayerHook,
    new Map([['custom-ad-header', 'custom-ad-header-value']])
);
```
