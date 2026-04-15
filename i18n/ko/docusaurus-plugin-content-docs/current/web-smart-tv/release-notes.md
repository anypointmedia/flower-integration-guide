---
sidebar_position: 100
sidebar_label: "릴리즈 노트"
---

# HTML5 SDK

| **버전** | **날짜** | **변경내용** |
| ---| ---| --- |
| 2.3.0 | 2026.02.25 | **BugFix** <ol><li>광고 마커가 있는 라이브 채널 진입 시 시간 불일치 수정</li><li>장시간 재생 시 발생하는 시간 불일치 수정</li></ol> **Feature** <ol><li>긴 윈도우의 플레이리스트 처리 시 성능 개선</li><li>인터랙티브 광고 UI 개선</li><li>TV 환경에서 광고의 "자세히 보기" 선택 시 QR 코드 표시 기능 추가</li></ol> |
| 2.2.2 | 2026.01.09 | **BugFix** <ol><li>트래킹 시간 불일치 문제 수정</li></ol> **Feature** <ol><li>광고 트래킹 로직 개선</li><li>현재 시간 및 타임존 URL 매크로 추가</li></ol> |
| 2.2.1 | 2025.12.19 | **Feature** <ol><li>Bitmovin 플레이어 사용 시 광고 트래킹 개선</li><li>VOD 광고 요청 타임아웃을 3초에서 5초로 변경</li></ol> |
| 2.2.0 | 2025.12.08 | **Feature** <ol><li>HLS/DASH 플레이리스트 조작 속도 개선</li></ol> **BugFix** <ol><li>삼성 TV 모델에서 광고가 재생되지 않는 문제 수정</li><li>HLS/DASH 스트림에서 발생하는 조작 오류 수정</li></ol> |
| 2.1.3 | 2025.10.14 | **BugFix** <ol><li>원본 플레이리스트 URL이 리다이렉트될 때 광고를 삽입할 수 없는 문제 수정</li></ol> |
| 2.1.2 | 2025.08.26 | **BugFix** <ol><li>오디오 전용 미디어가 포함된 HLS 플레이리스트에서 광고 삽입 오류 수정</li></ol> |
| 2.1.1 | 2025.08.21 | **Feature** <ol><li>Linear TV에서 원본 플레이리스트 응답이 비어있을 때 응답 개선</li></ol> |
| 2.1.0 | 2025.07.30 | **Feature** <ol><li>HLS의 EXT-X-MEDIA-SEQUENCE 값이 variant별로 다른 플레이리스트 형식 지원</li></ol> |
| 2.0.2 | 2025.07.21 | **BugFix** <ol><li>HLS 플레이리스트의 속성 구분자에 공백이 포함되어있을 경우 처리 추가</li></ol> |
| 2.0.1 | 2025.07.07 | **BugFix** <ol><li>VOD 및 전면광고 재생 시 발생하는 KotlinNothingValueException 오류 수정</li></ol> |
| 2.0.0 | 2025.06.27 | **Feature** <ol><li>리니어 채널에서 스킵 광고 기능 지원</li><li>손쉬운 SDK 정합을 위한 `FlowerHlsjs` 추가</li></ol> |
| 1.3.0 | 2025.01.14 | **BugFix** <ol><li>VOD 광고를 재생할 때 플랫폼별로 최적의 소재를 선택하도록 수정</li><li>VOD 광고 로딩 속도 개선</li><li>리니어 TV 재생 시 플레이리스트 처리시간 개선</li><li>`requestVodAd()` API의 `durationMs` 파라미터에 소숫점 값이 입력되었을 때 오류 수정</li></ol> **Feature** <ol><li>리니어 TV 프리롤 광고 기능 추가</li><li>로그 레벨 개선</li></ol> |
| 1.2.17 | 2024.11.15 | **BugFix** <ol><li>로그 레벨을 설정해도 무시되고 모든 로그가 출력되는 문제 수정</li><li>HLS 스트림 URL의 파라미터에 인코딩되지 않은 특수문자가(예: 슬래시 "/") 포함되어있는 경우 스트림을 재생할 수 없는 오류 수정</li><li>HLS 플레이리스트에 포함된 세그먼트가 SDK 허용량보다 많을 때 스트림을 재생할 수 없는 오류 수정</li></ol> |
| 1.2.16 | 2024.10.21 | **BugFix** <ol><li>DASH 스트림 URL에 인코딩되지 않은 URL 파라미터가 있을 때 스트림이 재생되지 않는 문제 수정</li><li>DASH 스트림에 필러 광고를 반복해서 재생할 때 발생하는 버퍼링 문제 수정</li></ol> |
| 1.2.15 | 2024.09.13 | **BugFix** <ol><li>HLS 플레이리스트 파싱 중 알 수 없는 태그 또는 속성이 있을 때 실패하는 문제 수정</li></ol> |
| 1.2.14 | 2024.09.11 | **Feature** <ol><li>광고 요청의 성공/실패 여부 상관없이 응답 코드, 요청 URL, 요청 헤더를 로그에 추가</li></ol> **BugFix** <ol><li>Wrapper URL이 포함된 VAST XML 파싱 시 발생하는 오류 수정</li></ol> |
| 1.2.13 | 2024.09.06 | **BugFix** <ol><li>특정 형식의 광고 응답 및 소재 플레이리스트 파싱 오류 수정</li></ol> |
| 1.2.12 | 2024.09.03 | **Feature** <ol><li>광고 요청 시 타겟팅 정보 개선</li></ol> |
| 1.2.11 | 2024.08.19 | **BugFix** <ol><li>DASH 스트림을 재생하며 광고를 요청할 때 타임아웃 시간을 지나치게 적게 계산하는 문제 수정</li></ol> |
| 1.2.10 | 2024.08.09 | **Feature** <ol><li>스트림 재생 중 타겟팅 정보를 교체할 수 있는 `changeChannelExtraParams()` API 추가</li></ol> |
| 1.2.9 | 2024.07.26 | **Feature** <ol><li>광고 요청 시 사용자 정의 HTTP 헤더를 추가할 수 있는 `adTagHeaders` 파라미터 추가</li><li>스트림 요청 시 사용자 정의 HTTP 헤더를 추가할 수 있는 `channelStreamHeaders` 파라미터 추가</li></ol> **BugFix** <ol><li>스트림 URL이 다른 URL로 리다이렉트될 때 발생하는 블랙 스크린 오류 수정</li></ol> |
| ~~1.2.8~~<br/>Deprecated | 2024.07.22 | **BugFix** <ol><li>SDK가 JavaScript 모듈 방식으로 로드될 때 발생하는 TypeError(Illegal invocation at Node.get) 오류 수정</li></ol> |
| ~~1.2.7~~<br/>Deprecated | 2024.07.08 | **Feature** <ol><li>DRM이 적용된 DASH 스트림 광고 삽입 지원</li></ol> |
| ~~1.2.6~~<br/>Deprecated | 2024.05.16 | **Feature** <ol><li>프로덕션 로그 저장 주기 변경</li></ol> **BugFix** <ol><li>Bitmovin 플레이어 오류에 대한 방어 로직 추가</li><li>플레이어가 소멸되었을 경우 SDK 리셋 처리</li></ol> |
| ~~1.2.5~~<br/>Deprecated | 2024.04.26 | **Feature** <ol><li>Linear TV 기능 개선<ol><li>광고와 큐시간의 누적 오차 계산 기능 개선</li><li>원본 HLS의 EXT-X-PROGRAM-DATE-TIME 태그 사용 처리</li></ol></li><li>VAST 이벤트 트래킹 병렬 처리</li><li>URL 매크로 추가(CACHEBUSTING)</li></ol> **BugFix** <ol><li>로깅을 해제에도 일부 로그가 기록되는 오류 수정</li></ol> |
| ~~1.2.4~~<br/>Deprecated | 2024.04.15 | **Feature** <ol><li>광고 요청 오류 처리 개선</li><li>LG webOS의 LGUDID와 삼성 Tizen의 TIFA 지원</li></ol> **BugFix** <ol><li>LG webOS 4.0 버전에서 발생하는 XML 파싱 문제 수정</li><li>광고 click UI 문제 수정</li></ol> |
| ~~1.2.3~~<br/>Deprecated | 2024.03.26 | **BugFix** <ol><li>연이어진 광고 큐에서 필러 광고를 잘못 트래킹하는 문제 수정</li></ol> |
| ~~1.2.2~~<br/>Deprecated | 2024.03.15 | **Feature** <ol><li>VOD 광고 삽입 기능 추가</li></ol> |
| ~~1.2.1~~<br/>Deprecated | 2024.03.11 | **BugFix** <ol><li>LG와 삼성 스마트 티비에서 발생하는 멈춤 문제 수정</li></ol> |
| ~~1.2.0~~<br/>Deprecated | 2024.01.16 | **Feature** <ol><li>매니페스트 조작 기능 안정화</li></ol> **BugFix** <ol><li>스트림 variant 전환 시 광고 붙이는 오류 수정</li></ol> |
| ~~1.0.0~~<br/>Deprecated | 2022.03.22 | **New** <ol><li>Flower Solution 연동 지원</li><li>프로그래매틱 광고 지원</li><li>Direct I/O 광고 지원</li><li>HLS 스트림 지원</li><li>SCTE-35 CUE TAG 지원</li><li>구글 광고 지원</li></ol> |

*   **New** : 신규 기능
*   **Feature** : 기존 기능 수정
*   **BugFix** : 오류 수정
