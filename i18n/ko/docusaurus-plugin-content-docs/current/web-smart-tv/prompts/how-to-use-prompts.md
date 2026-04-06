---
sidebar_position: 0
---

# 프롬프트 사용 방법

이 섹션에는 LLM 기반 SDK 연동을 위한 프롬프트가 포함되어 있습니다. 각 프롬프트를 AI 코딩 어시스턴트(Claude, ChatGPT, Copilot 등)에 기존 코드와 함께 복사하여 붙여넣을 수 있습니다.

## 접근 방식 선택

### 통합 프롬프트 (새 프로젝트에 권장)

다음 경우에 **integrated-prompt.md**를 사용하세요:
- SDK 연동을 처음부터 시작하는 경우
- LLM이 모든 파일을 한 번에 생성하길 원하는 경우
- 프로젝트에 Flower SDK 코드가 아직 없는 경우

상단의 매개변수를 입력하고, 기존 플레이어/컴포넌트 연동 코드를 붙여넣으면 LLM이 전체 연동 코드를 생성합니다.

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

### iOS 추가 매개변수

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `UI_FRAMEWORK` | `swiftui` \| `uikit` | iOS UI 프레임워크 |

### HTML5 추가 매개변수

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `PLAYER_TYPE` | `hls.js` \| `bitmovin` \| `dash.js` \| `none` | HTML5 비디오 플레이어 라이브러리 |

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
