---
sidebar_position: 2
---

# FLOWER SDK

Flower SDK에 포함된 주요 모듈의 종류는 다음과 같습니다.
*   [sdk-ad-ui](https://maven.anypoint.tv/service/rest/repository/browse/public-release/tv/anypoint/sdk-ad-ui/)
*   [sdk-multicast](https://maven.anypoint.tv/service/rest/repository/browse/public-release/tv/anypoint/sdk-multicast/)
*   [sdk-multicast-exoplayer](https://maven.anypoint.tv/service/rest/repository/browse/public-release/tv/anypoint/sdk-multicast-exoplayer/)
*   [sdk-multicast-ima](https://maven.anypoint.tv/service/rest/repository/browse/public-release/tv/anypoint/sdk-multicast-ima/)

| **버전** | **날짜** | **변경내용** |
| --- | --- | --- |
| 2.0.8[RC] |  | **New** <ol><li>렌더링 뷰 선택 옵션 추가</li><li>채널 진입 시 즉시 광고가 재생 될 수 있는 PreRoll 광고 기능 추가</li><li>device1stPartyData 입력 기능 추가</li><li>[Airtel] sdk-airtel 추가</li><li>Agent 상태 검사 및 복구 기능 추가 [Agent v3.9.35 이상 요구 됨]</li></ol> **Feature** <ol><li>광고 준비와 재생 단계의 쓰레드 안정성, 에러 처리 개선</li><li>광고 재생 작업을 별도의 쓰레드로 분리하여 메인 쓰레드에서의 정체를 방지</li><li>이벤트 발생 빈도 개선<ul><li>같은 채널로 이동되는 이벤트에 대해 state 이벤트 전송을 하지 않도록 개선</li><li>prepareStop 콜백이 여러 번 호출되는 문제 수정</li></ul></li><li>IMA SDK의 로드 시간 개선: ImaSdkFactory 초기화 추가</li><li>SCTE-35, 신호 발생 시간을 입수하여 SCTE-35 수신 및 디코딩에 경과되는 시간을 보정할 수 있도록 개선</li><li>일부 리시버를 Manifest에 직접 등재</li><li>[KT] CueType에 따라 slot code 세분화, placement Id 구분</li></ol> **BugFix** <ol><li>IMA SDK 402 에러 발생 문제 수정</li><li>광고 종료 후 잔상이 남는 현상 수정</li><li>SCTE-35, splicePts 오버플로우 문제 수정</li><li> SCTE-35, CUE_IN 신호가 채널 전환 시 취소될 수 있도록 수정</li></ol> |
| 2.0.7 | 2025.04.01 | **Feature** <ol><li>코틀린 의존성 제거</li><li>IMA SDK 업그레이드</li><li>SCTE-35 반복적인 로그 제거</li></ol> **BugFix** <ol><li>ad-ui에서 append로 UI가 필요한 광고를 받으면, UI 렌더링 알림을 보내지 않는 문제 수정</li><li>일부 모델에서 구글 스킵 버튼에 포커스가 가지 않는 문제 수정</li></ol> |
| 2.0.6 | 2024.10.30 | **Feature** <ol><li>Android OS 14 지원</li></ol> |
| 2.0.5 | 2023.10.04 | **New** <ol><li>커스텀 플레이어에서 Skippable 구글 광고 지원</li></ol> |
| 2.0.4 | 2023.07.12 | **New** <ol><li>내장 기본 플레이어에서 Skippable 구글 광고 지원</li><li>재생 목록 추가 기능 지원</li></ol> **BugFix** <ol><li>재생 목록 추가 시에 남은 시간이 잘못 계산되는 문제 수정</li></ol> |
| 2.0.1 | 2023.01.12 | **Feature** <ol><li>SDK 중복 초기화를 방지하도록 개선</li><li>Splice Null Command 처리를 무시하도록 개선</li></ol> |
| 2.0.0 | 2022.04.15 | **New** <ol><li>멀티 구글 광고 지원</li></ol> |
| 1.1.0 | 2021.10.29 | **New** <ol><li>IMA SDK의 언어 설정 지원</li></ol> **Feature** <ol><li>광고 플레이어 상태를 확인하여 비정상인 경우 라이브 상태로 전환하도록 개선</li></ol> |
| 1.0.0 | 2021.07.16 | **New** <ol><li>구글 광고 지원</li><li>SCTE-35 CUE TAG 지원</li><li>연속큐 지원</li></ol> |

*   **New** : 신규 기능
*   **Feature** : 기존 기능 수정
*   **BugFix** : 오류 수정
