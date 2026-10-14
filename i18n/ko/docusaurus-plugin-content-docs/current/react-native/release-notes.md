---
sidebar_position: 100
sidebar_label: 릴리즈 노트
---

# React Native SDK 릴리즈 노트

| **버전** | **날짜** | **변경 사항** |
| ---| ---| --- |
| 1.0.3 | 2026년 10월 12일 | **New** <ol><li>`notifyPictureInPictureModeChanged(isInPictureInPictureMode)`, `setIgnoreAdBreakInPIPMode(ignore)` 추가. [PIP 모드 지원](./getting-started/pip-mode-support) 참고</li></ol> **Feature** <ol><li>내부 Android SDK 버전 2.9.28, iOS SDK 버전 2.3.17로 변경(해당 버전의 오류 수정 포함)</li><li>기본 설정(`setIgnoreAdBreakInPIPMode(true)`)에서 VOD 광고 구간은 `<Video>` 위에 표시되는 SDK의 별도 광고 플레이어에서 재생되며, Mid-roll의 경우 SDK가 본편을 일시정지하고 `completed` 시점에 되감기 시간(5초)만큼 되돌려 재개함. SDK는 프리롤을 위해 본편을 일시정지하지 않으므로, `<Video>`를 일시정지 상태로 마운트하고 첫 `completed` 또는 `error`에서 본편을 시작할 것(프리롤이 없어도 `completed`가 전달됨). 본편이 시작된 뒤에는 iOS의 `playerType: 'bitmovin'`을 포함해 VOD 광고 구간 전후로 본편을 일시정지, 탐색, 재로드하지 말 것. `false`로 설정하면 VOD 광고 구간을 앱의 플레이어(Android와 iOS의 `react-native-video`, Android의 Bitmovin)에서 재생하며 PIP 모드에서도 계속 재생됨. 인라인 광고 구간과 iOS의 Bitmovin은 여전히 SDK의 광고 플레이어를 사용함</li><li>Mid-roll의 `prepare` 이벤트가 본편이 Mid-roll 위치에 도달했을 때 전달되도록 변경</li><li>VOD 광고 구간이 광고 재생 오류로 실패하면 SDK가 `error`를 보내기 전에 본편을 되돌려 놓도록 변경. Mid-roll이었다면 본편은 이미 중단 지점보다 되감기 시간만큼 앞에서 다시 재생 중임(`setIgnoreAdBreakInPIPMode(false)`인 경우 실패한 광고를 버리고 앱의 플레이어에 본편을 되돌려 놓음). VOD `error`에서 본편을 재개, 탐색, 소스 변경하지 말 것. 프리롤 실패 시에는 붙잡아 둔 본편을 시작할 것. 실패한 광고 구간에 대해 `completed`도 전달될 수 있으며 순서는 정해져 있지 않음. [VOD 광고 구현](./ad-insertion/vod/vod-ad-implementation#handling-error) 참고</li><li>본편 재생이 중단되었고 네이티브 SDK가 이를 복구하지 않을 때, iOS와 마찬가지로 Android에서도 메시지가 `playback unrecoverable`로 시작하는 `error` 이벤트를 장애 1건당 한 번 전달하도록 변경(iOS의 `playerType: 'bitmovin'`에서는 전달되지 않음). 라이브 채널은 정지 후 `changeChannelUrl`부터 다시 시작하며, VOD는 본편을 다시 로드하거나 오류를 표시할 것</li></ol> |
| 1.0.2 | 2026년 9월 1일 | **Feature** <ol><li>내부 Android SDK 버전 2.9.23, iOS SDK 버전 2.3.13으로 변경</li></ol> |
| 1.0.1 | 2026년 8월 27일 | **Feature** <ol><li>내부 iOS SDK 버전 2.3.12로 변경</li></ol> |
| 1.0.0 | 2026년 8월 21일 | **New** <ol><li>`@anypoint/flower-sdk-react-native` 최초 릴리스. JavaScript API와 Android/iOS 네이티브 바인딩을 하나의 패키지로 제공</li><li>`changeChannelUrl`을 통한 Linear TV (incl. FAST), `requestVodAd`를 통한 VOD, `requestAd`를 통한 인라인/전면 광고 지원</li><li>모든 세션을 해당 `<Video>`의 `nativeID`로 식별하므로, 한 화면에서 여러 플레이어가 각자의 채널을 재생 가능</li><li>`addAdEventListener` / `addAdEventListenerFor`를 통해 타입이 지정된 `AdEvent` union으로 광고 이벤트 전달</li><li>`react-native-video` 6.0.0 이상 지원 (6.19.2로 검증)</li><li>`playerType: 'bitmovin'`을 통한 선택적 `bitmovin-player-react-native` 지원</li></ol> |

## 내부 네이티브 SDK 버전

React Native 패키지의 각 릴리스는 아래 버전의 플랫폼 SDK를 사용합니다.

| **React Native 패키지** | **Android SDK** | **iOS SDK** |
| ---| ---| --- |
| 1.0.2 | 2.9.23 | 2.3.13 |
| 1.0.1 | 2.9.22 | 2.3.12 |
| 1.0.0 | 2.9.22 | 2.3.11 |

해당 SDK의 변경 사항은 [Android 릴리즈 노트](../android/release-notes.md)와 [iOS 릴리즈 노트](../ios/release-notes.md)를 참고하세요.

*   **New** : 신규 기능
*   **Feature** : 기존 기능 변경
*   **BugFix** : 오류 수정
