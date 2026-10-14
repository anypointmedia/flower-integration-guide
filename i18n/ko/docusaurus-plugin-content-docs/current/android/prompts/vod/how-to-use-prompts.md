---
sidebar_position: 0
---

# 프롬프트 사용 방법

이 섹션에는 LLM 기반 SDK 연동을 위한 프롬프트가 포함되어 있습니다. 각 프롬프트를 AI 코딩 어시스턴트(Claude, ChatGPT, Copilot 등)에 기존 코드와 함께 복사하여 붙여넣을 수 있습니다.

프롬프트는 두 종류가 있습니다:
- **케이스별 프롬프트**: 연동 케이스마다 독립된 프롬프트 하나를 제공합니다. 자신의 케이스를 알고 있다면 이 프롬프트를 사용하세요. 더 많은 케이스를 다루며 입력할 매개변수가 적습니다.
- **전체 연동 프롬프트**: `AD_TYPE`과 `APPROACH`에 따라 분기하는 하나의 프롬프트(또는 4개의 단계별 프롬프트)입니다.

## 케이스별 프롬프트

앱에 해당하는 행을 고르세요. 각 프롬프트는 Kotlin 코드를 생성합니다.

| 상황 | 프롬프트 |
|-----------|--------|
| 라이브 채널 / FAST, 가장 간단한 구성: Media3 ExoPlayer, ExoPlayer2, Bitmovin을 Flower Player로 감쌈 | [Flower Player로 Linear TV 광고](../by-case/linear-tv/flower-player.md) |
| 라이브 채널 / FAST, 지원되는 기존 플레이어를 유지하고 `changeChannelUrl()`의 URL을 재생 | [앱의 플레이어로 Linear TV 광고](../by-case/linear-tv/media-player-hook.md) |
| 라이브 채널, 앱이 광고 마커를 직접 감지하고 별도의 두 번째 플레이어로 광고 재생(`enterChannel`, `requestChannelAd`) | [앱의 광고 플레이어로 Linear TV 광고](../by-case/linear-tv/direct-ad-playback-control.md) |
| 라이브 채널 / FAST, SDK가 지원하지 않는 플레이어 사용(`MediaPlayerAdapter`) | [커스텀 플레이어로 Linear TV 광고](../by-case/linear-tv/custom-player-adapter.md) |
| 송출 기능(Chromecast, AirPlay, 스마트 TV)이 있는 라이브 채널 | [외부 화면 송출](../by-case/linear-tv/screen-casting.md) |
| VOD, 가장 간단한 구성: `FlowerVodAdConfig`와 함께 플레이어를 Flower Player로 감쌈 | [Flower Player로 VOD 광고](../by-case/vod/flower-player.md) |
| VOD, 기존 플레이어를 유지하고 `requestVodAd()`로 광고 요청(기본 광고 모드) | [앱의 플레이어로 VOD 광고](../by-case/vod/media-player-hook.md) |
| VOD에서 PIP 지원, PIP 모드에서는 광고를 표시하지 않음(기본, `setIgnoreAdBreakInPIPMode(true)`): `notifyUserLeftApp`으로 앱 이탈/복귀를 알리고, 광고 재생 중에는 PIP 진입 안 함 | [광고 없는 VOD PIP 모드(기본)](../by-case/vod/no-ads-in-pip-mode.md) |
| PIP 모드에서도 VOD 광고가 계속 재생되어야 함(`setIgnoreAdBreakInPIPMode(false)`) | [PIP 모드에서의 VOD 광고](../by-case/vod/ads-in-pip-mode.md) |
| 본편을 직접 일시정지/재개하거나 `play()`를 지연하는 기존 VOD 연동에서 SDK 업그레이드 | [SDK 관리 본편 제어로 전환](../by-case/vod/migrate-to-sdk-managed-content.md) |
| 단독 인라인 또는 전면 동영상 광고(`requestAd()`) | [인라인 / 전면 광고](../by-case/advanced/inline-interstitial.md) |
| 위 케이스 중 하나이면서 앱이 PIP(Picture-in-Picture)를 지원 | [PIP 모드 지원](../by-case/common/pip-mode-support.md) |

## 전체 연동 프롬프트

이 페이지의 나머지 부분은 이 섹션에 있는, `AD_TYPE`과 `APPROACH`에 따라 분기하는 전체 연동 프롬프트를 설명합니다.

### 통합 프롬프트 (새 프로젝트에 권장)

다음 경우에 **integrated-prompt.md**를 사용하세요:
- SDK 연동을 처음부터 시작하는 경우
- LLM이 모든 파일을 한 번에 생성하길 원하는 경우
- 프로젝트에 Flower SDK 코드가 아직 없는 경우

상단의 매개변수를 입력하고, 기존 Activity/ViewController 코드를 붙여넣으면 LLM이 전체 연동 코드를 생성합니다.

### 단계별 프롬프트 (기존 프로젝트에 권장)

다음 경우에 개별 단계 프롬프트를 사용하세요:
- 기존 프로젝트에 Flower SDK를 점진적으로 추가하는 경우
- 다음 단계로 넘어가기 전에 각 변경 사항을 검토하고 싶은 경우
- 특정 단계가 실패하여 해당 단계만 다시 시도해야 하는 경우
- 특정 연동 단계의 문제를 디버깅하는 경우

## 단계 개요

| 단계 | 파일 | 내용 | 개별 사용 시기 |
|------|------|------|----------------|
| **Step 1** | `step-1-project-setup.md` | SDK 의존성 추가, 네트워크 설정, SDK 초기화 | 빌드 설정 문제, SDK 초기화 문제 |
| **Step 2** | `step-2-ad-ui-and-player.md` | 광고 표시 레이어 설정, 비디오 플레이어 생성/래핑 | 플레이어 래핑 문제, 레이아웃 문제 |
| **Step 3** | `step-3-ad-integration.md` | 광고 리스너 구현, 광고 요청, 재생 시작 | 광고 미표시, 리스너 미동작, 잘못된 광고 설정 |
| **Step 4** | `step-4-cleanup.md` | 리소스 정리, PiP 지원 | 메모리 누수, PiP 미동작 |

**단계는 순차적입니다** — 각 단계는 이전 단계가 완료되었다고 가정합니다. Step 3의 입력은 Step 2의 출력이어야 합니다.

## 입력 매개변수

프롬프트를 사용하기 전에 `{{...}}` 플레이스홀더를 교체하세요:

### OTT/FAST 매개변수

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `AD_TYPE` | `linear-tv` \| `vod` \| `interstitial` | 광고 콘텐츠 유형 |
| `APPROACH` | `flower-player` \| `media-player-hook` | 연동 방식 (아래 참조) |
| `SDK_VERSION` | 예: `2.8.0` | 프로젝트에 제공된 Flower SDK 버전 |


## APPROACH 선택

### flower-player (가장 간단)

SDK가 플레이어를 래핑하여 내부적으로 모든 것을 처리합니다.

- **Android**: `FlowerMedia3ExoPlayer`, `FlowerExoPlayer2`, `FlowerBitmovinPlayer`
- **iOS**: `FlowerAVPlayer` + `FlowerAVPlayerViewController` (UIKit) / `FlowerVideoPlayer` (SwiftUI)
- **HTML5**: `FlowerHls` (실시간 채널 전용 — VOD 미지원)

**적합한 경우**: 빠른 연동, 표준 플레이어 설정, 세밀한 광고 제어가 필요 없는 경우

### media-player-hook (더 많은 제어)

기존 플레이어를 유지합니다. SDK가 URL 조작 또는 별도 광고 요청을 통해 광고를 삽입합니다.

- **실시간 채널**: `changeChannelUrl()`이 광고가 삽입된 프록시 URL을 반환
- **VOD**: `requestVodAd()`가 프리/미드/포스트롤 광고를 관리
- **전면 광고**: `requestAd()`로 독립 전체 화면 광고

**적합한 경우**: 커스텀 플레이어 설정, 광고 타이밍 제어가 필요한 경우, 듀얼 플레이어 설정

### media-player-adapter (고급)

media-player-hook과 동일하지만, 간단한 `MediaPlayerHook` 람다/프로토콜 대신 전체 `MediaPlayerAdapter` 인터페이스를 구현합니다. SDK가 플레이어 유형을 자동 감지할 수 없는 경우 사용합니다.

## AD_TYPE 선택

| AD_TYPE | 설명 | 사용 가능한 접근 방식 |
|---------|------|----------------------|
| `linear-tv` | 미드롤 광고가 포함된 실시간 스트리밍 | flower-player, media-player-hook, media-player-adapter |
| `vod` | 프리/미드/포스트롤이 포함된 주문형 비디오 | flower-player, media-player-hook |
| `interstitial` | 독립 전체 화면 광고 (비디오 플레이어 없음) | 전용 (플레이어 불필요) |

## 팁

- **항상 기존 코드를 프롬프트와 함께 제공하세요.** LLM이 처음부터 생성하지 않고 기존 코드를 수정합니다.
- **URL을 하드코딩하지 마세요** — config/intent 데이터 객체를 사용하세요. 프롬프트가 이를 안내합니다.
- **임포트를 확인하세요** — 프롬프트에 정확한 패키지 경로가 지정되어 있습니다. LLM이 잘못된 임포트를 사용하면 해당 임포트 섹션을 강조하여 다시 실행하세요.
- **단계적으로 테스트하세요** — 단계별 프롬프트를 사용하는 경우, 다음 단계로 넘어가기 전에 각 단계가 컴파일되는지 확인하세요.
