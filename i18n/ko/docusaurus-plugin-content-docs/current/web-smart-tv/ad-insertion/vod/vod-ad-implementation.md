---
sidebar_position: 1
sidebar_label: VOD 프리롤, Mid-roll, Post-roll 광고 적용
---

# VOD 프리롤, Mid-roll, Post-roll 광고 적용

본 가이드는 Flower SDK를 사용하여 VOD 콘텐츠에 광고를 삽입하는 전체 과정을 안내합니다. 광고 연동은 다음 단계를 따릅니다:
1. **광고 UI 선언:** 광고 노출을 위한 `FlowerAdView`를 화면에 배치합니다.
2. **광고 이벤트 수신 구현:** 광고 재생 및 종료 시점의 로직 처리를 위해 `FlowerAdsManagerListener`를 구현합니다.
3. **플레이어 전달:** SDK가 콘텐츠 재생 상태를 인식할 수 있도록 `MediaPlayerHook`를 구현하여 플레이어 정보를 전달합니다.
4. **추가 파라미터 구성 (`extraParams`):** 광고 타겟팅에 필요한 추가 정보를 구성합니다.
5. **VOD 광고 요청 (`requestVodAd`):** 광고 태그 URL, 콘텐츠 ID 등의 정보를 전달하여 VOD 광고를 요청합니다.
6. **재생 상태 제어**: 콘텐츠 재생 흐름에 맞추어 SDK의 `pause()`, `resume()`, `stop()` 메소드를 호출합니다.

## 단계별 상세 설명

### 1. 광고 UI 선언

> 광고 UI 선언은 광고 삽입 메뉴 > 광고 UI 선언 메뉴를 참고하세요.

### 2. 광고 이벤트 수신 – `FlowerAdsManagerListener`

> **VOD 콘텐츠에 광고를 삽입하는 경우**, 광고 종료 후 본편을 재개하는 등 **비즈니스 로직이 필요할 수 있습니다.** 이를 위해 Flower SDK는 **광고 이벤트를 수신하는 리스너 인터페이스**를 제공하며, 아래와 같이 구현할 수 있습니다.

:::caution VOD Ad Break 전후로 본편 플레이어를 일시정지, 탐색, 재로드하지 마세요
SDK는 VOD 광고를 별도 video 요소에서 재생하며 본편 위에 표시합니다. Mid-roll의 경우 SDK는 Ad Break가 시작될 때 본편을 일시정지하고, Ad Break가 끝나면 본편을 `rewindDuration`(기본 5초)만큼 되돌린 뒤 재개합니다. Post-roll 이후에는 본편이 이미 끝났으므로 재개하지 않습니다. VOD Ad Break 전후로 앱에서 본편을 일시정지, 탐색(seek), 재로드하지 마세요. `onPlay`와 `onError()`에서도 마찬가지입니다(아래 `onError()` 참고).
:::

:::info Mid-roll의 `onPrepare` 호출 시점
SDK는 본편이 Mid-roll 위치에 도달했을 때 `onPrepare`를 호출합니다. `onPrepare`에서 바로 `play()`를 호출하세요.
:::

```javascript
const adsManagerListener = {
    onPrepare(adDurationMs) {
        // TODO GUIDE: 광고 재생 (프리롤, mid-roll, post-roll)
        flowerAdView.adsManager.play();
    },

    onPlay() {
        // NOTE: 이 시점에 player를 pause하지 마세요.
        //       mid-roll 전후의 본편 일시정지와 재개는 SDK가 직접 처리합니다.
        // OPTIONAL GUIDE: 광고 재생 시작 시 필요한 UI 작업만 수행하세요
        //                 (예: 플레이어 컨트롤 숨기기, 광고 표시자 노출)
    },

    onCompleted() {
        if (!isContentPrepared) {
            // TODO GUIDE: 프리롤 광고 종료 후(또는 프리롤 광고가 없는 경우)
            //             VOD 소스를 로드하고 재생을 시작합니다.
            prepareContentSource();
            isContentPrepared = true;
        } else if (!isContentEnd) {
            // NOTE: mid-roll 광고가 종료된 시점입니다.
            //       본편 VOD는 SDK가 rewindDuration만큼 되돌려 직접 재개합니다.
        } else {
            // TODO GUIDE: post-roll 광고가 종료된 시점 - VOD 재생이 완전히 종료되었습니다.
            //             재생 종료 이후 수행해야 할 작업을 여기에 구현하세요
            //             (예: 다음 에피소드로 자동 이동, 이전 화면으로 복귀 등).
        }
    },

    onError(error) {
        console.warn(`onError: ${error?.message}`);
        if (!isContentPrepared) {
            // TODO GUIDE: 프리롤 광고 실패 시에도 VOD 소스를 로드합니다.
            //             (onCompleted()도 호출될 수 있으며, isContentPrepared로 중복 로드를 막습니다)
            prepareContentSource();
            isContentPrepared = true;
        } else if (error?.message?.startsWith('playback unrecoverable')) {
            // TODO GUIDE: 본편 재생이 중단되었고 SDK가 복구하지 않습니다.
            //             본편을 다시 로드하거나 사용자에게 오류를 표시하세요.
        } else if (!isContentEnd) {
            // mid-roll 광고 오류: 안전장치로 본편을 재개합니다 - play()만 호출하고 탐색(seek)이나 재로드는 하지 않습니다.
            //                    본편은 보통 이미 다시 재생 중이므로 호출해도 문제가 없습니다.
            videoElement.play();  // Bitmovin: player.play()
        }
        // NOTE: post-roll 광고 오류(isContentEnd) - 재생이 끝난 상태이므로 재개하지 않습니다.
    },

    onAdBreakSkipped(reason) {
        console.log(`onAdBreakSkipped: ${reason}`);
    }
};
flowerAdView.adsManager.addListener(adsManagerListener);
```

:::info `onError()`가 호출되는 경우
VOD에서 SDK는 다음 경우에 `onError()`를 호출합니다.
- **광고 재생 실패**: 프리롤, Mid-roll, Post-roll의 광고가 로드 또는 재생에 실패한 경우(예: 광고 미디어 디코딩 오류, 광고 미디어에 접근 불가).
- **SDK가 복구할 수 없는 본편 재생 중단**: `playback unrecoverable`로 시작하는 메시지와 함께 `onError()`가 호출됩니다. 본편을 다시 로드하거나 사용자에게 오류를 표시하세요.

VMAP/VAST 요청 실패나 타임아웃, 광고가 없는 Ad Break는 오류가 아닙니다. 이때 SDK는 `onCompleted()`를 호출합니다(광고가 없으면 `onAdBreakSkipped(1)` 후 `onCompleted()`).
:::

:::info `onError()` 호출 시점에 본편은 이미 재생 중입니다
Ad Break가 실패하면 SDK는 `onError()`를 호출하기 **전에** 본편을 되돌려 놓습니다.
- **프리롤 오류**: 본편이 아직 시작되지 않았습니다. 프리롤이 정상 종료된 경우와 같이 본편을 로드하고 시작하세요.
- **Mid-roll 오류**: SDK가 이미 Mid-roll이 본편을 중단시킨 지점에서 `rewindDuration`만큼 앞선 위치부터 본편을 재개했습니다. 본편을 정지, 탐색(seek), 재로드하지 마세요. 안전장치로 `videoElement.play()`(Bitmovin: `player.play()`)를 호출해 본편을 재개하세요. 이미 재생 중이어도 문제가 없습니다.
- **Post-roll 오류**: 본편은 이미 끝났습니다. 재개하지 마세요.

같은 Ad Break에 대해 `onCompleted()`도 호출될 수 있으며, `onError()`보다 먼저 올 수도 나중에 올 수도 있습니다. 본편이 두 번 로드되지 않도록 `isContentPrepared`와 `isContentEnd` 검사를 유지하세요.
:::

### 3. 플레이어 전달 – `MediaPlayerHook`

> 광고 추적을 위해 재생 상태에 따른 현재 플레이어 인스턴스를 SDK에 전달해야 합니다.
> `MediaPlayerHook` 인터페이스를 구현하여 Flower SDK가 재생 상태 및 타이밍 정보에 접근할 수 있도록 합니다.

#### 지원 플레이어

*   HLS.js
*   Bitmovin Player
*   dash.js
*   Shaka Player

위 플레이어들은 `MediaPlayerHook` 인터페이스를 구현하여 SDK에 현재 플레이어를 전달합니다.

#### 미지원 플레이어 사용 시

Video.js 등 그 외의 플레이어는 지원하지 않습니다. 지원되지 않는 플레이어를 사용하면 SDK는 VOD 광고를 삽입하지 않으며 `FlowerAdsManagerListener`도 호출하지 않습니다. 지원되지 않는 플레이어를 사용하는 경우 [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의하세요.

### 4. 광고 요청 추가 파라미터 – `extraParams`

> Flower SDK를 사용하여 광고를 요청하는 시점에 추가적인 매개변수를 전달하면, SDK에서 가장 적합한 광고를 제공하는데 도움이 됩니다. 웹 앱의 경우 SDK 스스로 광고 제공 컨텍스트를 판단할 수 없으므로, 광고 요청 시 이러한 매개변수를 SDK에 반드시 전달해야 합니다.

#### 파라미터 목록

| Key<br/>(\* indicates required for web apps) | Value | Example |
| ---| ---| --- |
| serviceId\* | 앱의 패키지 이름 | "tv.anypoint.service" |
| os\* | 앱이 실행되는 기기의 OS | "Web" |
| adId\* | 앱이 실행되는 기기의 광고 식별자 | 웹: 사용자 식별자 또는 세션 ID |

### 5. VOD 광고 API 호출 – `requestVodAd(...)`

#### FlowerAdsManager.requestVodAd()

VOD 콘텐츠 진입 전 광고를 요청하는 데 사용하는 함수입니다.

다음은 전달 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | string | 광고 서버에서 발급된 광고 태그 URL |
| contentId | string | 콘텐츠의 고유 아이디<br/>Flower 백엔드 시스템에 등록되어야 함 |
| durationMs | number | VOD 콘텐츠의 전체 재생 시간(ms) |
| extraParams | map | 타겟팅을 위해 사전 협의된 추가 정보(없을 경우 _null_) |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체 |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| requestTimeout | number | (Optional) VOD 광고 요청 타임아웃(ms). 기본값은 5000입니다. |
| minPrepareDuration | number | (Optional) 광고 준비를 위한 사전 시간(ms). Mid-roll 광고는 Mid-roll 위치보다 `requestTimeout + minPrepareDuration`만큼 먼저 요청되며, `onPrepare`는 본편이 해당 위치에 도달했을 때 호출됩니다. 기본값은 5000입니다. |
| rewindDuration | number | (Optional) Mid-roll 광고 구간 종료 시 콘텐츠를 되감는 시간(ms). 본편은 중단된 위치보다 이 시간만큼 앞에서 재개됩니다. 되감기로 인해 같은 Mid-roll이 다시 재생되지는 않습니다. 기본값은 5000입니다. |

`requestTimeout`, `minPrepareDuration`, `rewindDuration`은 마지막에 추가로 전달할 수 있는 선택 매개변수입니다. 생략하거나 `null`을 전달하면 기본값이 적용됩니다.

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

## VOD 광고 요청 예시

:::tip 프리롤 광고가 끝난 뒤에 VOD 소스를 로드하세요
`requestVodAd(...)` 호출 직후에 본편 VOD 소스를 플레이어에 바로 로드하지 마세요.
처음 호출되는 `FlowerAdsManagerListener.onCompleted()`(또는 `onError()`) 시점에 본편이 아직 준비되지 않았는지(예: `isContentPrepared === false`) 판단한 뒤, 그때 VOD 소스를 로드하고 재생을 시작해야 합니다.

SDK는 프리롤을 위해 본편을 일시정지하지 않습니다. `requestVodAd(...)` 직후에 VOD 소스를 로드하면 프리롤 광고 아래에서 본편이 소리와 함께 실제로 재생됩니다.

SDK는 프리롤이 없거나, 광고가 송출되지 않거나, 광고 요청이 실패한 경우에도 `onCompleted()`를 호출하므로 본편은 항상 이 콜백에서 시작됩니다. 본편이 준비된 이후에는 `onCompleted()`에서 본편을 로드, 재생, 일시정지, 탐색(seek)하지 마세요. mid-roll 이후에는 SDK가 본편을 직접 재개하기 때문입니다. `onError()`에서도 본편을 로드, 일시정지, 탐색하지 말고, 위의 [`onError()`](#2-광고-이벤트-수신--floweradsmanagerlistener) 설명대로 처리하세요.
:::

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
    //
    // NOTE: 이 지점에서 VOD 소스를 플레이어에 로드하지 마세요.
    //       프리롤 광고 종료 후에 재생되도록 step 2의
    //       FlowerAdsManagerListener.onCompleted() 내부에서 VOD 소스를 로드해야 합니다.
    flowerAdView.adsManager.requestVodAd(
        'https://ad_request',
        '100',
        3600000,
        { 'custom-param': 'custom-param-value' },
        mediaPlayerHook,
        { 'custom-ad-header': 'custom-ad-header-value' }
    );
}

// TODO GUIDE: VOD 소스 로드. 프리롤 광고가 끝난 시점에
//             FlowerAdsManagerListener.onCompleted()(또는 onError())에서 호출합니다.
function prepareContentSource() {
    yourPlayer.loadSource('https://vod_content_url');
    yourPlayer.on(Hls.Events.MANIFEST_PARSED, function() {
        videoElement.play();
    });
}

// TODO GUIDE: stop SDK when exiting VOD
function onVodExit() {
    flowerAdView.adsManager.stop();
}
```
