---
sidebar_position: 100
sidebar_label: "릴리즈 노트"
---

# iOS SDK

| **버전** | **날짜** | **변경내용** |
| ---| ---| --- |
| 2.2.3 | 2026.01.16 | **Feature** <ol><li>네트워크가 불안정할 때 광고 트래킹 개선</li><li>디바이스 핑거프린트 확인 절차 개선</li><li>VOD 광고 요청 타임아웃을 3초에서 5초로 변경</li><li>디바이스 핑거프린트 라이브러리를 네이티브 라이브러리로 교체</li></ol> **BugFix** <ol><li>광고 요청 및 트래킹 스레드 분리</li><li>VOD에서 광고 사이에 메인 콘텐츠가 표시되는 문제 수정</li></ol> |
| 2.2.0 | 2025.12.03 | **Feature** <ol><li>FlowerAVPlayer에 VOD 재생 지원 추가</li><li>Flower Player를 사용하지 않는 경우에도 앱이 PiP 모드 상태를 SDK에 전달할 수 있도록 `FlowerSdk.notifyPictureInPictureModeChanged()` API 추가</li></ol> **Feature** <ol><li>긴 재생 윈도우의 스트림 재생 시 광고 트래킹 개선</li></ol> **BugFix** <ol><li>VMAP 매니페스트 파싱이 되지 않는 문제 수정</li><li>스트림 전환 시 발생하는 크래시 수정</li><li>HLS/DASH 스트림에서 발생하는 조작 오류 수정</li></ol> |
| 2.1.4 | 2025.10.13 | **BugFix** <ol><li>DRM 스트림을 재생할 때 발생하는 블랙 스크린 이슈 수정</li></ol> |
| 2.1.3 | 2025.08.26 | **BugFix** <ol><li>플레이어 오류 시점에 발생하는 크래시 수정</li><li>오디오 전용 미디어가 포함된 HLS 플레이리스트에서 광고 삽입 오류 수정</li><li>되감기 버퍼가 긴 스트림에서 플레이리스트 조작 오류 수정</li><li>UIKit에서 FlowerAVPlayer 사용할 때 발생하는 크래시 수정</li></ol> |
| 2.1.2 | 2025.08.19 | **BugFix** <ol><li>래퍼 플레이어 재생 시 발생하는 크래시 수정</li></ol> |
| 2.1.1 | 2025.08.14 | **Feature** <ol><li>Linear TV에서 원본 플레이리스트 응답이 비어있을 때 응답 개선</li></ol> **BugFix** <ol><li>광고 설정 없이 FlowerAVPlayer를 종료할 때 발생하는 NullPointerException 수정</li></ol> |
| ~~2.1.0~~<br/>Deprecated | 2025.07.30 | **Feature** <ol><li>HLS의 EXT-X-MEDIA-SEQUENCE 값이 variant별로 다른 플레이리스트 형식 지원</li></ol> |
| 2.0.3 | 2025.07.21 | **BugFix** <ol><li>HLS 플레이리스트의 속성 구분자에 공백이 포함되어있을 경우 처리 추가</li></ol> |
| 2.0.2 | 2025.07.07 | **BugFix** <ol><li>VOD 및 전면 광고 재생 시 발생하는 KotlinNothingValueException 오류 수정</li></ol> |
| 2.0.1 | 2025.06.19 | **BugFix** <ol><li>`FlowerAVPlayer`를 상속할 수 있도록 open class로 변경</li></ol> |
| 2.0.0 | 2025.06.05 | **Feature** <ol><li>리니어 채널에서 스킵 광고 기능 지원</li><li>손쉬운 SDK 정합을 위한 `FlowerAVPlayer` 추가</li></ol> |
| 1.1.0 | 2025.01.14 | **BugFix** <ol><li>VOD 광고를 재생할 때 플랫폼별로 최적의 소재를 선택하도록 수정</li><li>VOD 광고 로딩 속도 개선</li><li>리니어 콘텐츠 재생 시 플레이리스트 처리시간 개선</li><li>리니어 콘텐츠 재생 시 URL 쿼리 파라미터를 제대로 핸들링하지 못하는 오류 수정</li></ol> **Feature** <ol><li>리니어 콘텐츠용 프리롤 광고 기능 추가</li><li>로그 레벨 개선</li></ol> |
| 1.0.14 | 2024.12.09 | **Feature** <ol><li>VOD 광고를 재생할 때 플랫폼별로 최적의 소재를 선택하도록 수정</li></ol> |
| 1.0.13 | 2024.11.28 | **BugFix** <ol><li>SDK를 정지할 때 종종 알 수 없는 오류가 발생하는 문제 수정</li><li>VOD 광고가 재생되고 있을 때 SDK를 정지하면 발생할 수 있는 앱 크래시 수정</li></ol> |
| 1.0.12 | 2024.11.15 | **BugFix** <ol><li>로그 레벨을 설정해도 무시되고 모든 로그가 출력되는 문제 수정</li><li>HLS 스트림 URL의 파라미터에 인코딩되지 않은 특수문자가(예: 슬래시 "/") 포함되어있는 경우 스트림을 재생할 수 없는 오류 수정</li><li>HLS 플레이리스트에 포함된 세그먼트가 SDK 허용량보다 많을 때 스트림을 재생할 수 없는 오류 수정</li></ol> |
| 1.0.11 | 2024.09.13 | **BugFix** <ol><li>HLS 플레이리스트 파싱 중 알 수 없는 태그 또는 속성이 있을 때 실패하는 문제 수정</li></ol> |
| 1.0.10 | 2024.09.11 | **Feature** <ol><li>광고 요청의 성공/실패 여부 상관없이 응답 코드, 요청 URL, 요청 헤더를 로그에 추가</li></ol> **BugFix** <ol><li>Wrapper URL이 포함된 VAST XML을 파싱할 때 발생하는 오류 수정</li></ol> |
| 1.0.9 | 2024.09.06 | **BugFix** <ol><li>특정 형식의 광고 응답 및 소재 플레이리스트 파싱 오류 수정</li></ol> |
| 1.0.8 | 2024.09.03 | **Feature** <ol><li>광고 요청 시 타겟팅 정보 개선</li></ol> **BugFix** <ol><li>`MediaPlayerAdapter`를 직접 구현했을 때 발생하는 앱 크래시 수정</li><li>재생할 수 없는 URL을 재생할 때 발생하는 앱 크래시 수정</li></ol> |
| 1.0.7 | 2024.08.28 | **BugFix** <ol><li>지원되지 않는 플레이어를 사용하기 위한 `MediaPlayerAdapter` 인터페이스가 SDK 외부로 노출되지 않은 문제 수정</li><li>사용되지 않는 `ApplicationContext` 인자 제거</li></ol> |
| 1.0.6 | 2024.08.09 | **Feature** <ol><li>VOD 광고 삽입 기능 추가</li><li>URL 매크로 추가(CACHEBUSTING)</li><li>`changeChannelUrl()` API에 광고 요청 시 사용자 정의 HTTP 헤더를 추가할 수 있는 `adTagHeaders` 파라미터 추가</li><li>`changeChannelUrl()` API에 스트림 요청 시 사용자 정의 HTTP 헤더를 추가할 수 있는 `channelStreamHeaders` 파라미터 추가</li><li>스트림 재생 중 타겟팅 정보를 교체할 수 있는 `changeChannelExtraParams()` API 추가</li></ol> **BugFix** <ol><li>연이어진 광고 큐에서 필러 광고를 잘못 트래킹하는 문제 수정</li><li>`setLoglevel('Off')` API로 로깅을 해제해도 일부 로그가 기록되는 오류 수정</li></ol> |
| 1.0.5 | 2024.03.15 | **Feature** <ol><li>VOD 광고 삽입 기능 추가</li></ol> **BugFix** <ol><li>PIP 모드로 리니어 콘텐츠를 재생할 때 발생하는 블랙 스크린 문제 수정</li></ol> |
| ~~1.0.4~~<br/>Deprecated | 2024.01.23 | **BugFix** <ol><li>`FlowerAdsManager.changeChannelUrl()`을 호출하기 전에 플레이어가 채널을 재생 중일 때 발생하는 앱 크래시 문제 수정</li></ol> |
| ~~1.0.3~~<br/>Deprecated | 2024.01.16 | **BugFix** <ol><li>Background 모드 시 동작 오류 수정</li></ol> |
| ~~1.0.2~~<br/>Deprecated | 2023.09.19 | **New** <ol><li>커스텀 CUE TAG 지원</li></ol> |
| ~~1.0.1~~<br/>Deprecated | 2023.08.21 | **New** <ol><li>DRM이 적용된 HLS 스트림 지원</li><li>MPEG-DASH 스트림 지원</li></ol> |
| ~~1.0.0~~<br/>Deprecated | 2022.03.22 | **New** <ol><li>Flower Solution 연동 지원</li><li>프로그래매틱 광고 지원</li><li>Direct I/O 광고 지원</li><li>HLS 스트림 지원</li><li>SCTE-35 CUE TAG 지원</li><li>구글 광고 지원</li></ol> |

*   **New** : 신규 기능
*   **Feature** : 기존 기능 수정
*   **BugFix** : 오류 수정
