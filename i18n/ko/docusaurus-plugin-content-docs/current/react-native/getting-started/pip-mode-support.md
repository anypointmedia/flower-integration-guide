---
sidebar_position: 4
---

# PIP 모드 지원

기본적으로 PIP(Picture-in-Picture) 모드에서는 광고를 재생하지 않으며, SDK는 사용자가 앱을 떠났는지 스스로 감지하지 않습니다. 이를 제어하는 두 함수는 모두 패키지 루트에서 import합니다:

```ts
import {
  notifyUserLeftApp,
  setIgnoreAdBreakInPIPMode,
} from '@anypoint/flower-sdk-react-native';
```

두 함수 모두 특정 `nativeId`가 아니라 앱 전체에 적용됩니다.

## 메소드

### notifyUserLeftApp

```ts
function notifyUserLeftApp(hasLeftApp: boolean): Promise<void>;
```

사용자가 앱을 떠났거나(`true`) — 홈 화면이나 다른 앱으로 이동했거나, 영상이 PIP 창으로 옮겨진 경우 — 앱으로 돌아왔음(`false`)을 SDK에 알립니다. 앱이 PIP에 진입하는지와 관계없이 알려주어야 합니다.

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| hasLeftApp | boolean | 사용자가 앱을 떠날 때 `true`, 돌아올 때 `false` |

:::note
`notifyPictureInPictureModeChanged(isInPictureInPictureMode)`는 deprecated 되었으며 `notifyUserLeftApp`으로 대체되었습니다. 기존 호출도 계속 동작합니다.
:::

### setIgnoreAdBreakInPIPMode

```ts
function setIgnoreAdBreakInPIPMode(ignore: boolean): Promise<void>;
```

광고 재생 방식을 선택합니다. 기본값은 `true`입니다. 광고 플레이어는 광고를 요청할 때 결정되므로 광고를 요청하기 전에 호출하세요.

| **값** | **광고 플레이어** | **PIP 모드에서의 광고** |
| ---| ---| --- |
| `true` (기본값) | VOD 및 인라인 브레이크를 `<Video>` 위 오버레이의 SDK 자체 광고 플레이어에서 재생합니다. | 지원하지 않습니다. 사용자가 앱을 떠날 때 재생 중이던 광고는 일시정지되며, 사용자가 돌아올 때까지 mid-roll 또는 post-roll 브레이크를 요청하지 않습니다. |
| `false` | VOD 브레이크를 `<Video>`의 플레이어(Android와 iOS의 `react-native-video`, Android의 Bitmovin) 안에서 재생합니다. 광고를 본편 앞에 넣고, 광고가 끝나면 본편을 다시 넣습니다. 인라인 브레이크와 iOS Bitmovin의 VOD 브레이크는 여전히 SDK 자체 광고 플레이어에서 재생합니다. | 앱의 플레이어에서 재생되는 VOD 브레이크에 한해 지원합니다. PIP 모드에서도 광고가 계속 재생됩니다. |

:::caution
사용자가 앱을 떠나는 시점과 돌아오는 시점을 모두 `notifyUserLeftApp`으로 알려주어야 합니다. 앱이 PIP에 진입하는지와는 관계없습니다. 어떤 `playerType`에서도 SDK는 두 시점을 스스로 감지하지 않습니다.
:::

## PIP 모드에서의 광고 (기본값)

PIP 모드에서는 기본적으로 광고를 지원하지 않습니다. 광고 재생 중에는 본편을 PIP로 전환하지 마세요. PIP 모드를 이용해 광고를 우회할 수 있기 때문입니다. 이때 앱은 PIP에 진입하지 않으므로 SDK는 앱이 알려주어야만 사용자가 떠났다는 것을 알 수 있습니다. 그래서 앱은 PIP 진입 여부와 관계없이 사용자가 앱을 떠나고 돌아오는 것을 `notifyUserLeftApp`으로 알려, 사용자가 떠나면 광고가 일시정지되고 돌아오면 재개되도록 합니다.

*   광고 재생 중 앱이 `notifyUserLeftApp(true)`를 호출하면 SDK는 광고를 일시정지하고 광고 UI를 숨깁니다. 광고가 일시정지된 동안에는 진행 시간이 흐르지 않습니다.
*   앱이 `notifyUserLeftApp(false)`를 호출하면 광고는 멈췄던 위치부터 다시 재생되어 끝까지 재생됩니다.
*   사용자가 돌아올 때까지 mid-roll 및 post-roll 브레이크를 요청하지 않습니다.
*   스트림에 삽입되는 Linear TV 광고는 이 옵션의 영향을 받지 않습니다. 사용자가 떠나 있는 동안에도 계속 재생되며 광고 UI만 숨겨집니다. 단, 채널 프리롤(`prerollAdTagUrl`)은 VOD 광고와 동일하게 일시정지 및 재개됩니다.

어떤 화면이 PIP로 전환되는지는 SDK가 아니라 OS와 앱이 결정합니다. iOS에서는 PIP 컨트롤러가 연결된 플레이어 레이어, 즉 본편 플레이어가, Android에서는 Activity 전체가 PIP로 전환됩니다. 광고 재생 중에는 본편 `<Video>`가 PIP로 전환되지 않도록 하세요.

React Native의 `AppState`는 PIP 여부와 관계없이 사용자가 앱을 떠나는 시점(`background`)과 돌아오는 시점(`active`)을 알려줍니다. 앱 전환기를 여는 경우처럼 일시적인 상태인 `inactive`는 무시하세요.

```tsx
import React, {useEffect, useState} from 'react';
import {AppState} from 'react-native';
import Video from 'react-native-video';
import {
  addAdEventListenerFor,
  notifyUserLeftApp,
} from '@anypoint/flower-sdk-react-native';

export function VodPlayer({nativeId, contentUrl}: {nativeId: string; contentUrl: string}) {
  const [adPlaying, setAdPlaying] = useState(false);

  useEffect(() => {
    const subscription = addAdEventListenerFor(nativeId, event => {
      if (event.event === 'play') {
        setAdPlaying(true);
      } else if (event.event === 'completed' || event.event === 'error') {
        setAdPlaying(false);
      }
    });
    return () => subscription.remove();
  }, [nativeId]);

  // PIP 진입 여부와 관계없이 사용자가 앱을 떠나고 돌아오는 시점을 알립니다.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') {
        notifyUserLeftApp(true).catch(() => {});
      } else if (state === 'active') {
        notifyUserLeftApp(false).catch(() => {});
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <Video
      nativeID={nativeId}
      source={{uri: contentUrl}}
      // 광고 재생 중에는 본편이 PIP로 전환되지 않도록 합니다.
      enterPictureInPictureOnLeave={!adPlaying}
    />
  );
}
```

`notifyUserLeftApp`은 앱 전체에 적용되므로 앱 전체에 `AppState` 구독 하나면 충분하며, 플레이어 컴포넌트 안에 둘 필요는 없습니다.

## PIP 모드에서 광고 지원하기

반대로 더 많은 광고 인벤토리를 위해 PIP 모드에서도 광고를 지원하려면(`setIgnoreAdBreakInPIPMode(false)`) 앱에서 이벤트 처리에 신경 써야 합니다.

```tsx
// PIP 모드에서도 광고가 재생되도록 앱의 플레이어에서 광고를 재생합니다.
await setIgnoreAdBreakInPIPMode(false);
```

이 모드에서 VOD 브레이크를 앱의 플레이어 안에서 재생하는 경우는 아래와 같습니다:

*   Android와 iOS의 `react-native-video`
*   Android의 `playerType: 'bitmovin'`

iOS의 `playerType: 'bitmovin'`은 항상 SDK 자체 광고 플레이어를 사용하며, 인라인 브레이크(`requestAd()`)도 모든 플레이어에서 마찬가지입니다. 인라인 브레이크 전후의 콘텐츠 일시정지와 재개는 여전히 앱이 담당합니다.

콘텐츠에 대한 규칙은 기본 모드와 같습니다. 첫 시작 전에는 첫 `completed` 또는 `error`까지 일시정지 상태로 붙잡아 두고, 시작된 뒤에는 일시정지, 탐색, 재로드하지 마세요. mid-roll 실패로 `error`가 오면 SDK가 이미 콘텐츠를 되돌려 놓은 상태입니다. 중지, 탐색, 재로드는 하지 말고, 안전장치로 콘텐츠를 재개하세요(`videoRef.current?.resume()`, Bitmovin은 `player.play()`). 이미 재생 중이어도 문제없습니다. 이 모드에서는 광고 실패 1건이 `error` 이벤트 두 번으로 나타날 수 있습니다. `notifyContentEnded()`를 호출하는 지점(아래 참고)에서 콘텐츠 종료도 표시해 두어, post-roll `error`가 콘텐츠를 재개하지 않게 하세요. [VOD 광고 구현](../ad-insertion/vod/vod-ad-implementation.md#handling-error)을 참고하세요.

### 앱의 플레이어에서 광고가 재생되는 방식

1. 브레이크가 시작되면 SDK는 `<Video>` 뒤의 네이티브 플레이어에서 본편 앞에 광고 아이템을 넣고, 플레이어는 광고로 이동합니다.
2. 브레이크가 끝나면 SDK는 본편을 재개 지점(중단된 위치에서 되감기 시간만큼 앞선 위치)에 **새로운 플레이어 아이템**으로 다시 넣습니다.

### 플레이어 이벤트 처리

브레이크 전후마다 네이티브 플레이어의 현재 아이템이 바뀌므로, 아이템 변경이나 재생 종료를 감지하는 로직은 현재 아이템이 무엇이든 반응하지 말고 본편일 때만 반응해야 합니다.

*   `react-native-video`는 자신이 로드한 아이템에 옵저버를 연결합니다. 이 모드에서 iOS의 `onEnd`는 브레이크 이후 호출되지 않으며, Android에서는 브레이크 전후에도 종료 상태가 보고됩니다. `notifyContentEnded()` 호출을 `onEnd`에만 의존하지 말고, 본편당 한 번만 호출하세요.
*   Android의 `react-native-video`에서는 본편이 클리핑된 상태로 돌아오므로, mid-roll 이후 보고되는 위치(`onProgress`의 `currentTime`)가 본편 시작이 아니라 재개 지점부터 계산됩니다. Android의 Bitmovin은 소스를 오프셋으로 다시 로드하므로 이에 해당하지 않습니다.
*   iOS에서는 `react-native-video`가 만든 아이템에 적용된 설정(예: `source.headers`, DRM, 버퍼 및 비트레이트 설정, 선택한 오디오 및 텍스트 트랙)이 SDK가 다시 넣는 아이템으로 이어지지 않습니다.

아이템에 연결된 이벤트 없이 본편 종료를 감지할 수 없거나 아이템 단위 설정에 의존한다면 기본 모드를 사용하세요.

## 관련 문서

*   [VOD 광고 구현](../ad-insertion/vod/vod-ad-implementation.md)
*   [SDK 생명주기](../api/flower-sdk.md)
