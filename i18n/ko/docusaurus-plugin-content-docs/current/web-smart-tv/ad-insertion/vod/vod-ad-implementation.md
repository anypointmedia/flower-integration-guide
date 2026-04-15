---
sidebar_position: 1
sidebar_label: VOD Pre-roll, Mid-roll, Post-roll 광고 적용
---

# VOD Pre-roll, Mid-roll, Post-roll 광고 적용

본 가이드는 Flower SDK를 활용하여 VOD 콘텐츠에 광고를 삽입하는 전체 과정을 안내합니다. 광고 연동은 다음 순서에 따라 진행됩니다.
1. **Declare the Ad UI:** 광고 노출을 위한 `FlowerAdView`를 화면에 배치합니다.
2. **Implement Ad Event Reception:** 광고 재생 및 종료 시점의 로직 처리를 위해 `FlowerAdsManagerListener`를 구현합니다.
3. **Pass the Player:** SDK가 콘텐츠 재생 상태를 인식할 수 있도록 `MediaPlayerHook`를 구현하여 플레이어 정보를 전달합니다.
4. **Configure Additional Parameters (`extraParams`):** 광고 타겟팅에 필요한 추가 정보를 구성합니다.
5. **Request VOD Ads (`requestVodAd`):** 광고 태그 URL, 콘텐츠 ID 등의 정보를 전달하여 VOD 광고를 요청합니다.
6. **Control Playback State**: 콘텐츠 재생 흐름에 맞추어 SDK의 `pause()`, `resume()`, `stop()` 메소드를 호출합니다.

## Step-by-Step Details

### 1. Declare the Ad UI

> 광고 UI 선언은 광고 삽입 메뉴 > 광고 UI 선언 메뉴를 참고해주세요.

### 2. Receiving Ad Events – `FlowerAdsManagerListener`

> **VOD 콘텐츠에 광고를 삽입하는 경우**, 광고 재생 시점에 맞춰 본편을 일시정지하거나, 광고 종료 후 본편을 재개하는 등 **비즈니스 로직이 필요할 수 있습니다.** 이를 위해 Flower SDK는 **광고 이벤트를 수신하는 리스너 인터페이스**를 제공하며, 아래와 같이 구현할 수 있습니다.

```javascript
const adsManagerListener = {
    onPrepare(adDurationMs) {
        if (yourPlayer.paused === false) {
            // OPTIONAL GUIDE: additional actions before ad playback
            showNotification("Ads will start in a moment.");
            setTimeout(() => {
                // TODO GUIDE: play midroll ad
                flowerAdView.adsManager.play();
            }, 5000);
        } else {
            // TODO GUIDE: play preroll ad
            flowerAdView.adsManager.play();
        }
    },

    onPlay() {
        // TODO GUIDE: pause VOD content
        yourPlayer.pause();
    },

    onCompleted() {
        // TODO GUIDE: resume VOD content after ad complete
        if (!isContentEnd) {
            yourPlayer.play();
        }
    },

    onError(error) {
        // TODO GUIDE: resume VOD content on ad error
        if (!isContentEnd) {
            yourPlayer.play();
        }
    },

    onAdSkipped(reason) {
        console.log(`onAdSkipped: ${reason}`);
    }
};
flowerAdView.adsManager.addListener(adsManagerListener);
```

### 3. Passing the Player – `MediaPlayerHook`

> 광고 추적을 위해 재생 상태에 따른 현재 플레이어 인스턴스를 SDK에 전달해야 합니다.
> `MediaPlayerHook` 인터페이스를 구현하여 Flower SDK가 재생 상태 및 타이밍 정보에 접근할 수 있도록 합니다.

#### Supported Players

*   HLS.js
*   Video.js
*   Bitmovin Player

위 플레이어들은 `MediaPlayerHook` 인터페이스를 구현하여 SDK에 현재 플레이어를 전달합니다.

#### When Using Unsupported Players

지원되지 않는 플레이어를 사용하는 경우 [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의해주세요.

### 4. Additional Parameters for Ad Requests – `extraParams`

> Flower SDK를 사용하여 광고를 요청하는 시점에 추가적인 매개변수를 전달하면, SDK에서 가장 적합한 광고를 제공하는데 도움이 됩니다. 웹 앱의 경우 SDK 스스로 광고 제공 컨텍스트를 판단할 수 없으므로, 광고 요청 시 이러한 매개변수를 SDK에 반드시 전달해주어야 합니다.

#### Parameter List

| Key<br/>(\* indicates required for web apps) | Value | Example |
| ---| ---| --- |
| serviceId\* | 앱의 패키지 이름 | "tv.anypoint.service" |
| os\* | 앱이 실행되는 기기의 OS | "Web" |
| adId\* | 앱이 실행되는 기기의 광고 식별자 | 웹: 사용자 식별자 또는 세션 ID |

### 5. VOD Ad API Call – `requestVodAd(...)`

#### FlowerAdsManager.requestVodAd()

VOD 콘텐츠 진입 전 광고를 요청하는 데 사용하는 함수입니다.

다음은 전달 매개변수에 대한 설명입니다.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| contentId | string | 콘텐츠의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| durationMs | number | VOD 콘텐츠의 전체 재생 시간(ms) |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _null_) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |

#### FlowerAdsManager.notifyContentEnded()

VOD 콘텐츠 재생이 끝났을 때 이 API를 호출합니다. 포스트롤 광고 로딩을 트리거합니다. 매개변수는 없습니다.

```javascript
videoElement.addEventListener('ended', () => {
    isContentEnd = true;
    flowerAdView.adsManager.notifyContentEnded();
});
```

#### FlowerAdsManager.stop()

VOD 콘텐츠를 나갈 때 사용하는 API입니다. 매개변수는 없습니다.

#### FlowerAdsManager.pause()

VOD 콘텐츠를 정지할 때 사용하는 API입니다. 매개변수는 없습니다.

#### FlowerAdsManager.resume()

VOD 콘텐츠를 재개할 때 사용하는 API입니다. 매개변수는 없습니다.

## VOD Ad Request Example

### _HLS.js_

```javascript
function playVod() {
    const player = new Hls();
    const videoElement = document.querySelector('video');
    player.attachMedia(videoElement);

    // TODO GUIDE: Create MediaPlayerHook
    const mediaPlayerHook = {
        getPlayer() {
            return player;
        }
    };

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
        { 'custom-param': 'custom-param-value' },
        mediaPlayerHook,
        { 'custom-ad-header': 'custom-ad-header-value' }
    );

    player.loadSource('https://vod_content_url');
    player.on(Hls.Events.MANIFEST_PARSED, function() {
        videoElement.play();
    });
}

// TODO GUIDE: stop SDK when exiting VOD
function onVodExit() {
    flowerAdView.adsManager.stop();
}
```
