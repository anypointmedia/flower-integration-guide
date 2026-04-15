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
| adInfos | AdInfo\[\] | 로드된 광고 메타데이터 목록 |

### onPrepare

전면 광고 / VOD 광고가 로드되었을 때 발생하는 이벤트입니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adDurationMs | number | 전체 광고 재생 시간 |

### onPlay

광고 재생이 시작될 때 발생하는 이벤트입니다.

### onCompleted

광고 재생이 종료될 때 발생하는 이벤트입니다.

### onError

Flower SDK에서 오류가 발생했을 때 발생하는 이벤트입니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| error | FlowerError? | 메시지를 포함한 에러 객체 |

### onAdBreakSkipped

광고가 건너뛰기 되었을 때 발생하는 이벤트입니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| reason | number | 광고가 건너뛰기된 이유를 나타내는 코드<br/>0: Unknown<br/>1: No Ad<br/>2: Timeout<br/>3: Error<br/>4: User skipped |

## 관련 API

*   [AdInfo](ad-info)
