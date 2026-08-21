---
sidebar_position: 2
---

# 초기화 및 해제

## SDK 초기화

앱 시작 시 다른 SDK 함수보다 먼저 `initialize()`를 한 번 호출합니다. 이 함수는 내부에서 동작하는 **네이티브** SDK의 버전 — Android에서는 Android SDK, iOS에서는 iOS SDK — 을 반환하므로 로깅이나 기술 지원 요청 시 유용합니다.

```tsx
import {useEffect} from 'react';
import {initialize} from '@anypoint/flower-sdk-react-native';

export default function App() {
  useEffect(() => {
    initialize('Info')
      .then(version => console.log(`Flower SDK initialized: ${version}`))
      .catch(error => console.error(`Flower SDK init failed: ${error.message}`));
  }, []);

  // ...
}
```

인자는 로그 레벨 하나이며 기본값은 `'Info'`입니다. 사용 가능한 값은 [로그 레벨 설정](./log-level-settings.md)을 참고하세요.

:::note
네이티브 SDK와 달리 React Native 패키지는 운영 환경 모드(`local` / `dev` / `prod`)를 제공하지 않습니다. 로그 레벨은 `initialize()`를 통해 직접 설정합니다.
:::

## 세션 해제

모든 SDK 세션은 해당 세션이 속한 `<Video>` 요소의 `nativeID`를 키로 관리됩니다. 네이티브 측에서 각 세션의 광고 오버레이를 보유하고 있으므로, 비디오가 사라질 때 이를 알려주어야 합니다.

비디오를 소유한 컴포넌트가 unmount될 때 `release(nativeId)`를 호출하세요:

```tsx
import {useEffect} from 'react';
import {release} from '@anypoint/flower-sdk-react-native';

function ChannelPlayer({nativeId}: {nativeId: string}) {
  useEffect(
    () => () => {
      release(nativeId).catch(() => {});
    },
    [nativeId],
  );

  // ...
}
```

:::caution
`release()`를 호출하지 않으면 광고 오버레이가 누수됩니다. 오버레이가 부착되어 있던 플레이어보다 오래 살아남으며, 그에 딸린 ads manager와 로컬 프록시도 함께 남습니다.
:::

`release()`는 SDK가 내부적으로 등록한 리스너를 제거하고 진행 중인 광고 브레이크도 중단하므로, 필요한 정리 호출은 이것 하나입니다. 앱이 `addAdEventListener()` 또는 `addAdEventListenerFor()`로 직접 만든 구독은 별개이며, 반환된 구독 객체로 제거해야 합니다:

```tsx
useEffect(() => {
  const subscription = addAdEventListenerFor(nativeId, handleAdEvent);
  return () => subscription.remove();
}, [nativeId]);
```

## stop과 release의 차이

| 함수 | 동작 | 등록되지 않은 `nativeId` |
| ---| ---| --- |
| `stop(nativeId)` | 현재 광고 브레이크를 중단합니다. 콘텐츠 재생은 계속되고 세션도 유지됩니다. | 무시 — 정리 경로에서 조건 없이 호출해도 안전 |
| `release(nativeId)` | 해당 `<Video>`에서 SDK를 완전히 분리하고 오버레이를 해제합니다. | 무시 |

## 한 화면에 여러 플레이어 사용하기

모든 SDK 상태는 `nativeID`를 키로 관리되며, 모든 광고 이벤트는 자신이 속한 id를 함께 전달합니다. 따라서 화면에 있는 모든 `nativeID`가 고유하기만 하면, 여러 `<Video>` 요소가 각각 자신의 채널을 재생하고 각자의 광고 오버레이·ads manager·로컬 프록시를 가질 수 있습니다.

```tsx
{channels.map(channel => (
  <Video key={channel.nativeId} nativeID={channel.nativeId} ... />
))}
```
