---
sidebar_position: 1
---

# SDK 생명주기

이 페이지의 함수들은 SDK 자체와 광고 세션의 생명주기를 관리합니다. 모두 패키지 루트에서 import합니다:

```ts
import {
  initialize,
  play,
  notifyContentEnded,
  notifyUserLeftApp,
  setIgnoreAdBreakInPIPMode,
  stop,
  release,
} from '@anypoint/flower-sdk-react-native';
```

모든 세션 함수는 첫 번째 인자로 `nativeId`를 받습니다 — 해당 세션이 속한 `<Video>`의 `nativeID` prop입니다.

## 메서드

### initialize

```ts
function initialize(logLevel?: LogLevel): Promise<string>;
```

SDK를 초기화합니다. 내부에서 동작하는 네이티브 SDK의 버전 문자열을 반환합니다.

| **파라미터** | **타입** | **설명** |
| ---| ---| --- |
| logLevel | [`LogLevel`](#loglevel) | (선택) 로그 레벨. 기본값 `'Info'` |

```tsx
const version = await initialize('Verbose');
```

### play

```ts
function play(nativeId: string): Promise<void>;
```

준비된 광고 브레이크를 재생합니다. VOD와 인라인 브레이크는 이 호출을 기다리며, Linear TV 브레이크는 스트림의 큐(cue)에 따라 예약되어 자동으로 재생됩니다.

| **파라미터** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 세션이 속한 `<Video>`의 `nativeID` |

해당 `nativeId`로 채널·VOD·인라인 요청이 시작된 적이 없으면 **reject**됩니다.

### notifyContentEnded

```ts
function notifyContentEnded(nativeId: string): Promise<void>;
```

VOD 콘텐츠가 끝까지 재생되었음을 SDK에 알려 post-roll이 재생될 수 있게 합니다. `<Video>` 컴포넌트의 `onEnd` prop에 연결하세요.

| **파라미터** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 세션이 속한 `<Video>`의 `nativeID` |

해당 `nativeId`로 채널·VOD·인라인 요청이 시작된 적이 없으면 **reject**됩니다.

### notifyUserLeftApp

```ts
function notifyUserLeftApp(hasLeftApp: boolean): Promise<void>;
```

사용자가 앱을 떠났거나(`true`) — 홈 화면이나 다른 앱으로 이동했거나, 영상이 PIP 창으로 옮겨진 경우 — 앱으로 돌아왔음(`false`)을 SDK에 알립니다. 특정 `nativeId`가 아니라 앱 전체에 적용됩니다. 광고 재생 중에는 앱이 본편 플레이어를 PIP로 전환하지 않으므로, PIP 진입 여부와 관계없이 알려야 합니다. 기본 설정인 `setIgnoreAdBreakInPIPMode(true)`에서는 사용자가 앱을 떠날 때 재생 중이던 광고가 일시정지되고 사용자가 돌아오면 재개됩니다. 단, 앱이 두 시점을 모두 알려야 합니다. [PIP 모드 지원](../getting-started/pip-mode-support.md)을 참고하세요.

| **파라미터** | **타입** | **설명** |
| ---| ---| --- |
| hasLeftApp | boolean | 사용자가 앱을 떠날 때 `true`, 돌아올 때 `false` |

`notifyPictureInPictureModeChanged(isInPictureInPictureMode)`는 deprecated되었으며 `notifyUserLeftApp`으로 대체되었습니다. 기존 호출도 계속 동작하며, 같은 값을 `notifyUserLeftApp`에 전달합니다.

### setIgnoreAdBreakInPIPMode

```ts
function setIgnoreAdBreakInPIPMode(ignore: boolean): Promise<void>;
```

광고 재생 방식을 선택합니다. 특정 `nativeId`가 아니라 앱 전체에 적용됩니다. 광고를 요청하기 전에 호출하세요. [PIP 모드 지원](../getting-started/pip-mode-support.md)을 참고하세요.

| **파라미터** | **타입** | **설명** |
| ---| ---| --- |
| ignore | boolean | `true`(기본값): 광고는 콘텐츠 위의 SDK 자체 광고 플레이어에서 재생되고, 사용자가 떠나 있는 동안에는 VOD mid-roll과 post-roll을 요청하지 않으며, 사용자가 앱을 떠날 때 재생 중이던 광고는 사용자가 돌아올 때까지 일시정지됩니다.<br/>`false`: VOD 브레이크는 앱의 플레이어(Android와 iOS의 `react-native-video`, Android의 Bitmovin)에서 재생되며 PIP 모드에서도 계속 재생됩니다. 인라인 브레이크와 iOS Bitmovin의 VOD 브레이크는 여전히 SDK 자체 광고 플레이어를 사용합니다. 브레이크가 앱의 플레이어에서 재생되는 경우 광고가 끝나면 콘텐츠가 새로운 플레이어 아이템으로 돌아오므로, 앱이 아이템 단위로 관찰하는 로직은 앱이 로드한 아이템이 아니라 콘텐츠를 기준으로 판단해야 합니다. |

### stop

```ts
function stop(nativeId: string): Promise<void>;
```

`nativeId`의 광고 매니저를 중지합니다. 현재 광고 브레이크와 광고 세션이 함께 종료됩니다.

*   **Linear TV / FAST**: 로컬 프록시가 종료되므로 프록시 URL은 더 이상 응답하지 않고, 이후의 브레이크도 재생되지 않습니다. 채널을 계속 재생하려면 [`changeChannelUrl`](./linear-channels-fast.md#changechannelurl)을 다시 호출하고 새 프록시 URL을 재생하세요.
*   **VOD**: 콘텐츠는 자체 URL에서 계속 재생되지만, 새로 [`requestVodAd`](./vod.md)를 호출하기 전까지 이후의 브레이크(Mid-roll, Post-roll)는 재생되지 않습니다.
*   **Inline / Interstitial**: 광고 브레이크가 종료됩니다.

[`release`](#release)와 달리 광고 오버레이와 이벤트 구독은 유지됩니다.

| **파라미터** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 세션이 속한 `<Video>`의 `nativeID` |

등록되지 않은 `nativeId`는 reject하지 않고 무시하므로, 세션이 시작된 적이 있는지 추적하지 않고 정리 경로에서 호출할 수 있습니다.

### release

```ts
function release(nativeId: string): Promise<void>;
```

해당 `<Video>`에서 SDK를 분리합니다. 비디오가 unmount될 때 호출하세요 — 네이티브 측이 광고 오버레이를 보유하므로, 호출하지 않으면 누수됩니다.

| **파라미터** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 세션이 속한 `<Video>`의 `nativeID` |

`release()`는 SDK 내부 리스너를 제거하고 진행 중인 브레이크도 중단하므로, 필요한 정리 호출은 이것 하나입니다. `addAdEventListener()` 또는 `addAdEventListenerFor()`로 앱이 직접 만든 구독은 별개이며 직접 제거해야 합니다.

## 타입

### LogLevel

```ts
type LogLevel = 'Verbose' | 'Debug' | 'Info' | 'Warn' | 'Error' | 'Off';
```

[로그 레벨 설정](../getting-started/log-level-settings.md)을 참고하세요.

### StringMap

```ts
type StringMap = {[key: string]: string};
```

타게팅 정보와 HTTP 헤더는 일반 `{key: value}` 객체입니다. [extraParams 정의](../ad-insertion/define-extra-params.md)를 참고하세요.

### PlayerType

```ts
type PlayerType = 'react-native-video' | 'bitmovin';
```

`nativeId`가 가리키는 뷰를 어떤 플레이어 라이브러리가 소유하는지 지정합니다. `'react-native-video'`가 기본값이며 추가 패키지가 필요 없습니다. `'bitmovin'`은 앱에 `bitmovin-player-react-native`가 설치되어 있어야 합니다. [Bitmovin 플레이어 사용하기](../ad-insertion/using-bitmovin-player.md)를 참고하세요.

## 관련 API

*   [Linear Channels / FAST](./linear-channels-fast.md)
*   [VOD](./vod.md)
*   [전면 광고](./interstitial-ads.md)
*   [광고 이벤트](./ad-event.md)
