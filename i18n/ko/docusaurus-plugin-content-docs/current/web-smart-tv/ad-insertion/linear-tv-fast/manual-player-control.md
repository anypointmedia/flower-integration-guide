---
sidebar_position: 2
sidebar_label: 플레이어 수동 제어
---

# 플레이어 수동 제어

본 가이드는 Flower SDK를 사용하여 실시간 TV 채널 및 FAST 스트림에 광고를 삽입하는 전체 과정을 안내합니다. 광고 연동은 다음 단계를 따릅니다:
1. **광고 UI 선언:** 광고를 표시하기 위해 화면에 `FlowerAdView`를 배치합니다.
2. **광고 이벤트 수신 구현:** 광고 재생 및 완료 시점의 로직 처리를 위해 `FlowerAdsManagerListener`를 구현합니다.
3. **플레이어 전달:** SDK가 콘텐츠 재생 상태를 인식할 수 있도록 `MediaPlayerHook`을 구현하여 플레이어 정보를 전달합니다.
4. **추가 파라미터 설정 (`extraParams`):** 광고 타겟팅에 필요한 추가 정보를 구성합니다.
5. **실시간 채널 URL 변경 (`changeChannelUrl`):** 광고 태그 URL, 채널 ID 등의 정보를 전달하여 스트림 URL을 변경합니다.
6. **재생 중 파라미터 업데이트:** 스트림 재생 중 `changeChannelExtraParams()`를 통해 타겟팅 정보를 업데이트합니다.

## 단계별 상세 설명

### 1. 광고 UI 선언

> 광고 UI 선언은 광고 삽입 메뉴 > 광고 UI 선언 섹션을 참고하세요.

### 2. 광고 이벤트 수신 -- `FlowerAdsManagerListener`

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
        // TODO GUIDE: on error, stop the ads manager, release the player, and restart the channel
        // (Optional) Count restarts and stop retrying after a few attempts so a broken channel does not loop.
        flowerAdView.adsManager.stop();
        releasePlayer(); // e.g. hls.destroy() for HLS.js, player.unload() for Bitmovin
        // Start the channel exactly as the first time, prerollAdTagUrl included.
        playLinearTv();  // new changeChannelUrl() -> load the returned URL -> play
    },

    onAdBreakSkipped(reason) {
        console.log(`onAdBreakSkipped: ${reason}`);
    }
};
flowerAdView.adsManager.addListener(adsManagerListener);
```

:::info `onError()` 발생 시 복구
`onError()`가 호출되면 `flowerAdView.adsManager.stop()`으로 광고 매니저를 중지하고 플레이어를 해제한 뒤 채널을 다시 시작합니다. 즉 `changeChannelUrl()`을 다시 호출하고, 반환된 URL을 로드해 재생합니다. 에러 이전에 반환받은 URL은 재사용하지 마세요. `prerollAdTagUrl`을 포함해 처음 시작할 때와 똑같은 매개변수를 전달하고, 반환된 URL도 처음 시작할 때와 같은 방식으로 처리하세요. 시청자가 프리롤을 다시 보게 되지는 않습니다. [프리롤 광고](#프리롤-광고)를 참고하세요.

본편 재생이 중단되었고 SDK가 이를 복구할 수 없으면, `playback unrecoverable`로 시작하는 메시지와 함께 `onError()`가 호출됩니다. 같은 방법으로 채널을 다시 시작하세요.

`stop()`은 진행 중인 광고 브레이크를 종료하며, SDK는 재시작이 시작된 뒤에도 해당 브레이크의 `onCompleted()`를 호출할 수 있습니다. `onCompleted()`에서는 플레이어 컨트롤 표시와 같은 UI 작업만 하고 재생 시작이나 재로드는 하지 마세요. 그래야 이 늦은 호출로 재시작이 한 번 더 일어나지 않습니다.
:::

### 3. 플레이어 전달 -- `MediaPlayerHook`

> 실시간 채널의 경우 본 콘텐츠를 재생하는 플레이어를 SDK에 전달해야 합니다.

#### 지원 플레이어

*   HLS.js
*   Bitmovin Player
*   dash.js
*   Shaka Player

위 플레이어들은 `MediaPlayerHook` 인터페이스를 구현하여 SDK에 현재 플레이어를 전달합니다.

#### 미지원 플레이어 사용 시

지원되지 않는 플레이어를 사용하는 경우 [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의해주세요.

### 4. 광고 요청 시 추가 파라미터 -- `extraParams`

> Flower SDK를 사용하여 광고를 요청할 때 추가 매개변수를 전달하면, SDK가 가장 적합한 광고를 제공하는 데 도움이 됩니다. 웹 앱의 경우 SDK가 자체적으로 광고 제공 컨텍스트를 판단할 수 없으므로, 광고 요청 시 이러한 매개변수를 SDK에 반드시 전달해야 합니다.

#### 파라미터 목록

| 키<br/>(\* 표시는 웹 앱 필수) | 값 | 예시 |
| ---| ---| --- |
| serviceId\* | 앱의 패키지 이름 | "tv.anypoint.service" |
| os\* | 앱이 실행되는 기기의 OS | "Web" |
| adId\* | 앱이 실행되는 기기의 광고 식별자 | 웹: 사용자 식별자 또는 세션 ID |

### 5. 실시간 채널 광고 API 호출 -- `changeChannelUrl(...)`

#### FlowerAdsManager.changeChannelUrl()

실시간 방송의 스트림 URL을 변경할 때 사용하는 함수입니다. 다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| videoUrl | string | 원본 재생 URL |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| channelId | string | 고유 채널 ID<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _null_) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | map | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |
| prerollAdTagUrl | string | (Optional) 프리롤용 광고 서버 발급 광고 태그 URL |

#### FlowerAdsManager.changeChannelExtraParams()

추가 타겟팅 정보인 extraParams를 실시간 방송 도중에 변경할 때 사용하는 함수입니다. 다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보 |

#### FlowerAdsManager.stop()

실시간 방송을 중단할 때 사용하는 API입니다. 매개변수는 없습니다.

## 프리롤 광고

채널 프리롤은 시청자가 채널에 진입할 때 채널 스트림이 시작되기 전에 한 번 재생되는 광고입니다. 광고 마커 위치에서 스트림을 대체하는 실시간 광고와는 별개입니다.

**사용 방법:** Anypoint Media에서 발급받은 프리롤 광고 태그 URL을 `changeChannelUrl()`의 `prerollAdTagUrl` 인자로 전달합니다. 프리롤을 사용하지 않으려면 `null`을 전달하거나 생략합니다. FlowerHls를 사용하는 경우에는 `FlowerLinearTvAdConfig`의 `prerollAdTagUrl`을 설정합니다. [확장 HLS.js 사용](./using-extended-hlsjs.md#프리롤-광고)을 참고하세요. `MediaPlayerAdapter`와 함께 사용하는 `enterChannel()`에는 프리롤 매개변수가 없습니다.

**재생 흐름:**

1. `changeChannelUrl()`은 스트림 URL을 바로 반환하고, SDK는 백그라운드에서 프리롤을 요청합니다.
2. 프리롤이 준비되면 SDK는 `onPrepare()`를 호출하고, 플레이어 위에 SDK 자체 video 요소로 프리롤을 재생하면서 플레이어를 일시정지한 뒤 `onPlay()`를 호출합니다.
3. 프리롤이 끝나면 SDK는 `onCompleted()`를 호출하고 플레이어 재생을 재개합니다.

**스트림 대기:** `prerollAdTagUrl`을 설정한 경우 반환된 URL을 바로 로드하지 마세요. URL을 저장해 두고, 기존 `FlowerAdsManagerListener`를 제거한 뒤 임시 리스너를 등록합니다. 임시 리스너의 첫 `onCompleted()`(또는 `onError()`)에서 저장한 URL을 로드해 재생하고, 임시 리스너를 제거한 뒤 원래 리스너를 다시 등록합니다. 이렇게 하면 프리롤 전에 스트림 영상이 잠깐 비치거나 광고와 스트림이 동시에 로딩되는 것을 막을 수 있습니다. `prerollAdTagUrl`을 설정하지 않은 경우에는 반환된 URL을 로드하고 바로 `play()`를 호출합니다. 두 경우 모두 [아래 예시](#실시간-채널-광고-요청-예시)에서 확인할 수 있습니다.

**광고 없음과 실패:** 프리롤 광고가 없거나, 광고 요청이 실패하거나, 프리롤 재생에 실패한 경우에도 SDK는 `onCompleted()`를 호출합니다. 실패한 프리롤은 `onError()`로 알리지 않으므로 스트림은 항상 시작됩니다. 임시 리스너의 `onError()`는 스트림 재생을 시작하고 원래 리스너를 복원하기만 합니다. 여기서 `stop()`을 호출하지 마세요. 이 시점에는 아직 중지할 채널 스트림이나 실시간 광고 브레이크가 없기 때문입니다.

**`onError()` 후 재시작:** 재시작에서도 `prerollAdTagUrl`을 포함해 처음 시작할 때와 같은 매개변수를 전달하고 같은 방식으로 스트림을 대기시킵니다. 프리롤은 다시 표시되지 않습니다. 채널 변경이 없으면 프리롤을 생략하며(`stop()` 후에도 마찬가지), SDK는 `changeChannelUrl()`이 반환된 직후 `onCompleted()`를 호출하므로, 임시 리스너의 `onCompleted()`가 바로 스트림을 시작합니다.

**채널 전환:** 채널을 처음 시작할 때와 다른 채널로 전환할 때는 설정한 대로 프리롤을 사용합니다. 다음 채널에 대한 `changeChannelUrl()` 호출은 진행 중인 프리롤을 포함해 현재 세션을 중지하고, 새 채널의 프리롤을 요청합니다. 다른 채널을 거쳐 돌아오면(A → B → A) A의 프리롤이 다시 재생됩니다. 이렇게 중지된 프리롤은 임시 리스너를 호출하지 않으므로, 예시처럼 새 호출 전에 이전 임시 리스너를 제거하고 원래 리스너를 다시 등록하세요. 시청자가 채널 화면을 떠날 때도 `stop()` 전에 임시 리스너를 제거합니다.

**PIP:** 기본 설정(`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`)에서는 사용자가 앱을 떠나면 프리롤이 일시정지되고, 앱으로 돌아오면 재개됩니다. VOD 광고와 같은 동작입니다. [PIP 모드 지원](../../getting-started/pip-mode-support.md)을 참고하세요.

## 실시간 채널 광고 요청 예시

### _HLS.js_
```javascript
let prerollListener = null;  // 채널 프리롤이 끝나기를 기다리는 동안의 임시 리스너

// 채널을 처음 시작할 때, 채널을 전환할 때, onError() 후 재시작할 때 모두 사용합니다
function playLinearTv() {
    // 채널을 전환하면 대기 중인 프리롤은 리스너 호출 없이 중지됩니다.
    // 임시 리스너를 제거하고 원래 리스너를 복원합니다.
    if (prerollListener) {
        flowerAdView.adsManager.removeListener(prerollListener);
        flowerAdView.adsManager.addListener(adsManagerListener);
        prerollListener = null;
    }

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
    // (Optional) Set to null if pre-roll ads are not needed
    const prerollAdTagUrl = 'https://ad_request?target=preroll';

    const changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        'https://XXX',
        'https://ad_request',
        '100',
        { 'custom-param': 'custom-param-value' },
        mediaPlayerHook,
        { 'custom-ad-header': 'custom-ad-header-value' },
        { 'custom-stream-header': 'custom-stream-header-value' },
        prerollAdTagUrl
    );

    if (prerollAdTagUrl == null) {
        // prerollAdTagUrl이 없으면 반환된 URL을 바로 로드하고 재생을 시작합니다.
        player.loadSource(changedChannelUrl);
        player.on(Hls.Events.MANIFEST_PARSED, function() {
            videoElement.play();
        });
    } else {
        // prerollAdTagUrl이 있으면 기존 리스너를 제거하고 임시 리스너를 등록합니다.
        // 프리롤 광고가 완료(onCompleted)된 시점에 스트림 URL을 로드하고 재생을 시작합니다.
        flowerAdView.adsManager.removeListener(adsManagerListener);

        prerollListener = {
            onPrepare(adDurationMs) {},
            onPlay() {},
            onCompleted() {
                // 프리롤 광고 완료 후 스트림 URL 로드 및 재생 시작
                // (프리롤 광고가 없거나 실패한 경우에도 호출됨)
                player.loadSource(changedChannelUrl);
                player.on(Hls.Events.MANIFEST_PARSED, function() {
                    videoElement.play();
                });

                // 임시 리스너를 제거하고 원래 리스너를 복원합니다.
                flowerAdView.adsManager.removeListener(prerollListener);
                flowerAdView.adsManager.addListener(adsManagerListener);
                prerollListener = null;
            },
            onError(error) {
                // 프리롤 광고 에러 시에도 스트림 재생 시작 및 리스너 복원
                player.loadSource(changedChannelUrl);
                player.on(Hls.Events.MANIFEST_PARSED, function() {
                    videoElement.play();
                });

                flowerAdView.adsManager.removeListener(prerollListener);
                flowerAdView.adsManager.addListener(adsManagerListener);
                prerollListener = null;
            },
            onAdBreakSkipped(reason) {}
        };
        flowerAdView.adsManager.addListener(prerollListener);
    }
}

// TODO GUIDE: change extraParams during stream playback
function onStreamProgramChanged(targetingInfo) {
    flowerAdView.adsManager.changeChannelExtraParams({ myTargetingKey: targetingInfo });
}
```

## MediaPlayerAdapter 사용

SDK가 공식적으로 지원하지 않는 플레이어를 사용하는 경우, `MediaPlayerAdapter` 인터페이스를 구현하여 플레이어를 직접 제어할 수 있습니다.

`MediaPlayerHook`과 함께 `changeChannelUrl()`을 사용하는 대신, `MediaPlayerAdapter` 구현과 함께 `enterChannel()` API를 사용합니다. `enterChannel()`에는 `prerollAdTagUrl` 매개변수가 없으므로 이 방식에서는 [채널 프리롤](#프리롤-광고)을 사용할 수 없습니다.

### FlowerAdsManager.enterChannel(...)

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| channelId | string | 고유 채널 ID<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _null_) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| mediaPlayerAdapter | MediaPlayerAdapter | MediaPlayerAdapter 인터페이스 구현 객체 |

### MediaPlayerAdapter 인터페이스

`MediaPlayerAdapter` 인터페이스에는 다음 메소드가 필요합니다:

| **메소드** | **반환 유형** | **설명** |
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
| getPlayerType() | string \| null | 플레이어 구현을 식별하는 문자열을 반환합니다. SDK가 플레이어별 동작을 적용하고 광고 요청에 포함하는 데 사용합니다. |
| getPlayerVersion() | string \| null | 플레이어 버전 문자열을 반환합니다. SDK가 광고 요청에 포함합니다. |

### 예시

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
