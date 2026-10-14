---
sidebar_position: 3
---

# FlowerAdsManagerListener

Flower SDK 동작 중 광고 이벤트를 수신하기 위한 인터페이스입니다.

## 이벤트

### onAdBreakPrepare

전면 광고 / VOD 광고의 광고 매니페스트가 로드되었을 때 발생하는 이벤트입니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adInfos | ArrayList&lt;[AdInfo](./ad-info.md)&gt; | 로드된 광고 메타데이터 목록 |

### onPrepare

전면 광고 / VOD 광고가 로드되었을 때 발생하는 이벤트입니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adDurationMs | Int | 전체 광고 재생 시간 |

### onPlay

광고 재생이 시작될 때 발생하는 이벤트입니다.

### onAdPlay

개별 광고 단위의 재생이 시작될 때 발생하는 이벤트입니다. 재생되는 광고의 메타데이터를 전달합니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adInfo | [AdInfo](./ad-info.md) | 재생이 시작된 광고의 메타데이터 |

### onAdUserAction

사용자가 광고의 자세히 알아보기 버튼을 클릭하거나 건너뛰기 버튼을 눌렀을 때 발생하는 이벤트입니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| action | String | 사용자 액션 유형<br/>`learn_more`: 사용자가 자세히 알아보기 / 클릭 영역을 클릭함<br/>`skip`: 사용자가 건너뛰기 버튼을 누름 |
| adInfo | [AdInfo](./ad-info.md) | 액션이 발생한 광고의 메타데이터 |

### onCompleted

광고 재생이 종료될 때 발생하는 이벤트입니다.

### onError

Flower SDK에서 오류가 발생했을 때 발생하는 이벤트입니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| error | FlowerError? | 메시지를 포함한 에러 객체 |

`onError`는 다음 경우에 호출됩니다:

*   **광고 재생 실패** (예: 광고 미디어 디코딩 오류, 광고 미디어에 접근 불가)
*   **SDK가 복구하지 않는 콘텐츠 재생 중단:** 플레이어 어댑터가 장애 1건당 한 번, `playback unrecoverable (<reason>) - url: <url>` 메시지와 플레이어의 오류를 `cause`로 담아 `onError`를 호출합니다. Media3 ExoPlayer / ExoPlayer2: SDK가 자동 복구하지 않는 치명적 플레이어 오류, Flower 설정에서 SDK의 `BehindLiveWindow` 자동 복구가 꺼져 있을 때의 `BehindLiveWindow`, 3회 복구를 시도한 뒤에도 멈춰 있는 라이브 플레이리스트. Bitmovin Player: 3회 재로드 시도 후에도 실패한 경우, 또는 재로드할 소스가 없는 경우. 재생이 다시 진행되면 이후의 중단은 새 장애로 취급됩니다.
*   **SDK 로컬 프록시 서버 응답 실패:** VOD 광고 미디어는 이 서버를 거쳐 캐시됩니다.

VOD에서 VMAP/VAST 요청 실패나 타임아웃, 광고가 없는 Ad Break는 오류가 아닙니다. 이때 SDK는 `onCompleted`를 호출합니다(광고가 없으면 `onAdBreakSkipped(1)` 후 `onCompleted`).

SDK는 메인 스레드가 아닌 스레드에서 리스너를 호출하므로, 플레이어를 다루기 전에 메인 스레드로 전환하세요. 권장 처리 방법은 다음과 같습니다:

*   **Linear TV / FAST:** `FlowerAdsManager.stop()`을 호출하고 콘텐츠 플레이어를 정지 또는 해제한 다음, 채널을 다시 시작합니다(새 `changeChannelUrl(...)` 호출과 반환된 URL 사용). `prerollAdTagUrl`을 포함해 처음 시작할 때와 완전히 같은 매개변수를 전달하고(Flower Player는 같은 `FlowerLinearTvAdConfig`를 사용합니다), 반환된 URL도 같은 방식으로 처리하세요. `prerollAdTagUrl`을 전달했다면 `onCompleted`까지 URL 로드를 미룹니다. SDK가 마지막으로 진입한 채널의 프리롤을 건너뛰므로 시청자가 프리롤을 다시 보지는 않습니다. Flower Player를 사용하는 경우 `stop()` / `release()`(`FlowerBitmovinPlayer`는 `destroy()`)가 광고 매니저도 정지합니다. [플레이어 수동 제어](../ad-insertion/linear-tv-fast/manual-player-control)를 참고하세요.
*   **VOD:** Ad Break가 실패하면 SDK는 `onError`를 호출하기 전에 본편을 되돌려 놓습니다. 미드롤이었다면 본편은 이미 중단 지점에서 `rewindDuration`만큼 앞선 위치부터 다시 재생 중입니다. 광고 오류에 대해 본편을 정지, 탐색(seek), 재로드하지 마세요. 콘텐츠가 아직 시작되지 않았다면(프리롤) 콘텐츠를 로드하고 시작하고, 콘텐츠가 끝났다면(포스트롤) 재생 종료 시나리오를 실행합니다. 실패한 Ad Break에 대해 `onCompleted`도 호출될 수 있으며 순서는 정해져 있지 않습니다. `playback unrecoverable`이면 콘텐츠를 다시 로드하거나 오류를 표시하세요. [VOD 프리롤, Mid-roll, Post-roll 광고 적용](../ad-insertion/vod/vod-ad-implementation)을 참고하세요.

### onAdBreakSkipped

광고가 건너뛰기 되었을 때 발생하는 이벤트입니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| reason | Int | 광고가 건너뛰기된 이유를 나타내는 코드<br/>0: Unknown<br/>1: No Ad<br/>2: Timeout<br/>3: Error |

## 관련 API

*   [AdInfo](./ad-info.md)
