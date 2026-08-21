---
sidebar_position: 100
sidebar_label: 릴리즈 노트
---

# React Native SDK 릴리즈 노트

| **버전** | **날짜** | **변경 사항** |
| ---| ---| --- |
| 1.0.0 | 2026년 8월 21일 | **New** <ol><li>`@anypoint/flower-sdk-react-native` 최초 릴리스. JavaScript API와 Android/iOS 네이티브 바인딩을 하나의 패키지로 제공</li><li>`changeChannelUrl`을 통한 Linear TV (incl. FAST), `requestVodAd`를 통한 VOD, `requestAd`를 통한 인라인/전면 광고 지원</li><li>모든 세션을 해당 `<Video>`의 `nativeID`로 식별하므로, 한 화면에서 여러 플레이어가 각자의 채널을 재생 가능</li><li>`addAdEventListener` / `addAdEventListenerFor`를 통해 타입이 지정된 `AdEvent` union으로 광고 이벤트 전달</li><li>`react-native-video` 6.0.0 이상 지원 (6.19.2로 검증)</li><li>`playerType: 'bitmovin'`을 통한 선택적 `bitmovin-player-react-native` 지원</li></ol> |

## 내부 네이티브 SDK 버전

React Native 패키지의 각 릴리스는 아래 버전의 플랫폼 SDK를 사용합니다.

| **React Native 패키지** | **Android SDK** | **iOS SDK** |
| ---| ---| --- |
| 1.0.0 | 2.9.22 | 2.3.11 |

해당 SDK의 변경 사항은 [Android 릴리즈 노트](../android/release-notes.md)와 [iOS 릴리즈 노트](../ios/release-notes.md)를 참고하세요.

*   **New** : 신규 기능
*   **Feature** : 기존 기능 변경
*   **BugFix** : 오류 수정
