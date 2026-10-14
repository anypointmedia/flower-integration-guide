---
sidebar_position: 2
---

# VOD 프리롤, Mid-roll, Post-roll 광고 적용

본 가이드는 Flower SDK를 사용하여 VOD 콘텐츠에 광고를 삽입하는 전체 과정을 안내합니다. 광고 연동은 다음 단계를 따릅니다:
1. **광고 UI 선언:** 광고를 표시하기 위해 화면에 `FlowerAdView`를 배치합니다.
2. **광고 이벤트 수신 구현:** 광고 재생 및 완료 시점의 로직 처리를 위해 `FlowerAdsManagerListener`를 구현합니다.
3. **플레이어 전달:** SDK가 콘텐츠 재생 상태를 인식할 수 있도록 `MediaPlayerHook`을 구현하여 플레이어 정보를 전달합니다.
4. **추가 파라미터 설정 (`extraParams`):** 광고 타겟팅에 필요한 추가 정보를 구성합니다.
5. **VOD 광고 요청 (`requestVodAd`):** 광고 태그 URL, 콘텐츠 ID 등의 정보를 전달하여 VOD 광고를 요청합니다.
6. **재생 상태 제어**: 콘텐츠 재생 흐름에 맞추어 SDK의 `pause()`, `resume()`, `stop()` 메소드를 호출합니다.

## 단계별 상세 설명

### 1. 광고 UI 선언

> 광고 UI 선언은 광고 삽입 메뉴 > 광고 UI 선언 섹션을 참고하세요.

### 2. 광고 이벤트 수신 -- `FlowerAdsManagerListener`

> VOD 콘텐츠 재생 중 광고 이벤트에 대응하여 재생을 제어하려면 `FlowerAdsManagerListener` 인터페이스를 구현합니다.
> 이를 통해 프리롤 광고 종료 후 본편 재생을 시작하고, 재생 오류 또는 스킵 이벤트를 처리할 수 있습니다. 아래와 같이 구현할 수 있습니다:

:::caution VOD Ad Break 전후로 본편 플레이어를 일시정지, 탐색, 재로드하지 마세요
기본 설정(`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`)에서 SDK는 VOD 광고를 별도 광고 플레이어에서 재생하며 본편 위에 표시합니다. Mid-roll의 경우 SDK는 Mid-roll 위치에서 `onPrepare`가 호출될 때 본편을 일시정지하고, Ad Break가 끝나면 본편을 `rewindDuration`(기본 5초)만큼 되돌린 뒤 재개합니다. Post-roll 이후에는 본편이 이미 끝났으므로 재개하지 않습니다. VOD Ad Break 전후로 앱에서 본편을 일시정지, 탐색(seek), 재로드하지 마세요. `onPlay`와 `onError`에서도 마찬가지입니다.

`setIgnoreAdBreakInPIPMode(false)`인 경우 SDK는 `MediaPlayerHook`을 통해 전달받은 player 안에서 광고를 재생하므로, player를 pause 시키면 광고가 중지됩니다. 이 모드에 대해서는 [PIP 모드 지원](./pip-mode-support) 페이지를 참고하세요.
:::

:::info Mid-roll의 `onPrepare` 호출 시점
SDK는 Mid-roll 광고를 미리 요청해 두고, 본편이 Mid-roll 위치에 도달했을 때 `onPrepare`를 호출합니다. `onPrepare`에서 바로 `play()`를 호출하세요.
:::

:::info `onError`가 호출되는 경우
VOD에서 SDK는 다음 경우에 `onError`를 호출합니다.
- **광고 재생 실패**: 프리롤, Mid-roll, Post-roll의 광고가 로드 또는 재생에 실패한 경우(예: 광고 미디어 디코딩 오류, 광고 미디어에 접근 불가).
- **SDK가 복구하지 않는 본편 재생 중단**: 아래 "본편을 재생할 수 없는 경우"를 참고하세요.
- **SDK 로컬 프록시 서버 응답 실패**: VOD 광고 미디어는 이 서버를 거쳐 캐시됩니다.

VMAP/VAST 요청 실패나 타임아웃, 광고가 없는 Ad Break는 오류가 아닙니다. 이때 SDK는 `onCompleted`를 호출합니다(광고가 없으면 `onAdBreakSkipped(1)` 후 `onCompleted`).
:::

:::info 실패한 Ad Break의 `onError` 처리
Ad Break가 실패하면 SDK는 `onError`를 호출하기 **전에** 본편을 되돌려 놓습니다. 따라서 핸들러가 실행되는 시점에는 본편이 이미 다시 재생 중입니다.
- **프리롤 오류** (`!isContentPrepared`): 본편이 아직 시작되지 않았습니다. 프리롤이 정상 종료된 경우와 같이 VOD 소스를 로드하고 재생을 시작합니다.
- **Mid-roll 오류**: SDK가 이미 Mid-roll이 본편을 중단시킨 지점에서 `rewindDuration`만큼 앞선 위치부터 본편을 재개했습니다. `setIgnoreAdBreakInPIPMode(false)`인 경우에는 광고 플레이어가 실패한 광고를 버리고, 앱의 원래 `MediaItem`(또는 소스)으로 플레이리스트를 다시 구성해 그 위치에서 본편을 재생합니다. 본편을 정지, 탐색(seek), 재로드, 재개하지 말고 오류를 로그로만 남기세요.
- **Post-roll 오류** (`isContentEnd`): 본편은 이미 끝났습니다. Post-roll이 정상 종료된 경우와 같이 재생 종료 시나리오를 실행합니다.

실패한 Ad Break에 대해 `onCompleted`도 호출될 수 있으며, `onError`보다 먼저 올 수도 나중에 올 수도 있습니다. 아래 예시처럼 `isContentPrepared`를 확인하는 등, 같은 Ad Break에 두 핸들러가 모두 실행되어도 문제가 없도록 구현하세요.
:::

:::info 본편을 재생할 수 없는 경우
본편 재생이 중단되었고 SDK가 이를 복구하지 않을 때, 플레이어 어댑터가 장애 1건당 한 번 `onError`를 호출합니다. 메시지는 `playback unrecoverable (<reason>) - url: <url>`이며, `cause`에는 플레이어의 오류가 담깁니다. 재생이 다시 진행되면 이후의 중단은 새 장애로 취급됩니다.
- **Media3 ExoPlayer / ExoPlayer2**: SDK가 자동 복구하지 않는 치명적 플레이어 오류, Flower 설정에서 SDK의 `BehindLiveWindow` 자동 복구가 꺼져 있을 때의 `BehindLiveWindow`, 3회 복구를 시도한 뒤에도 멈춰 있는 라이브 플레이리스트.
- **Bitmovin Player**: 3회 재로드를 시도한 뒤에도 실패한 재생, 또는 재로드할 소스가 없는 경우.

VOD에서는 본편을 다시 로드하거나 사용자에게 오류를 표시하세요. `setIgnoreAdBreakInPIPMode(false)`인 경우 광고 플레이어와 본편 플레이어 어댑터가 앱의 player를 함께 사용하므로, 광고 실패 1건이 두 번 보고될 수 있습니다.
:::

```kotlin
val adsManagerListener = object : FlowerAdsManagerListener {
    override fun onPrepare(adDurationMs: Int) {
        CoroutineScope(Dispatchers.Main).launch {
            // TODO GUIDE: 광고 재생 (pre-roll, mid-roll, post-roll)
            flowerAdView.adsManager.play()
        }
    }

    override fun onPlay() {
        // NOTE: 이 시점에 player를 pause하지 마세요.
        //       mid-roll 전후의 본편 일시정지와 재개는 SDK가 직접 처리합니다.
        // OPTIONAL GUIDE: 광고 재생 시작 시 필요한 UI 작업만 수행하세요
        //                 (예: 플레이어 컨트롤 숨기기, 광고 표시자 노출)
    }

    override fun onCompleted() {
        CoroutineScope(Dispatchers.Main).launch {
            if (!isContentPrepared) {
                // TODO GUIDE: pre-roll 광고 종료 후(또는 pre-roll 광고가 없는 경우)
                //             VOD 소스를 로드하고 재생을 시작합니다.
                prepareContentSource()
                isContentPrepared = true
            } else if (!isContentEnd) {
                // NOTE: mid-roll 광고가 종료된 시점입니다.
                //       본편 VOD는 SDK가 rewindDuration만큼 되돌려 직접 재개합니다.
            } else {
                // TODO GUIDE: post-roll 광고가 종료된 시점 - VOD 재생이 완전히 종료되었습니다.
                //             재생 종료 이후 수행해야 할 작업을 여기에 구현하세요
                //             (예: 다음 에피소드로 자동 이동, 이전 화면으로 복귀 등).
            }
        }
    }

    override fun onError(error: FlowerError?) {
        // NOTE: Ad Break가 실패하면 SDK는 onError 호출 전에 본편을 되돌려 놓습니다.
        //       광고 오류에 대해 본편을 정지, 탐색(seek), 재로드하지 마세요.
        logger.warn { "onError: ${error?.message}" }
        CoroutineScope(Dispatchers.Main).launch {
            if (!isContentPrepared) {
                // TODO GUIDE: pre-roll 광고 실패 - VOD 소스를 로드하고 재생을 시작합니다.
                //             같은 Ad Break에 대해 onCompleted도 호출될 수 있습니다.
                prepareContentSource()
                isContentPrepared = true
            } else if (error?.message?.startsWith("playback unrecoverable") == true) {
                // TODO GUIDE: 본편 재생이 중단되었고 SDK가 복구하지 않습니다.
                //             본편을 다시 로드하거나 사용자에게 오류를 표시하세요.
            } else if (isContentEnd) {
                // TODO GUIDE: post-roll 광고가 실패한 시점 - VOD 재생이 완전히 종료되었습니다.
                //             onCompleted와 동일한 재생 종료 이후 작업을 수행하세요.
            }
            // NOTE: mid-roll 광고 실패 - SDK가 이미 본편을 재개했으므로 할 일이 없습니다.
        }
    }

    override fun onAdBreakSkipped(reason: Int) {
        logger.info { "onAdBreakSkipped: $reason" }
    }
}
flowerAdView.adsManager.addListener(adsManagerListener)
```

### 3. 플레이어 전달 -- `MediaPlayerHook`

> 광고 재생 상태 기반 트래킹을 위해 현재 플레이어 인스턴스를 SDK에 제공해야 합니다.
> Flower SDK가 재생 상태 및 타이밍 정보에 접근할 수 있도록 `MediaPlayerHook` 인터페이스를 구현합니다.

#### 지원 플레이어

*   ExoPlayer2
*   Media3 ExoPlayer
*   Bitmovin Player

위 플레이어들은 `MediaPlayerHook` 인터페이스를 구현하여 SDK에 현재 플레이어를 전달합니다.

#### 미지원 플레이어 사용 시

지원되지 않는 플레이어를 사용하는 경우 [Helpdesk](mailto:dev-support@anypointmedia.com)에 문의해주세요.

### 4. 광고 요청 시 추가 파라미터 -- `extraParams`

> Flower SDK를 사용하여 광고를 요청할 때 추가 매개변수를 전달하면, SDK가 가장 적합한 광고를 제공하는 데 도움이 됩니다. 웹 앱의 경우 SDK가 자체적으로 광고 제공 컨텍스트를 판단할 수 없으므로, 광고 요청 시 이러한 매개변수를 SDK에 반드시 전달해야 합니다.

#### 파라미터 목록

| 키<br/>(\* 표시는 웹앱 필수) | 값 | 예시 |
| ---| ---| --- |
| serviceId\* | 앱의 패키지 이름 | "tv.anypoint.service" |
| os\* | 앱이 실행되는 기기의 OS | "Web" |
| adId\* | 앱이 실행되는 기기의 광고 식별자 | Web: 사용자 식별자 또는 세션 ID |

### 5. VOD 광고 API 호출 -- `requestVodAd(...)`

#### FlowerAdsManager.requestVodAd()

VOD 콘텐츠 진입 전 광고를 요청하는 데 사용하는 함수입니다.

다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | string | Flower 백엔드 시스템에서 발급된 광고 태그 URL.<br/>Anypoint Media에 요청하여 adTagUrl을 발급받아야 합니다. |
| contentId | string | 고유 콘텐츠 ID.<br/>Flower 백엔드 시스템에 등록되어야 합니다. |
| durationMs | long | VOD 콘텐츠의 전체 재생 시간(밀리초). |
| extraParams | map | (Optional) 타겟팅을 위해 사전 협의된 추가 정보. |
| mediaPlayerHook | MediaPlayerHook | 비디오 플레이어를 반환하는 인터페이스 구현 객체. |
| adTagHeaders | map | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보. |

#### FlowerAdsManager.notifyContentEnded()

VOD 콘텐츠 재생이 완료되었을 때(예: `Player.STATE_ENDED`) 이 API를 호출합니다. post-roll 광고 로딩을 트리거합니다. 매개변수는 없습니다.

```kotlin
// Detect content end
player.addListener(object : Player.Listener {
    override fun onPlaybackStateChanged(playbackState: Int) {
        if (playbackState == Player.STATE_ENDED) {
            isContentEnd = true
            flowerAdView.adsManager.notifyContentEnded()
        }
    }
})
```

:::note
`FlowerSdk.setIgnoreAdBreakInPIPMode(false)`인 경우 광고가 본편 플레이어의 미디어 아이템으로 재생되므로 Ad Break 전후에도 `STATE_ENDED`가 발생합니다. `notifyContentEnded()`를 호출하기 전에 현재 미디어 아이템이 본편인지 확인하세요. [PIP 모드 지원](./pip-mode-support#플레이어-이벤트-처리) 페이지를 참고하세요.
:::

#### FlowerAdsManager.stop()

VOD 콘텐츠를 나갈 때 이 API를 호출합니다. 매개변수는 없습니다.

#### FlowerAdsManager.pause()

VOD 콘텐츠를 일시정지할 때 사용하는 API입니다. 매개변수는 없습니다.

#### FlowerAdsManager.resume()

VOD 콘텐츠를 재개할 때 사용하는 API입니다. 매개변수는 없습니다.

## VOD 광고 요청 예시

:::tip 프리롤 광고가 끝난 뒤에 VOD 소스를 로드하세요
`requestVodAd(...)` 호출 직후에 본편 VOD 소스를 플레이어에 바로 로드하지 마세요.
`FlowerAdsManagerListener.onCompleted()`(또는 `onError()`)가 호출된 시점에 본편이 아직 준비되지 않았는지(예: `isContentPrepared == false`) 판단한 뒤, 그때 VOD 소스를 로드하고 재생을 시작해야 합니다.

`requestVodAd(...)` 직후에 VOD 소스를 로드하면 프리롤 광고가 재생되기 전에 본편의 첫 프레임이 잠깐 노출될 수 있습니다.
:::

```kotlin
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
//       pre-roll 광고 종료 후에 재생되도록 step 2의
//       FlowerAdsManagerListener.onCompleted() 내부에서 VOD 소스를 로드해야 합니다.
flowerAdView.adsManager.requestVodAd(
    adTagUrl = "https://ad_request",
    contentId = "100",
    durationMs = 3_600_000L,
    extraParams = mapOf("custom-param" to "custom-param-value"),
    mediaPlayerHook = { player },
    adTagHeaders = mapOf("custom-ad-header" to "custom-ad-header-value"),
)

// TODO GUIDE: stop SDK when exiting VOD
fun onVodExit() {
    flowerAdView.adsManager.stop()
}
```
