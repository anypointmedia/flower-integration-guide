---
sidebar_position: 4
---

# FlowerAdsManagerListener

Flower SDK 동작 중 광고 이벤트를 수신하기 위한 인터페이스입니다.

## 이벤트

### onAdBreakPrepare

전면 광고 / VOD 광고의 광고 매니페스트가 로드되었을 때 발생하는 이벤트입니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adInfos | NSMutableArray | 로드된 광고 메타데이터 목록. 각 항목은 [AdInfo](./ad-info.md) 객체입니다. |

### onPrepare

전면 광고 / VOD 광고가 로드되었을 때 발생하는 이벤트입니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adDurationMs | Int32 | 전체 광고 재생 시간 |

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

- **광고 재생 실패** (예: 광고 미디어 디코딩 오류, 광고 미디어에 접근 불가)
- **SDK가 복구할 수 없는 콘텐츠 재생 중단:** 메시지는 `playback unrecoverable`로 시작합니다.
- **SDK 내부 오류:** 실시간 채널이면 채널을 다시 시작하세요. [`onError` 시 채널 재시작](../ad-insertion/linear-tv-fast/manual-player-control#receiving-ad-events)을 참고하세요.

VOD에서 VMAP/VAST 요청 실패나 타임아웃, 광고가 없는 Ad Break는 에러가 아닙니다. 이때 SDK는 `onCompleted`를 호출합니다(광고가 없으면 `onAdBreakSkipped(reason: 1)` 후 `onCompleted`).

권장 처리 방법(이 이벤트는 메인 스레드가 아닌 곳에서 전달되므로, 플레이어를 다루기 전에 메인 스레드로 전환하세요):

- **실시간 채널 / FAST:** `stop()`으로 광고 매니저를 중지하고, 콘텐츠 플레이어 아이템을 해제한 뒤, `prerollAdTagUrl`을 포함해 같은 매개변수로, 처음 시작했을 때와 같은 방식으로 채널을 다시 시작합니다. 채널 변경이 없으면 SDK가 프리롤을 생략하므로 시청자가 프리롤을 다시 보지 않습니다. [플레이어 수동 제어](../ad-insertion/linear-tv-fast/manual-player-control)를 참고하세요.
- **VOD:** Ad Break가 실패하면 SDK는 `onError`를 호출하기 전에 콘텐츠를 되돌려 놓습니다. 미드롤이었다면 콘텐츠는 이미 중단 지점에서 `rewindDuration`만큼 앞선 위치부터 다시 재생 중입니다. 광고 에러에 대해 콘텐츠를 정지, seek, 다시 로드하지 마세요. 미드롤 에러이면 안전장치로 `player.play()`를 호출하세요. 콘텐츠가 이미 재생 중이어도 문제가 없습니다. 프리롤 에러이면 콘텐츠를 로드하고 재생을 시작합니다. 포스트롤 에러이면 콘텐츠가 이미 끝났으므로 재개하지 않습니다. 실패한 Ad Break에 대해 `onCompleted`도 호출될 수 있으며 순서는 정해져 있지 않습니다. `playback unrecoverable`이면 콘텐츠를 다시 로드하거나 오류를 표시하세요. [VOD 프리롤, Mid-roll, Post-roll 광고 적용](../ad-insertion/vod/vod-ad-implementation)을 참고하세요.

### onAdBreakSkipped

광고가 건너뛰기 되었을 때 발생하는 이벤트입니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| reason | Int32 | 광고가 건너뛰기된 이유를 나타내는 코드<br/>0: Unknown<br/>1: No Ad<br/>2: Timeout<br/>3: Error |

## 관련 API

*   [AdInfo](./ad-info.md)
