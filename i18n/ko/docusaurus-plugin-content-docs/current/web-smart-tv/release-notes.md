---
sidebar_position: 100
sidebar_label: "릴리즈 노트"
---

# HTML5 SDK 릴리즈 노트

| **버전** | **날짜** | **변경내용** |
| ---| ---| --- |
| 2.3.17 | 2026.10.14 | **New** <ol><li>`FlowerSdk.setIgnoreAdBreakInPIPMode(ignore)` 추가. [PIP 모드 지원](./getting-started/pip-mode-support) 참고</li><li>`FlowerAdsManager.requestVodAd`에 선택 매개변수 `requestTimeout`, `minPrepareDuration`, `rewindDuration`(밀리초) 추가</li></ol> **Feature** <ol><li>기본 설정(`setIgnoreAdBreakInPIPMode(true)`)에서 VOD 광고는 본편 위에 표시되는 SDK의 별도 video 요소에서 재생되며, Mid-roll의 경우 SDK가 본편을 일시정지하고 광고 구간 종료 후 재개함. VOD 광고 구간 전후로 본편을 일시정지, 탐색, 재로드하지 말 것. `false`로 설정하면 앱의 플레이어(hls.js, Bitmovin Player) 안에서 광고를 재생하여 PIP 모드에서도 광고가 계속 재생됨</li><li>`setIgnoreAdBreakInPIPMode(true)`일 때 PIP 모드 진입 시 재생 중이던 광고를 일시정지하며, PIP 모드에서 돌아오면 재개하도록 변경</li><li>Mid-roll의 `onPrepare`가 본편이 Mid-roll 위치에 도달했을 때 호출되도록 변경. 광고 요청은 기존과 같이 해당 위치보다 `requestTimeout + minPrepareDuration`만큼 먼저 이루어짐</li><li>VOD Ad Break가 광고 재생 오류로 실패하면 SDK가 `onError`를 호출하기 전에 본편을 되돌려 놓도록 변경. Mid-roll이었다면 본편은 이미 중단 지점보다 `rewindDuration`만큼 앞에서 다시 재생 중임(`setIgnoreAdBreakInPIPMode(false)`인 경우 광고 플레이어가 실패한 광고를 버리고 앱의 플레이어에 원래 본편 소스를 다시 로드함). VOD `onError` 핸들러에서 본편을 정지, 탐색, 재로드하지 말 것. 프리롤 실패 시에는 본편이 시작되지 않았다면 시작할 것. 실패한 Ad Break에 대해 `onCompleted`도 호출될 수 있으며 순서는 정해져 있지 않음. [VOD 광고 적용](./ad-insertion/vod/vod-ad-implementation) 참고</li><li>치명적 플레이어 오류(hls.js 또는 FlowerHls의 치명적 `hlsError`, Shaka Player의 CRITICAL `error`, dash.js 또는 Bitmovin Player의 `error`)로 본편 재생이 중단되면, 플레이어 어댑터가 장애 1건당 한 번 `playback unrecoverable (<reason>) - url: <url>` 메시지와 플레이어의 오류를 `cause`로 담아 `onError`를 호출하도록 변경. 라이브 채널은 광고 매니저를 정지하고 `changeChannelUrl`부터 다시 시작하며, VOD는 본편을 다시 로드하거나 오류를 표시할 것</li></ol> **BugFix** <ol><li>`rewindDuration`이 적용되지 않던 오류 수정. Mid-roll 이후 본편은 중단된 위치보다 `rewindDuration`(기본 5000ms)만큼 앞에서 재개되며, 같은 Mid-roll은 다시 재생되지 않음</li><li>본편 위치가 2초 간격의 확인 구간에 들어올 때만 광고 요청이 이루어져 Mid-roll 광고 브레이크가 간헐적으로 누락되던 오류 수정</li><li>VAST 응답에 광고가 없을 때 `onAdBreakSkipped`(reason 1, No Ad)가 호출되지 않던 오류 수정</li><li>광고 브레이크 중 플레이리스트의 라이브 엣지가 진행되지 않아 HLS 라이브 재생이 멈추던 오류 수정</li><li>HLS, DASH에서 광고 브레이크 끝의 광고가 cue-in에서 잘린 경우에도 트래킹 이벤트(`midpoint`, `thirdQuartile`, `complete`)와 광고 UI가 본편 위에서 계속되던 오류 수정</li><li>Linear TV 프리롤 준비 중에 `stop()`을 호출하면 이후 `onPrepare`가 호출되고 본편이 일시정지되던 오류 수정</li><li>FlowerConfig로 설정된 OMRT 값이 앱 재시작 후 유지되지 않던 오류 수정</li></ol> |
| 2.3.16 | 2026.10.05 | **Feature** <ol><li>동일 광고 브레이크 내 광고 중복 허용 옵션 추가</li></ol> **BugFix** <ol><li>HLS에서 cue-in 태그가 일찍 들어오는 경우 광고 브레이크 종료 이벤트가 늦게 전달되는 오류 수정</li></ol> |
| 2.3.15 | 2026.09.29 | **BugFix** <ol><li>DASH DRM 스트림에서 `ContentProtection` 값이 누락되는 오류 수정</li></ol> |
| 2.3.14 | 2026.09.16 | **BugFix** <ol><li>Manifest Manipulation을 사용하지 않는 경우 `FlowerAdsManager` 종료 처리 후 다음 광고 요청 시 발생하는 NPE 문제 수정</li></ol> |
| 2.3.13 | 2026.09.03 | **BugFix** <ol><li>Linear TV HLS에서 재생목록 윈도우가 슬라이딩되지 않고 증가하는 케이스 대응</li></ol> |
| 2.3.12 | 2026.09.01 | **BugFix** <ol><li>DRM이 적용된 HLS 라이브 스트림에서 세그먼트 키 설정이 누락되는 케이스 수정</li></ol> |
| 2.3.11 | 2026.08.27 | **Feature** <ol><li>DASH 스트림의 원본 스트림 오류 보정 기능 추가</li><li>Linear TV 환경에서 광고 스킵 기능 개선</li><li>DASH 세그먼트 타임라인 추출 로직 개선</li><li>Linear TV 광고 브레이크 구간에서 스트림 variant 변경 시 HLS 조작 안정화</li><li>Linear TV 진입 시 DASH 광고 구간의 잔여 시간 재활용 기능 추가(23초 이상 남은 경우)</li><li>Linear TV DASH 스트림의 광고 스킵 기능 추가</li><li>Shaka Player 지원 추가</li></ol> |
| 2.3.10 | 2026.08.05 | **BugFix** <ol><li>m3u8 플레이리스트 URL이 리다이렉트될 때 광고가 삽입되지 않는 문제 수정</li></ol> |
| 2.3.8 | 2026.06.29 | **Feature** <ol><li>스트림 내 서로 다른 SCTE-35 이벤트의 splice event id 재사용 지원</li></ol> **BugFix** <ol><li>`FlowerAdView` 재사용 시 자원 해제 오류 수정</li></ol> |
| 2.3.7 | 2026.05.21 | **Feature** <ol><li>광고 요청 시 애드 브레이크 구분 값 추가 전달</li><li>광고 추적 방지 매크로 지원 추가</li></ol> |
| 2.3.6 | 2026.05.11 | **Feature** <ol><li>`FlowerAdsManagerListener`에 개별 광고 단위의 재생 시작 시 광고 메타데이터를 전달하는 `onAdPlay` 이벤트 추가</li><li>`FlowerAdsManagerListener`에 사용자의 광고 상호작용(`learn_more`, `skip`)을 전달하는 `onAdUserAction` 이벤트 추가</li><li>`AdInfo`에 `playTime`, `isClickable`, `sourceType` 필드 추가</li><li>SDK 버전을 조회할 수 있는 `FlowerSdk.getVersion` API 추가</li></ol> **BugFix** <ol><li>광고 트래킹 시 간헐적으로 발생하는 `ConcurrentModificationException` 오류 수정</li></ol> |
| 2.3.5 | 2026.05.06 | **Feature** <ol><li>프로그래매틱 광고 요청에 필요한 nonce를 생성하기 위한 Google PAL SDK 지원 추가</li><li>채널 진입 시 캐시 갱신을 유효시간으로 판단하도록 개선</li><li>Chrome 엔진 69 이상 대응 코드 적용</li></ol> |
| 2.3.4 | 2026.04.21 | **BugFix** <ol><li>XMLHttpRequest에서 원본 URL의 Query String을 URL encoding 없이 원본 그대로 사용하도록 수정</li></ol> |
| 2.3.3 | 2026.04.15 | **Feature** <ol><li>Linear TV 진입 광고 이벤트 추가</li><li>`FlowerAdsManagerListener`의 `onAdSkipped`를 `onAdBreakSkipped`로 변경</li></ol> |
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
