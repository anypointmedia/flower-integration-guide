---
sidebar_position: 1
sidebar_label: 확장 HLS.js 사용
---

# 확장 HLS.js 사용

Flower SDK는 HLS.js를 사용하는 서비스를 대상으로 광고를 삽입할 수 있는 FlowerHls 래퍼 클래스를 제공합니다. 따라서 기존 HLS.js와 호환성을 유지하며 최소한의 변경을 통해 광고를 적용할 수 있게 합니다.

이러한 래퍼 플레이어를 사용하면 광고 삽입을 수동으로 제어하는 것보다 편리하며, 통합 과정을 단순화합니다. 또한 이러한 플레이어를 서브클래싱하여 추가 커스터마이징이 가능합니다. 다만 메소드를 오버라이드할 때는 **올바른 동작을 보장하기 위해 반드시 슈퍼클래스 구현을 호출해야** 합니다.

## 작업 순서

![](/img/docs/59f47f41-6cf3-4f9e-a2bf-79ce46a14172.png)
![](/img/docs/3a3ca3ac-838e-408f-a35f-59b2e256a564.png)
1. 기존에 HLS.js를 사용하던 코드에서 HLS 인스턴스 생성을 FlowerHls로 교체합니다.
2. 사전에 발급받은 Tag URL등 적절한 값으로 광고 정보 객체를 생성합니다. 이 때 사용하는 객체는 아래와 같습니다.
    1. 실시간 채널 / FAST의 경우: `{ adTagUrl, channelId, extraParams, ... }`
3. 스트림을 로드하기 전, `setAdConfig()` API를 사용하여 광고 정보를 전달합니다.

    참고: 이 단계는 광고를 활성화하기 위해 필수입니다.

4. 필요한 경우 광고 이벤트 리스너를 등록합니다. 광고 이벤트 리스너는 FlowerAdsManagerListener 객체를 구현하여 생성할 수 있습니다.
5. 스트림을 로드하고 재생합니다.

아래는 예제 코드에서 사용된 Flower SDK의 API입니다.

## FlowerHls

기존 HLS.js 클래스를 확장하여 Flower 백엔드 시스템과 연동을 통해 광고를 적용할 수 있는 래퍼 클래스입니다.

### FlowerHls.attachContainer

HLS 플레이어를 DOM 컨테이너에 연결합니다. 이 메소드는 내부적으로 video 엘리먼트를 생성하고 HLS.js의 attachMedia를 호출합니다.

다음은 매개변수에 대한 설명입니다.

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| container | HTMLElement | 비디오 플레이어가 삽입될 DOM 컨테이너 |

### FlowerHls.setAdConfig

플레이어에 광고 정보를 설정합니다. 광고를 적용하기 위해서는 스트림을 로드하기 전에 이 메소드를 호출하여 광고 정보를 설정해야 합니다.

다음은 매개변수에 대한 설명입니다.

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| config | FlowerLinearTvAdConfig | 광고 삽입을 위해 필요한 정보 |
| config.adTagUrl | string | Flower 백엔드 시스템에서 발급된 광고 태그 URL |
| config.prerollAdTagUrl | string | (Optional) Flower 백엔드 시스템에서 발급된 프리롤용 광고 태그 URL |
| config.channelId | string | 채널의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| config.extraParams | map | (Optional) 타겟팅을 위해 사전 협의된 추가 정보 |
| config.adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| config.channelStreamHeaders | map | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |

### FlowerHls.addAdListener

플레이어에 광고 이벤트 리스너를 추가합니다. 이미 등록된 리스너일 경우 아무 일도 일어나지 않습니다.

다음은 매개변수에 대한 설명입니다.

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| listener | FlowerAdsManagerListener | 추가할 광고 이벤트 리스너 |

### FlowerHls.removeAdListener

플레이어에서 광고 이벤트 리스너를 제거합니다. 등록되지 않은 리스너일 경우 아무 일도 일어나지 않습니다.

다음은 매개변수에 대한 설명입니다.

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| listener | FlowerAdsManagerListener | 제거할 광고 이벤트 리스너 |

## 광고 이벤트 수신 – FlowerAdsManagerListener

> **실시간 채널에 광고를 삽입하는 경우**, 광고 마커(예: SCTE-35)를 통해 본 스트림을 대체하는 광고가 재생됩니다. 광고 재생 시작/종료 시점에 **UI 제어 등의 로직이 필요할 수 있습니다.** 이를 위해 Flower SDK는 **광고 이벤트를 수신하는 리스너 객체**를 제공하며, 아래와 같이 구현할 수 있습니다.

```javascript
const adsManagerListener = {
    onPrepare(adDurationMs) {
        // TODO GUIDE: need nothing for linear tv
    },

    onPlay() {
        // OPTIONAL GUIDE: enable additional actions for ad playback
        hidePlayerControls();
    },

    onCompleted() {
        // OPTIONAL GUIDE: disable additional actions after ad complete
        showPlayerControls();
    },

    onError(error) {
        // TODO GUIDE: restart to play Linear TV on ad error
        releasePlayer();
        playLinearTv();
    },

    onAdSkipped(reason) {
        console.log(`onAdSkipped: ${reason}`);
    }
};
// FlowerHls에 리스너를 등록합니다
hls.addAdListener(adsManagerListener);
```

## 실시간 채널 광고 요청 예시

### _Plain HTML/JavaScript_
```javascript
// Initialize SDK
FlowerSdk.init();
FlowerSdk.setLogLevel('Debug');

let hls = null;
let adsManagerListener = null;

function initHls() {
    // TODO GUIDE: Replace your HLS.js with FlowerHls
    hls = new FlowerHls();
    hls.attachContainer(document.getElementById('video-container'));

    hls.on(Hls.Events.MANIFEST_PARSED, function() {
        hls.media.play();
    });
}

function playLinearTv() {
    const videoUrl = 'https://video_url';

    // TODO GUIDE: Configure linear tv ad
    // adTagUrl: url from flower system
    //       You must file a request to Anypoint Media to receive a adTagUrl.
    // prerollAdTagUrl: (Optional) url for linear tv preroll ads from flower system
    //       You must file a request to Anypoint Media to receive a prerollAdTagUrl.
    // channelId: unique channel id in your service
    // extraParams: (Optional) values you can provide for targeting
    // adTagHeaders: (Optional) values included in headers for ad request
    // channelStreamHeaders: (Optional) values included in headers for channel stream request
    const adConfig = {
        adTagUrl: 'https://ad_request',
        prerollAdTagUrl: 'https://preroll_ad_request',
        channelId: '1',
        extraParams: {
            title: 'My Summer Vacation',
            genre: 'horror',
            contentRating: 'PG-13'
        },
        adTagHeaders: {
            'custom-ad-header': 'custom-ad-header-value'
        },
        channelStreamHeaders: {
            'custom-stream-header': 'custom-stream-header-value'
        }
    };

    // TODO GUIDE: FlowerAdConfig should be delivered before calling loadSource()
    hls.setAdConfig(adConfig);

    // OPTIONAL GUIDE: Implement FlowerAdsManagerListener to receive ad events
    adsManagerListener = {
        onPrepare(adDurationMs) {
            // OPTIONAL GUIDE: Implement custom actions for when the ad playback is prepared
        },
        onPlay() {
            // OPTIONAL GUIDE: Implement custom actions for when the ad playback starts
            hidePlayerControls();
        },
        onCompleted() {
            // OPTIONAL GUIDE: Implement custom actions for when the ad playback ends
            showPlayerControls();
        },
        onError(error) {
            // OPTIONAL GUIDE: Implement custom actions for when the error occurs in Flower SDK
        },
        onAdSkipped(reason) {
            // OPTIONAL GUIDE: Implement custom actions for when the ad playback is skipped
        }
    };

    // OPTIONAL GUIDE: Register FlowerAdsManagerListener to receive ad events
    hls.addAdListener(adsManagerListener);

    hls.loadSource(videoUrl);
}

function stopPlayback() {
    hls.removeAdListener(adsManagerListener);
    hls.stopLoad();
    hls.destroy();
}

// Initialize and start playback
initHls();
playLinearTv();
```
