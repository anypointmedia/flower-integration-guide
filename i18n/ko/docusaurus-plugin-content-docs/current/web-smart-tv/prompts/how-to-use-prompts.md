---
sidebar_position: 0
---

# 프롬프트 사용 방법

이 섹션에는 LLM 기반 SDK 연동을 위한 프롬프트가 포함되어 있습니다. 각 프롬프트를 AI 코딩 어시스턴트(Claude, ChatGPT, Copilot 등)에 기존 코드와 함께 복사하여 붙여넣을 수 있습니다.

## 케이스별 프롬프트

**케이스별 프롬프트**의 각 프롬프트는 하나의 연동 케이스만 다룹니다. 해당 케이스에서 SDK가 동작하는 방식, 추가할 정확한 코드, 하지 말아야 할 일, 테스트 체크리스트를 담고 있어 LLM이 여러 분기 중에서 고를 필요가 없습니다. 앱에 맞는 행을 찾아 페이지를 열고, 몇 가지 매개변수를 입력한 뒤 기존 코드와 함께 프롬프트를 붙여넣으세요.

| 상황 | 프롬프트 |
|------|----------|
| Linear 채널 / FAST 스트림을 HLS.js로 재생하며, `Hls`를 SDK의 래퍼로 교체할 수 있는 경우 | [FlowerHls를 이용한 Linear TV / FAST](./by-case/linear-tv/flower-hls.md) |
| Linear 채널 / FAST 스트림을 앱의 HLS.js, Bitmovin, dash.js, Shaka Player 인스턴스로 재생하는 경우 | [플레이어 직접 제어를 이용한 Linear TV / FAST](./by-case/linear-tv/media-player-hook.md) |
| HLS.js, Bitmovin, dash.js, Shaka Player로 재생하는 VOD에 프리롤, Mid-roll, Post-roll 광고를 넣는 경우 (기본 광고 모드) | [앱의 플레이어를 이용한 VOD 광고](./by-case/vod/media-player-hook.md) |
| PIP 모드에서도 VOD 광고가 계속 재생되어야 하여, 광고를 앱의 HLS.js 또는 Bitmovin 플레이어 안에서 재생하는 경우 | [앱의 플레이어 안에서 재생되는 VOD 광고](./by-case/vod/ads-in-pip-mode.md) |
| 기본 광고 모드에서 본편 video를 PIP로 전환할 수 있고 PIP 모드에서는 광고를 표시하지 않는 VOD: 사용자가 앱을 떠나고 돌아오는 것을 알리고, 광고 재생 중에는 본편 video가 PIP로 전환되지 않게 하는 경우 | [VOD — 광고 없는 PIP 모드(기본)](./by-case/vod/no-ads-in-pip-mode.md) |
| 이미 VOD 광고를 연동했으며, 광고 전후로 앱이 직접 일시정지, 재개, 탐색(seek)하거나 재생을 지연하는 경우 | [기존 VOD 연동 업데이트](./by-case/vod/migrate-to-sdk-managed-content.md) |
| 본편 플레이어 없이 페이지 영역 또는 전체 화면에 독립적인 동영상 광고를 노출하는 경우 | [인라인 광고와 전면 광고](./by-case/advanced/inline-interstitial.md) |
| 사용자가 앱을 떠나고(다른 탭이나 앱으로 전환, TV 앱이 백그라운드로 이동, PIP(Picture-in-Picture)) 돌아오는 것을 SDK에 알리고, 광고 재생 중에는 동영상이 PIP로 전환되지 않게 하는 경우 | [PIP 모드 지원](./by-case/common/pip-mode-support.md) |

케이스를 조합할 수도 있습니다. 예를 들어 VOD 프롬프트를 먼저 사용한 뒤, 그 결과물에 PIP 프롬프트를 적용하세요.

## 전체 연동 프롬프트

아래 프롬프트는 모든 케이스를 하나의 분기형 프롬프트로 다루며, `{{AD_TYPE}}`과 `{{APPROACH}}` 매개변수로 케이스를 선택합니다. 전체 연동을 하나의 프롬프트로 진행하고 싶을 때 사용하세요.

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
