---
sidebar_position: 2
sidebar_label: 플레이어 수동 제어
---

# 플레이어 수동 제어

본 가이드는 Flower SDK를 활용하여 실시간 채널(Linear TV) 및 FAST 스트림에 광고를 삽입하는 전체 과정을 안내합니다. 광고 연동은 다음 순서에 따라 진행됩니다.
1. **Declare the Ad UI:** 광고 노출을 위한 `FlowerAdView`를 화면에 배치합니다.
2. **Implement Ad Event Reception:** 광고 재생 및 종료 시점의 로직 처리를 위해 `FlowerAdsManagerListener`를 구현합니다.
3. **Pass the Player:** SDK가 콘텐츠 재생 상태를 인식할 수 있도록 `MediaPlayerHook`를 구현하여 플레이어 정보를 전달합니다.
4. **Configure Additional Parameters (`extraParams`):** 광고 타겟팅에 필요한 추가 정보를 구성합니다.
5. **Change Linear Channel URL (`changeChannelUrl`):** 광고 태그 URL, 채널 ID 등의 정보를 전달하여 스트림 URL을 변경합니다.
6. **Update Parameters During Playback:** 스트림 재생 중 `changeChannelExtraParams()`를 통해 타겟팅 정보를 업데이트합니다.

## Step-by-Step Details

### 1. Declare the Ad UI

> 광고 UI 선언은 광고 삽입 메뉴 > 광고 UI 선언 메뉴를 참고해주세요.

### 2. Receiving Ad Events – `FlowerAdsManagerListener`

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
flowerAdView.adsManager.addListener(adsManagerListener);
```

### 3. Passing the Player – `MediaPlayerHook`

> 실시간 채널의 경우 본 콘텐츠를 재생하는 플레이어를 SDK에 전달해야 합니다.

#### Supported Players

*   HLS.js
*   Video.js
*   Bitmovin Player

위 플레이어들은 `MediaPlayerHook` 인터페이스를 구현하여 SDK에 현재 플레이어를 전달합니다.

#### When Using Unsupported Players

지원되지 않는 플레이어를 사용하는 경우 [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의해주세요.

### 4. Additional Parameters for Ad Requests – `extraParams`

> Flower SDK를 사용하여 광고를 요청하는 시점에 추가적인 매개변수를 전달하면, SDK에서 가장 적합한 광고를 제공하는데 도움이 됩니다. 웹 앱의 경우 SDK가 스스로 광고 제공 컨텍스트를 판단할 수 없으므로, 광고 요청 시 이러한 매개변수를 SDK에 반드시 전달해주어야 합니다.

#### Parameter List

| Key<br/>(\* indicates required for web apps) | Value | Example |
| ---| ---| --- |
| serviceId\* | 앱의 패키지 이름 | "tv.anypoint.service" |
| os\* | 앱이 실행되는 기기의 OS | "Web" |
| adId\* | 앱이 실행되는 기기의 광고 식별자 | 웹: 사용자 식별자 또는 세션 ID |

### 5. Linear Channel Ad API Call – `changeChannelUrl(...)`

#### FlowerAdsManager.changeChannelUrl()

실시간 방송의 스트림 URL을 변경할 때 사용하는 함수입니다. 다음은 전달 매개변수에 대한 설명입니다.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | string | 원본 재생 URL |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| channelId | string | 채널의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _null_) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | map | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |
| prerollAdTagUrl | string | (Optional) 광고 서버에서 발급된 프리롤용 광고 태그 URL |

#### FlowerAdsManager.changeChannelExtraParams()

추가 타겟팅 정보인 extraParams를 실시간 방송 도중에 변경할 때 사용하는 함수입니다. 다음은 전달 매개변수에 대한 설명입니다.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보 |

#### FlowerAdsManager.stop()

실시간 방송을 중단할 때 사용하는 API입니다. 매개변수는 없습니다.

## Linear Channel Ad Request Example

### _HLS.js_
```javascript
function playLinearTv() {
    const player = new Hls();
    const videoElement = document.querySelector('video');
    player.attachMedia(videoElement);

    // TODO GUIDE: Create MediaPlayerHook
    const mediaPlayerHook = {
        getPlayer() {
            return player;
        }
    };

    // TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
    // arg0: videoUrl, original LinearTV stream url
    // arg1: adTagUrl, url from flower system
    //       You must file a request to Anypoint Media to receive a adTagUrl.
    // arg2: channelId, unique channel id in your service
    // arg3: extraParams, values you can provide for targeting
    // arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
    // arg5: adTagHeaders, (Optional) values included in headers for ad request
    // arg6: channelStreamHeaders, (Optional) values included in headers for channel stream request
    // arg7: prerollAdTagUrl, (Optional) ad tag URL for pre-roll ads
    const changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        'https://XXX',
        'https://ad_request',
        '100',
        { 'custom-param': 'custom-param-value' },
        mediaPlayerHook,
        { 'custom-ad-header': 'custom-ad-header-value' },
        { 'custom-stream-header': 'custom-stream-header-value' },
        'https://ad_request?target=preroll'
    );

    player.loadSource(changedChannelUrl);
    player.on(Hls.Events.MANIFEST_PARSED, function() {
        videoElement.play();
    });
}

// TODO GUIDE: change extraParams during stream playback
function onStreamProgramChanged(targetingInfo) {
    flowerAdView.adsManager.changeChannelExtraParams({ myTargetingKey: targetingInfo });
}
```

## Using MediaPlayerAdapter

지원되지 않는 플레이어를 사용하는 경우, `MediaPlayerAdapter` 인터페이스를 구현하여 플레이어를 직접 제어할 수 있습니다.

`MediaPlayerHook`과 함께 `changeChannelUrl()`을 사용하는 대신, `MediaPlayerAdapter` 구현과 함께 `enterChannel()` API를 사용합니다.

### FlowerAdsManager.enterChannel(...)

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| channelId | string | 채널의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _null_) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| mediaPlayerAdapter | MediaPlayerAdapter | MediaPlayerAdapter 인터페이스 구현 객체 |

### MediaPlayerAdapter Interface

`MediaPlayerAdapter` 인터페이스는 다음 메소드를 구현해야 합니다.

| **Method** | **Return Type** | **Description** |
| ---| ---| --- |
| getCurrentMedia() | Media | 현재 재생 중인 미디어(urlOrId, duration, position)를 반환합니다 |
| getVolume() | number | 오디오 볼륨 레벨(0.0~1.0)을 반환합니다 |
| isPlaying() | boolean | 플레이어가 현재 재생 중인지 여부를 반환합니다 |
| getHeight() | number | 비디오 높이(픽셀)를 반환합니다 (알 수 없는 경우 0) |
| pause() | void | 재생을 일시정지합니다 |
| stop() | void | 재생을 중지하고 리소스를 해제합니다 |
| resume() | void | 재생을 재개합니다 |
| enqueuePlayItem(playItem) | void | 새 재생 항목을 큐에 추가합니다 |
| removePlayItem(playItem) | void | 큐에서 재생 항목을 제거합니다 |
| playNextItem() | void | 큐의 다음 미디어 항목으로 이동합니다 |
| seekToPosition(...) | void | 지정된 위치로 이동합니다 |
| getCurrentAbsoluteTime(isPrintDetails) | number \| null | 현재 절대 재생 시간(ms)을 반환합니다 |
| getPlayerType() | string \| null | 플레이어 유형 식별자를 반환합니다 (Google PAL SDK용) |
| getPlayerVersion() | string \| null | 플레이어 버전 문자열을 반환합니다 (Google PAL SDK용) |

### Example

```javascript
class MyPlayerAdapter {
    constructor(player) {
        this.player = player;
    }

    getCurrentMedia() {
        return new Media(
            this.player.currentSource || '',
            Math.round(this.player.duration * 1000),
            Math.round(this.player.currentTime * 1000)
        );
    }

    getVolume() {
        return this.player.volume;
    }

    isPlaying() {
        return !this.player.paused;
    }

    getHeight() {
        return this.player.videoHeight || 0;
    }

    pause() {
        this.player.pause();
    }

    stop() {
        this.player.pause();
        this.player.currentTime = 0;
    }

    resume() {
        this.player.play();
    }

    enqueuePlayItem(playItem) {
        this.player.enqueue(playItem.url);
    }

    removePlayItem(playItem) {
        this.player.removeFromQueue(playItem.url);
    }

    playNextItem() {
        this.player.skipToNext();
    }

    seekToPosition(absoluteStartTimeMs, relativeStartTimeMs, offsetMs, windowDurationMs, periodIndex) {
        if (offsetMs != null) {
            this.player.currentTime = offsetMs / 1000;
        }
    }

    getCurrentAbsoluteTime(isPrintDetails) {
        return this.player.currentTime * 1000;
    }

    getPlayerType() {
        return 'CustomPlayer';
    }

    getPlayerVersion() {
        return '1.0.0';
    }
}

// Usage
const adapter = new MyPlayerAdapter(myCustomPlayer);
const mediaPlayerHook = {
    getPlayer() {
        return myCustomPlayer;
    }
};

flowerAdView.adsManager.enterChannel(
    'https://ad_request',
    '100',
    { 'custom-param': 'custom-param-value' },
    mediaPlayerHook,
    { 'custom-ad-header': 'custom-ad-header-value' },
    adapter
);
```
