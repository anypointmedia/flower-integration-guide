---
sidebar_position: 2
---

# FLOWER Ad Agent

| **버전** | **날짜** | **변경내용** |
| ---| ---| --- |
| 3.9.35 |  | **New** <ol><li>Agent 상태 검사 및 복구 기능 추가 [SDK v2.0.8-RC33_20250613 이상 요구 됨]</li></ol> **Feature** <ol><li>프로그래매틱 광고 처리 및 응답 대기 작업에 일관성 부여</li><li>VAST Extensions으로 IMA SDK 요청이 가능하도록 확장</li><li>URL 사전 검증을 통해 다운로드 불가능한 리소스를 광고 편성에 포함하지 않도록 개선</li><li>일부 리시버를 Manifest에 직접 등재</li></ol>  **BugFix** <ol><li>노출 로그 시간의 총합이 CUE 길이를 초과되어 계산되지 않도록 개선</li></ol> |
| 3.9.33 | 2025.06.10 | **New** <ol><li>타게팅 고도화를 위한 platform-device-id 추가</li><li>[TI] skyworth 앱이 fileProvider을 사용하도록 권한 부여</li><li>device1stPartyData 입력 기능 추가 [SDK v2.0.8-RC30_20250605 이상 요구 됨]</li><li>외부 프로퍼티 작성 중단(.targetad, .test_ad_agent)</li></ol> **BugFix** <ol><li>간혹 필러/엔딩 광고 편성 단계에서 큐 남은 시간보다 긴 광고가 편성되는 문제 조치</li><li>성능이 느려지는 환경에서 엔딩 광고 재생 중 광고가 바로 중단되는 문제 조치</li><li>광고  스킵 후 추가 편성광고를 편성할 시간이 모자랄 경우, 추가를 시도하지 않고 종료되도록 개선</li></ol> |
| 3.9.31 | 2025.05.09 | **New** <ol><li>빌드 환경 업데이트<ul><li>AGP 업데이트 (8.7.3)</li><li>gradle 업데이트 (8.10.2)</li></ul></li><li>렌더링 뷰를 선택하는 설정 추가 (playerViewType)</li><li>큐 시간이 임박한 요청은 무시하는 설정 추가 (adReadyRequiredTime)</li><li>채널 진입 시 즉시 광고가 재생 될 수 있는 PreRoll 광고 기능 추가 (channel.preRoll, preRollCoolDown)</li><li>SCTE35의 eventId를 uniqueProgramId 처럼 사용할 수 있는 기능 추가 (channel.useScte35EventId)</li><li>android.permission.SCHEDULE_EXACT_ALARM에 tools:ignore="ProtectedPermissions” 부여</li></ol> **BugFix** <ol><li>[KT] 광고 스킵 시, impression-log가 찍히지 않는 문제 수정</li><li>광고 패치가 실패하면 최대 3번 재시도 하도록 수정</li><li>앱이 기동 될 때 OOM으로 크래쉬가 나는 것을 안정적으로 종료될 수 있게 개선</li><li>같은 채널로 진입 시도 될 때 광고를 중단하지 않고, state를 보내지 않도록 개선</li></ol> |
| 3.9.30 | 2025.04.01 | **New** <ol><li>Agent 앱의 고유 UUID를 조회할 수 있는 UuidContentProvider 제공</li></ol> **BugFix** <ol><li>광고 스킵 시 realPlayTime이 잘못 계산되는 문제 수정</li><li>광고가 정렬되며 프로그래매틱 광고 시간이 일부 잘려 계산되는 문제 수정</li></ol> |
| 3.9.29 | 2025.03.10 | **BugFix** <ol><li>구글 트랜젝션의 동시성 문제 조치</li><li>프로그래매틱 광고 사용 중 fallbackUrl을 사용할 때 로그 추가</li></ol> |
| 3.9.28 | 2025.02.18 | **New** <ol><li>ExtraParams을 VAST macro에 반영하도록 개선</li><li>[KT] zipcode를 포함한 인증 요청 작업</li></ol> **BugFix** <ol><li>"useLastPositionSkipAd" 와 "useLastPositionGoogleAd"을 둘 다 사용하였을 때, non-skippable 구글 광고가 전방에 편성되는 문제 개선</li><li>구글 스킵 버튼에 포커스가 가지 않는 문제 조치</li><li>HTTP 응답이 성공적이지 않으면 dns lookup을 재시도하도록 개선</li></ol> |
| 3.9.27 | 2025.02.04 | **New** <ol><li>어뎁터블 광고 편성 기능 추가<ul><li>엔딩 소재를 일괄 스킵하게 하는 설정 추가 (skipAllFollowingEndingAds)</li><li>채움 광고를 일괄 편성하게 하는 설정 추가 (appendFillerAdsAllAtOnce)</li><li>스킵 시 추가 광고 편성 기능 개선</li></ul></li></ol> **BugFix** <ol><li>광고 스킵 후 남은 광고 시간 만큼 화면이 정지하는 문제 수정</li><li>API 응답에 Content-Encoding: gzip 지원</li><li>광고 편성이 중지되면, 프로그래매틱 요청 작업도 함께 중지되도록 개선</li><li>구글 광고 "extraPlay" 추가 시 구글 트랙킹이 되지 않는 문제 수정</li></ol> |
| 3.9.21 | 2024.11.04 | **New** <ol><li>중간 진입 광고 기능 지원</li></ol> |
| 3.9.17 | 2024.10.10 | **New** <ol><li>프로그래매틱 기능 개선<ol><li>광고 응답시 시간이 남는 경우 fallback 호출 기능 지원</li></ol></li><li>Android OS 14 지원</li></ol> **BugFix** <ol><li>구글 timeout일 경우 timeout으로 서버 로깅하도록 수정</li><li>프로그래매틱 광고 요청 timeout 전에 광고 응답 대기 시간이 끝나는 경우 광고 재생 오류 수정</li></ol> |
| 3.9.5 | 2023.12.21 | **BugFix** <ol><li>프로그래매틱 광고 Request가 되지 않는 문제 수정</li><li>재생 목록 추가 시 재생 시간 계산 오류 수정</li><li>재생 목록 추가 시 간헐적으로 동시성 오류로 인해 재생 목록 생성하지 못하는 문제 수정</li></ol> |
| 3.9.4 | 2023.08.10 | **New** <ol><li>광고 재생 목록 추가 기능 지원</li><li>AD Trigger 기능을 지원</li><li>Oma Update를 통해서 App 업데이트 하는 기능 지원</li></ol> **Feature** <ol><li>재생 목록 추가 시 남은 시간 계산 로직 개선</li><li>프로그래매틱 광고 소재 검수 요청 시 영역 정보 추가하여 전송하도록 개선</li><li>프로그래매틱 광고도 추가 재생할 수 있도록 개선</li></ol> **BugFix** <ol><li>프로그래매틱 광고 트래킹 로그 전송시 전송 시간이 맞지않는 문제 수정</li><li>프로그래매틱 광고 응답이 오기전 광고 목록 구성이 완료되는 문제 수정</li><li>간헐적으로 프로그래매틱 광고 트래킹 로그 호출이 누락되는 문제 수정</li><li>키즈 채널에서 워터마크 표시 안되는 문제 수정</li><li>프로그래매틱 광고 노출 보고시 간헐적으로 exception발생하는 문제 수정</li><li>프로그래매틱 광고의 노출 보고시 playTime 값이 실제 재생 시간과 다른 문제 수정</li><li>재생 목록 추가 기능 동작 시 광고 종료 후 재생 목록 추가 시도하는 문제 수정</li><li>프로그래매틱 광고 응답이 없을 때 fallback 재시도 안하는 문제 수정</li><li>프로그래매틱 광고 요청 URL의 매크로 값 치환이 제대로 되지 않는 문제 수정</li><li>중복된 광고 재생시 노출로그가 누락되는 문제 수정</li></ol> |
| 3.9.3 | 2022.12.28 | **Feature** <ol><li>OS12 대응을 위해서 파일 공유 방식을 파일 복사 방식에서 퍼미션 방식으로 개선</li><li>프로그래매틱 광고의 서버 로깅을 동기 처리하던 것을 비동기 처리하도록 개선</li></ol> **BugFix** <ol><li>프로그래매틱 광고에서 응답받은 소재가 동일할 경우 노출 로그의 애드 정보가 동일하게 올라가는 문제 수정</li></ol> |
| 3.9.2 | 2022.10.14 | **Feature** <ol><li>프로그래매틱 광고 소재가 동시 다운로드 되지 않고 한 번에 하나씩만 다운로드 되도록 큐 방식으로 개선</li><li>재생 목록 생성 시 첫 번째 광고를 내부 소재에서 로컬 캐시가 된 광고도 사용할 수 있도록 개선</li></ol> **BugFix** <ol><li>주기적으로 프로그래매틱 광고 요청하는 경우 빈응답 시 프로그래매틱 광고 요청 주기대로 요청하지 않고 모니터링 주기마다 요청하는 문제 수정</li><li>광고 재생 전 오류 발생시 다음 광고 재생 후 노출로그가 잘 못 올라가는 문제 수정</li></ol> |
| 3.9.1 | 2022.07.12 | **New** <ol><li>광고가 재생중일 때 프로그래매틱 광고 소재를 다운로드 할 수 있는 기능 지원</li></ol> **Feature** <ol><li>인증 시에 연동하고 있는 SDK 버전을 파라미터로 전달하도록 개선</li><li>프로그래매틱 광고가 OnCue 방식일 때, 다운로드가 완료되지 않아도 재생 목록에 추가되도록 개선</li><li>광고 목록의 첫 번째는 내부 광고로 선정하도록 개선</li><li>프로그래매틱 광고 소재 다운로드시에 지우고 새로 받는 방식에서 덮어쓰는 방식으로 개선</li><li>프로그래매틱 광고 소재 다운로드 속도를 인증 응답 시에 받은 MaxLazyDownloadBandwidth 값을 사용하도록 개선</li><li>인증 완료 후 최대 할당 디스크 용량을 초과한 캐시 파일이 있을 경우 삭제하도록 개선</li></ol> |
| 3.9.0 | 2022.03.17 | **Feature** <ol><li>프로그래매틱 광고 onCue 기능 지원</li><li>프로그래매틱 광고에 대해서 스트리밍 재생 방식 지원</li><li>멀티 구글 광고 지원</li></ol> |
| 3.8.4 | 2021.11.08 | **BugFix** <ol><li>서버 ip가 변경 되었을 때 ip look 테이블이 갱신되지 않는 문제 수정</li><li>TLS 오류로 통신이 되지 않는 문제 수정</li></ol> |
| 3.8.0 | 2021.08.27 | **New** <ol><li>구글 광고 지원</li><li>Digital Cue(SCTE-35) 지원</li><li>프로그래매틱 광고 지원</li></ol> |

*   **New** : 신규 기능
*   **Feature** : 기존 기능 수정
*   **BugFix** : 오류 수정
