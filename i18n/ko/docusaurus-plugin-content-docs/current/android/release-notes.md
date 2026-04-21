---
sidebar_position: 100
sidebar_label: "릴리즈 노트"
---

# Android SDK

| **버전** | **날짜** | **변경내용** |
| ---| ---| --- |
| 2.9.9 | 2026.04.21 | **Feature** <ol><li>PIP 모드일 때 광고 무시 설정 추가 `FlowerSdk.setIgnoreAdBreakInPIPMode`</li><li>PIP 모드일 때 광고 미사용 시 광고 플레이어 별도 사용 처리</li><li>LinearTv에서 광고 직접 재생 방식일 경우 종료 시 잔여 리소스 해제 처리</li><li>광고 관련 버튼이 하나일 때 Up, Down 키 이벤트 처리 무시</li></ol> |
| 2.9.8 | 2026.04.15 | **Feature** <ol><li>Linear TV 진입 광고 이벤트 추가</li><li>`FlowerAdsManagerListener`의 `onAdSkipped`를 `onAdBreakSkipped`로 변경</li><li>Direct ad playback 방식에서 광고 응답이 없는 경우 `requestChannelAd`가 `FlowerError`를 throw하도록 변경</li></ol> |
| 2.9.6 | 2026.03.26 | **Feature** <ol><li>광고를 직접 재생할 때 재생 시간 계산 로직 개선</li></ol> **BugFix** <ol><li>Wrapper 광고에서 트래킹 URL이 누락되는 버그 수정</li></ol> |
| 2.9.5 | 2026.03.26 | **Feature** <ol><li>Kotlin 버전을 2.0.21로 다운그레이드</li></ol> |
| 2.9.4 | 2026.03.19 | **Feature** <ol><li>독립 광고 플레이어 사용 시 이벤트 트래킹 정확도 개선</li></ol> |
| 2.9.2 | 2026.03.09 | **Feature** <ol><li>직접 광고 재생(매니퓰레이션 없이) 방식의 리니어 TV에서 점진적 광고 포딩 지원</li><li>`requestChannelAd`가 코루틴 Flow를 통해 응답을 반환하도록 변경</li></ol> |
| 2.9.0 | 2026.02.25 | **BugFix** <ol><li>광고 마커가 있는 라이브 채널 진입 시 시간 불일치 수정</li><li>장시간 재생 시 발생하는 시간 불일치 수정</li></ol> **Feature** <ol><li>긴 윈도우의 플레이리스트 처리 시 성능 개선</li><li>인터랙티브 광고 UI 개선</li><li>TV 환경에서 광고의 "자세히 보기" 선택 시 QR 코드 표시 기능 추가</li></ol> |
| 2.8.3 | 2026.01.09 | **BugFix** <ol><li>트래킹 시간 불일치 문제 수정</li></ol> **Feature** <ol><li>광고 트래킹 로직 개선</li><li>현재 시간 및 타임존 URL 매크로 추가</li><li>XML 콘텐츠 파싱 로직 개선</li><li>VOD 광고 요청 타임아웃을 3초에서 5초로 변경</li></ol> |
| 2.8.2 | 2025.12.15 | **BugFix** <ol><li>타임아웃 발생 시 `requestChannelAd()` API가 빈 광고 목록과 성공 응답을 반환하는 문제 수정</li></ol> |
| 2.8.1 | 2025.12.12 | **BugFix** <ol><li>WebView가 없는 기기에서 발생하는 크래시 수정</li><li>DASH 스트림 재생 시 ExoPlayer에서 발생하는 광고 트래킹 문제 수정</li></ol> |
| 2.8.0 | 2025.12.02 | **Feature** <ol><li>Flower Player를 사용하지 않는 경우에도 앱이 PiP 모드 상태를 SDK에 전달할 수 있도록 `FlowerSdk.notifyPictureInPictureModeChanged()` API 추가</li></ol> **BugFix** <ol><li>광고 재생 중 또는 직전에 스트림이 끊기는 문제 수정</li><li>VOD 광고 재생 중 발생할 수 있는 데드락 문제 수정</li><li>특정 스트림과 광고 간 전환 시 검은 화면이 나타나는 문제 수정</li></ol> |
| 2.7.3 | 2025.11.14 | **BugFix** <ol><li>프리롤 광고 재생 전 리니어 TV 콘텐츠가 표시되는 문제 수정. 이 수정은 Flower 플레이어를 요구함.</li><li>광고 재생 중 또는 직전에 발생하는 영상 끊김 문제 개선</li></ol> |
| 2.7.2 | 2025.11.13 | **BugFix** <ol><li>`requestChannelAd()` API에서 콜백 오류 발생 시 `onPrepare()` 콜백이 두 번 호출되는 문제 수정</li></ol> |
| 2.7.1 | 2025.11.11 | **Feature** <ol><li>`requestChannelAd()`의 transactionId 파라미터 타입을 Int에서 Long으로 변경</li></ol> |
| 2.7.0 | 2025.11.10 | **Feature** <ol><li>`requestChannelAd()` API 인터페이스에 트랜잭션 ID 및 응답 상태 포함하도록 변경</li></ol> **BugFix** <ol><li>커스텀 MediaPlayerAdapter 구현체와 함께 `enterChannel()` 사용 시 발생하는 크래시 수정</li></ol> |
| 2.6.2 | 2025.10.30 | **BugFix** <ol><li>리니어 TV에서 광고 스킵 시 발생할 수 있는 조작 오류 수정</li></ol> |
| 2.6.1 | 2025.10.29 | **BugFix** <ol><li>ExoPlayer에서 TextureView 사용 시 광고 뷰가 표시되지 않는 문제 수정</li></ol> |
| 2.6.0 | 2025.10.17 | **Feature** <ol><li>구글 광고를 가능한 경우 인코딩 없이 즉시 재생하도록 개선</li></ol> |
| 2.5.1 | 2025.10.14 | **BugFix** <ol><li>스킵 가능한 광고가 스킵되지 않았는데도 예비 광고가 삽입되는 문제 수정</li></ol> |
| 2.5.0 | 2025.10.02 | **Feature** <ol><li>VOD 콘텐츠를 재생할 때 Flower Player 지원 추가</li><li>Bitmovin 플레이어를 감싸는 FlowerBitmovinPlayer 추가</li></ol> **BugFix** <ol><li>VOD 광고가 PIP 모드에서 재생되지 않는 문제 수정. 이 수정은 Flower 플레이어를 요구함.</li></ol> |
| 2.4.2 | 2025.10.02 | **BugFix** <ol><li>2.3.3에서 업그레이드된 코틀린 버전을 2.2.0에서 2.0.21로 롤백</li></ol> |
| 2.4.1 | 2025.09.22 | **Feature** <ol><li>`requestChannelAd()` API를 사용할 때 광고 로드 속도 개선</li></ol> **BugFix** <ol><li>캐시 파일을 위해 가용 스토리지 용량을 계산할 때 발생하는 오버플로우 수정</li></ol> |
| 2.4.0 | 2025.09.19 | **Feature** <ol><li>자체 광고 서빙 시스템을 사용할 때 광고 스킵 기능을 옵트아웃할 수 있는 `FlowerSdk.ignoreSkip()` API 추가</li></ol> |
| 2.3.3 | 2025.09.09 | **Feature** <ol><li>광고 로드 속도 개선</li></ol> |
| 2.3.2 | 2025.08.26 | **BugFix** <ol><li>플레이어 오류 시점에 발생하는 크래시 수정</li><li>오디오 전용 미디어가 포함된 HLS 플레이리스트에서 광고 삽입 오류 수정</li></ol> |
| 2.3.1 | 2025.08.19 | **BugFix** <ol><li>Linear TV midroll에서 구글 광고 재생 시 발생하는 크래시 수정</li></ol> |
| 2.3.0 | 2025.08.13 | **Feature** <ol><li>플레이리스트 조작 없이 광고를 요청하는 경우 지원</li></ol> |
| 2.2.0 | 2025.07.31 | **Feature** <ol><li>지원되지 않는 플레이어를 직접 정합할 수 있는 MediaPlayerAdapter 인터페이스 추가</li></ol> |
| 2.1.0 | 2025.07.30 | **Feature** <ol><li>HLS의 EXT-X-MEDIA-SEQUENCE 값이 variant별로 다른 플레이리스트 형식 지원</li></ol> |
| 2.0.2 | 2025.07.21 | **BugFix** <ol><li>HLS 플레이리스트의 속성 구분자에 공백이 포함되어 있을 경우 처리 추가</li></ol> |
| 2.0.1 | 2025.07.07 | **BugFix** <ol><li>VOD 및 전면 광고 재생 시 발생하는 KotlinNothingValueException 오류 수정</li></ol> |
| 2.0.0 | 2025.06.27 | **Feature** <ol><li>리니어 채널에서 스킵 광고 기능 지원</li><li>손쉬운 SDK 정합을 위한 `FlowerExoPlayer2` 및 `FlowerMedia3ExoPlayer` 추가</li><li>내부적으로 301 리다이렉트를 관리할 수 있도록 개선</li><li>DASH 플레이리스트 처리속도 개선</li></ol> |
| 1.1.2 | 2025.05.20 | **BugFix** <ol><li>호스트에서 SDK에 추가한 광고 이벤트 리스너의 동작이 SDK 내부에 영향을 미치지 않도록 수정</li><li>SDK 종료와 이벤트 리스너가 겹쳐 발생한 `ConcurrentModificationException` 오류 수정</li></ol> |
| 1.1.1 | 2025.04.30 | **BugFix** <ol><li>구글 IMA 광고 재생 시 트래킹 로직 개선</li></ol> |
| 1.1.0 | 2025.01.14 | **BugFix** <ol><li>VOD 광고를 재생할 때 플랫폼별로 최적의 소재를 선택하도록 수정</li><li>VOD 광고 로딩 속도 개선</li><li>리니어 TV 재생 시 플레이리스트 처리시간 개선</li><li>리니어 TV 재생 시 URL 쿼리 파라미터를 제대로 핸들링하지 못하는 오류 수정</li></ol> **Feature** <ol><li>리니어 TV용 프리롤 광고 기능 추가</li><li>로그 레벨 개선</li><li>Bitmovin Player 신규 지원</li><li>**androidx.media3.exoplayer.ExoPlayer** 신규 지원</li></ol> |
| 1.0.30 | 2024.11.15 | **BugFix** <ol><li>로그 레벨을 설정해도 무시되고 모든 로그가 출력되는 문제 수정</li><li>HLS 스트림 URL의 파라미터에 인코딩되지 않은 특수문자가(예: 슬래시 "/") 포함되어있는 경우 스트림을 재생할 수 없는 오류 수정</li><li>HLS 플레이리스트에 포함된 세그먼트가 SDK 허용량보다 많을 때 스트림을 재생할 수 없는 오류 수정</li></ol> |
| 1.0.29 | 2024.10.21 | **BugFix** <ol><li>DASH 스트림 URL에 인코딩되지 않은 URL 파라미터가 있을 때 스트림이 재생되지 않는 문제 수정</li><li>DASH 스트림에 필러 광고를 반복해서 재생할 때 발생하는 버퍼링 문제 수정</li></ol> |
| 1.0.28 | 2024.10.04 | **Feature** <ol><li>패키지명 충돌을 피하기 위해 서드파티 라이브러리 패키지명 수정</li></ol> |
| 1.0.27 | 2024.09.27 | **BugFix** <ol><li>안드로이드 WebView가 설치되지 않은 환경에서 발생하는 앱 크래시 수정</li></ol> |
| 1.0.26 | 2024.09.13 | **BugFix** <ol><li>HLS 플레이리스트 파싱 중 알 수 없는 태그 또는 속성이 있을 때 실패하는 문제 수정</li></ol> |
| 1.0.25 | 2024.09.11 | **Feature** <ol><li>광고 요청의 성공/실패 여부 상관없이 응답 코드, 요청 URL, 요청 헤더를 로그에 추가</li></ol> **BugFix** <ol><li>Wrapper URL이 포함된 VAST XML 파싱할 때 발생하는 오류 수정</li></ol> |
| 1.0.24 | 2024.09.06 | **BugFix** <ol><li>min SDK 버전을 21에서 17로 변경</li></ol> |
| 1.0.23 | 2024.09.06 | **BugFix** <ol><li>특정 형식의 광고 응답 및 소재 플레이리스트 파싱 오류 수정</li></ol> |
| 1.0.22 | 2024.09.03 | **Feature** <ol><li>광고 요청 시 타겟팅 정보 개선</li></ol> |
| 1.0.21 | 2024.08.09 | **Feature** <ol><li>DRM이 적용된 DASH 스트림 광고 삽입 지원</li><li>`changeChannelUrl()` API에 광고 요청 시 사용자 정의 HTTP 헤더를 추가할 수 있는 `adTagHeaders` 파라미터 추가</li><li>`changeChannelUrl()` API에 스트림 요청 시 사용자 정의 HTTP 헤더를 포함할 수 있는 `channelStreamHeaders` 파라미터 추가</li><li>스트림 재생 중 타겟팅 정보를 교체할 수 있는 `changeChannelExtraParams` API 추가</li></ol> |
| 1.0.20 | 2024.07.18 | **Feature** <ol><li>커스텀 플레이어 지원을 위해 `MediaPlayerHook`에서 `MediaPlayerAdapter`을 반환하는 기능 추가</li><li>`FlowerAdsManagerListener`에 `onAdBreakSkipped` 함수 추가</li></ol> |
| 1.0.19 | 2024.04.12 | **BugFix** <ol><li>Linear TV 플레이어 오류에 대한 방어 로직 추가</li><li>Linear TV 플레이어에서 오류 발생 시 SDK 리셋 처리</li></ol> |
| ~~1.0.18~~<br/>Deprecated | 2024.03.29 | **Feature** <ol><li>compileSdk 버전을 33에서 32로 변경</li></ol> |
| ~~1.0.17~~<br/>Deprecated | 2024.03.29 | **Feature** <ol><li>compileSdk 버전을 34에서 33으로 변경</li></ol> |
| ~~1.0.16~~<br/>Deprecated | 2024.03.26 | **BugFix** <ol><li>연이어진 광고 큐에서 필러 광고를 잘못 트래킹하는 오류 수정</li></ol> |
| ~~1.0.15~~<br/>Deprecated | 2024.03.15 | **BugFix** <ol><li>긴 쿼리 파라미터가 포함된 스트림 URL을 재생할 수 없는 오류 수정</li></ol> |
| ~~1.0.14~~<br/>Deprecated | 2024.03.14 | **BugFix** <ol><li>구글 광고를 재생할 때 뷰어빌리티 문제 수정</li></ol> |
| ~~1.0.13~~<br/>Deprecated | 2024.02.07 | **BugFix** <ol><li>특정 광고 소재의 응답을 파싱하지 못하는 오류 수정</li></ol> |
| ~~1.0.12~~<br/>Deprecated | 2024.01.19 | **BugFix** <ol><li>래퍼 광고의 응답이 두 개 이상일 때 발생하는 트래킹 오류 수정</li></ol> |
| ~~1.0.11~~<br/>Deprecated | 2023.12.12 | **BugFix** <ol><li>완료 비콘 로그가 간헐적으로 호출되지 않는 문제 수정</li></ol> |
| ~~1.0.10~~<br/>Deprecated | 2023.11.27 | **BugFix** <ol><li>간헐적으로 발생하는 앱 크래시 문제 수정</li></ol> |
| ~~1.0.9~~<br/>Deprecated | 2023.11.15 | **Feature** <ol><li>광고 요청 시 플레이어 객체 수신 처리 기능 개선</li><li>안드로이드 4.2 지원 및 4.1 이하 무시하도록 변경</li><li>XML 의존성 제거</li></ol> **BugFix** <ol><li>광고 처리 시 오류 처리 로직 개선(리포트 방지)</li></ol> |
| ~~1.0.7~~<br/>Deprecated | 2023.11.06 | **Feature** <ol><li>광고 스트림의 비트레이트 처리 기능 개선</li></ol> |
| ~~1.0.6~~<br/>Deprecated | 2023.10.31 | **Feature** <ol><li>필러 광고의 캐시 처리 기능 개선</li></ol> |
| ~~1.0.5~~<br/>Deprecated | 2023.10.25 | **BugFix** <ol><li>광고 응답 순서와 재생 순서 불일치 문제 수정</li><li>간헐적으로 발생하던 앱 크래시 문제 수정</li></ol> |
| ~~1.0.4~~<br/>Deprecated | 2023.10.13 | **BugFix** <ol><li>광고 요청 비동기 처리 시, 병렬 처리 문제로 간헐적으로 오류 발생하는 문제 수정</li></ol> |
| ~~1.0.3~~<br/>Deprecated | 2023.10.12 | **Feature** <ol><li>VAST Parser 기능 개선(빈 문자열 예외 처리)</li></ol> **BugFix** <ol><li>완료 보고가 되지 않는 문제 수정</li></ol> |
| ~~1.0.2~~<br/>Deprecated | 2023.09.19 | **New** <ol><li>커스텀 CUE TAG 지원</li></ol> |
| ~~1.0.1~~<br/>Deprecated | 2023.08.21 | **New** <ol><li>DRM이 적용된 HLS 스트림 지원</li><li>MPEG-DASH 스트림 지원</li></ol> |
| ~~1.0.0~~<br/>Deprecated | 2022.03.22 | **New** <ol><li>Flower Solution 연동 지원</li><li>프로그래매틱 광고 지원</li><li>Direct I/O 광고 지원</li><li>HLS 스트림 지원</li><li>SCTE-35 CUE TAG 지원</li><li>구글 광고 지원</li></ol> |

*   **New** : 신규 기능
*   **Feature** : 기존 기능 수정
*   **BugFix** : 오류 수정
