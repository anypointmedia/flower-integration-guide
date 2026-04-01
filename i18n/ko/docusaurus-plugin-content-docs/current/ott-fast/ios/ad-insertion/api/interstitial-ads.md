---
sidebar_position: 3
sidebar_label: "전면 광고"
---

# 전면 광고

## Methods

### FlowerAdsManager.requestAd

전면 광고를 삽입하기 위해 사용하는 함수입니다. 매개변수는 아래와 같습니다.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 null) |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |

### FlowerAdsManager.stop

광고 재생을 종료하는 메서드입니다. 매개변수는 없습니다.

## 작업 순서

1. '광고 UI 선언'을 참고하여 적절한 위치에 대체 광고를 삽입합니다. 전면 광고의 경우 AdView가 전체 화면을 덮도록 합니다.
2. '광고 이벤트 수신 인터페이스 구현'을 참고하여 _FlowerAdsManagerListener_ 인터페이스를 구현합니다.
3. 마지막으로 _FlowerAdsManager_._requestAd_를 통해 광고를 요청합니다.

```swift
// TODO GUIDE: request ad
// arg0: adTagUrl, url from flower system
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: extraParams, values you can provide for targeting
// arg2: adTagHeaders, (Optional) values included in headers for ad request
flowerAdView.adsManager.requestAd(
    adTagUrl: "https://ad_request",
    extraParams: [String: String](),
    adTagHeaders: ["custom-ad-header": "custom-ad-header-value"]
);
```
