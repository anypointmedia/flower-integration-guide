---
sidebar_position: 3
sidebar_label: 전면 광고
---

# 전면 광고

## 메소드

### FlowerAdsManager.requestAd

전면 광고를 삽입하기 위해 사용하는 API입니다.

다음은 전달 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _null_) |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |

### FlowerAdsManager.stop

광고 재생을 완료하기 위해 사용하는 API입니다. 매개변수는 없습니다.

## 동작 흐름

1. '광고 UI 선언'을 참고하여 적절한 위치에 대체 광고를 삽입합니다. 전면 광고의 경우 원본 콘텐츠를 덮도록 UI를 선언합니다.
2. '광고 이벤트 수신 인터페이스 구현'을 참고하여 _FlowerAdsManagerListener_ 인터페이스를 구현합니다.
3. 마지막으로 _FlowerAdsManager_._requestAd_를 통해 광고를 요청합니다.

```javascript
// TODO GUIDE: request ad
// arg0: adTagUrl, url from flower system
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: extraParams, values you can provide for targeting
// arg2: adTagHeaders, (Optional) values included in headers for ad request
flowerAdView.adsManager.requestAd(
    'https://ad_request',
    new Map(),
    new Map([['custom-ad-header', 'custom-ad-header-value']])
);
```
