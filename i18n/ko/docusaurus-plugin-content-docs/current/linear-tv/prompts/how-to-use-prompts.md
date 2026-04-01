---
sidebar_position: 0
---

# 프롬프트 사용 방법

이 섹션에는 Android STB(셋톱박스) 환경에서의 Linear TV SDK 연동을 위한 LLM 지원 프롬프트가 포함되어 있습니다.

## 접근 방식 선택

### 통합 프롬프트 (새 프로젝트에 권장)

처음부터 시작하는 경우 **integrated-prompt.md**를 사용하세요. 모든 매개변수를 입력하면 LLM이 전체 연동 코드를 생성합니다.

### 단계별 프롬프트 (기존 프로젝트에 권장)

개별 단계 프롬프트를 사용하여 SDK 연동을 점진적으로 추가할 수 있습니다.

## 단계 개요

| 단계 | 파일 | 내용 | 개별 사용 시기 |
|------|------|------|----------------|
| **Step 1** | `step-1-project-setup.md` | SDK 의존성 추가, ProGuard 설정, SDK 초기화, 초기 TV 이벤트 발행 | 빌드/초기화 문제 |
| **Step 2** | `step-2-ad-ui-and-player.md` | AnypointAdView 레이어 추가, 광고 플레이어 설정 (내장 또는 커스텀) | 광고 레이어 미표시, 커스텀 플레이어 문제 |
| **Step 3** | `step-3-ad-integration.md` | AdsManagerListener 구현, TV 이벤트 발행, SCTE-35 광고 요청 트리거 | 광고 미재생, 잘못된 리스너 동작 |
| **Step 4** | `step-4-cleanup.md` | SDK 해제, 커스텀 플레이어 해제, 상태 확인 | 메모리 누수, 종료 문제 |

## 입력 매개변수

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `SDK_VERSION` | 예: `2.0.0` | SDK 버전 |
| `PLAYER_TYPE` | `built-in` \| `custom` | 광고 플레이어 전략 |
| `PLAYBACK_MODE` | `dual-player` \| `single-player` | 광고 재생 시 채널과의 상호작용 방식 |
| `INITIAL_SERVICE_ID` | 예: `101` | 초기 채널의 서비스 ID |

## PLAYER_TYPE 선택

### built-in (가장 간단)

SDK가 자체 ExoPlayer를 사용하여 광고를 재생합니다. `sdk-multicast-exoplayer` 의존성이 필요합니다.

**적합한 경우**: 듀얼 디코딩이 가능한 리소스가 충분한 표준 STB

### custom (고급)

`AnypointAdPlayer` 인터페이스를 구현하여 자체 플레이어로 광고 재생을 제어합니다. `sdk-multicast` 의존성만 필요합니다.

**적합한 경우**: 리소스가 제한된 STB, 싱글 디코더 하드웨어, 커스텀 광고 렌더링

## PLAYBACK_MODE 선택

### dual-player (권장)

광고 재생 중 채널 스트림이 계속 재생됩니다. 채널 오디오가 음소거되고, 광고 오디오가 재생됩니다.

```
onPlay → channelPlayer.setVolume(0, 0)   // 채널 음소거
onStopped → channelPlayer.setVolume(1, 1) // 채널 음소거 해제
```

**적합한 경우**: 두 스트림을 동시에 디코딩할 수 있는 STB

### single-player

광고 재생 중 채널 스트림이 일시 중지됩니다. 광고 종료 후 재개됩니다.

```
onPlay → channelPlayer.pause()         // 채널 일시 중지
prepareStop → channelPlayer.prepare()  // 재개 준비 (광고 종료 ~2초 전)
onStopped → channelPlayer.start()      // 채널 재개
```

**적합한 경우**: 싱글 디코더 STB 또는 끊김 없는 전환이 중요한 경우

## SCTE-35 광고 트리거

광고는 자동으로 재생되지 않습니다. 방송 스트림의 SCTE-35 splice cue에 의해 트리거되어야 합니다.

**옵션 A — SDK 내장 디코더** (권장):
```java
Scte35Decoder decoder = adView.useScte35Decoder();
// SCTE-35 패킷 수신 시:
decoder.decode(packetBytes, currentPts);
```

**옵션 B — 수동 요청** (직접 SCTE-35를 파싱하는 경우):
```java
adsManager.request(new AnypointAdRequest(currentPts, spliceTime, duration, programId, extraParams, channelId));
```

## Linear TV SDK vs OTT/FAST SDK

이 섹션은 `AnypointSdk`, `AnypointAdView`, `AdsManagerListener`를 사용하는 **Linear TV (멀티캐스트/DTH) SDK** 용입니다. **Android STB 전용**입니다.

OTT/FAST 연동(Android/iOS/HTML5 스트리밍)은 [OTT/FAST 프롬프트](/docs/ott-fast/prompts/how-to-use-prompts)를 참조하세요.
