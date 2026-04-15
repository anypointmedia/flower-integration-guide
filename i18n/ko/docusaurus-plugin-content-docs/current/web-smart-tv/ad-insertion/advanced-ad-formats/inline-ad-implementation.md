---
sidebar_position: 1
sidebar_label: 인라인 광고 적용
---

# 인라인 광고 적용

본 가이드는 Flower SDK를 사용하여 웹페이지 내 콘텐츠 영역에 인라인 광고를 삽입하는 전체 과정을 안내합니다. 광고 연동은 다음 단계를 따릅니다:
1. **광고 UI 선언:** 광고 노출을 위한 `FlowerAdView`를 화면에 배치합니다.
2. **광고 이벤트 수신 구현:** 광고 재생 및 종료 시점의 로직 처리를 위해 `FlowerAdsManagerListener`를 구현합니다.
3. **추가 파라미터 구성 (`extraParams`):** 광고 타겟팅에 필요한 추가 정보를 구성합니다.
4. **인라인 광고 요청 (`requestAd`):** 광고 태그 URL 등의 정보를 전달하여 인라인 광고를 요청합니다.
5. **리소스 정리:** 광고 종료 후 `stop()` 및 `removeListener()`를 호출해 리소스를 정리합니다.

## 단계별 상세 설명

### 1. 광고 UI 선언

> 광고 UI 선언은 광고 삽입 메뉴 > 광고 UI 선언 메뉴를 참고하세요.

### 2. 광고 이벤트 수신 – `FlowerAdsManagerListener`

> 인라인 광고를 삽입할 때 광고 시작 및 종료 시점에 맞춰 처리할 수 있도록, SDK는 광고 이벤트 수신 인터페이스 `FlowerAdsManagerListener`를 제공합니다. 아래는 구현 예시입니다.

```javascript
const adsManagerListener = {
    onPrepare(adDurationMs) {
        flowerAdView.adsManager.play();
    },
    onPlay() {
        // TODO GUIDE: need nothing for interstitial ad
    },
    onCompleted() {
        // TODO GUIDE: stop FlowerAdsManager
        flowerAdView.adsManager.stop();
        flowerAdView.adsManager.removeListener(adsManagerListener);
    },
    onError(error) {
        // TODO GUIDE: stop FlowerAdsManager
        flowerAdView.adsManager.stop();
        flowerAdView.adsManager.removeListener(adsManagerListener);
    }
};
flowerAdView.adsManager.addListener(adsManagerListener);
```

### 3. 광고 요청 추가 파라미터 – `extraParams`

> Flower SDK를 사용하여 광고를 요청하는 시점에 추가적인 매개변수를 전달하면, SDK에서 가장 적합한 광고를 제공하는데 도움이 됩니다. 웹 앱의 경우 SDK 스스로 광고 제공 컨텍스트를 판단할 수 없으므로, 광고 요청 시 이러한 매개변수를 SDK에 반드시 전달해야 합니다.

#### 파라미터 목록

| Key<br/>(\* indicates required for web apps) | Value | Example |
| ---| ---| --- |
| serviceId\* | 앱의 패키지 이름 | "tv.anypoint.service" |
| os\* | 앱이 실행되는 기기의 OS | "Web" |
| adId\* | 앱이 실행되는 기기의 광고 식별자 | 웹: 사용자 식별자 또는 세션 ID |

### 4. 인라인 광고 API

#### FlowerAdsManager.requestAd()

인라인 광고를 요청하는 데 사용하는 함수입니다. 다음은 전달 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 빈 map) |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |

#### FlowerAdsManager.stop()

인라인 광고를 종료할 때 사용하는 API입니다. 매개변수는 없습니다.

## 인라인 광고 요청 예시

### _Plain HTML/JavaScript_

```javascript
// Initialize SDK
FlowerSdk.init();
FlowerSdk.setLogLevel('Debug');

// Get FlowerAdView instance
const flowerAdView = document.getElementById('flower-ad-view');

// TODO GUIDE: Implement FlowerAdsManagerListener
const adsManagerListener = {
    onPrepare(adDurationMs) {
        flowerAdView.adsManager.play();
    },
    onPlay() {
        // OPTIONAL GUIDE: Implement custom actions for when the ad playback starts
    },
    onCompleted() {
        // TODO GUIDE: stop FlowerAdsManager
        flowerAdView.adsManager.stop();
        flowerAdView.adsManager.removeListener(adsManagerListener);
    },
    onError(error) {
        console.error('Error from Flower SDK: ', error);
        // TODO GUIDE: stop FlowerAdsManager
        flowerAdView.adsManager.stop();
        flowerAdView.adsManager.removeListener(adsManagerListener);
    }
};

// Register listener
flowerAdView.adsManager.addListener(adsManagerListener);

// TODO GUIDE: request inline ad
// arg0: adTagUrl, url from flower system.
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: extraParams, values you can provide for targeting
// arg2: adTagHeaders, (Optional) values included in headers for ad request
flowerAdView.adsManager.requestAd(
    'https://ad_request',
    { 'custom-param': 'custom-param-value' },
    { 'custom-ad-header': 'custom-ad-header-value' }
);
```
