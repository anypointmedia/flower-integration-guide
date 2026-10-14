---
sidebar_position: 5
---

# 광고 이벤트

광고 이벤트는 네이티브 SDK의 `FlowerAdsManagerListener` 인터페이스를 대체합니다. 리스너 객체를 구현하는 대신 `AdEvent` 값의 스트림을 구독합니다.

모든 이벤트는 자신이 속한 `<Video>`의 `nativeId`를 함께 전달하므로, 여러 플레이어를 구분할 수 있습니다.

## 구독

### addAdEventListener

```ts
function addAdEventListener(listener: (event: AdEvent) => void): EmitterSubscription;
```

**모든** 세션의 광고 이벤트를 구독합니다. `event.nativeId`로 구분하세요.

### addAdEventListenerFor

```ts
function addAdEventListenerFor(
  nativeId: string,
  listener: (event: AdEvent) => void,
): EmitterSubscription;
```

**하나의** 세션의 광고 이벤트만 구독합니다. 다른 `nativeId`의 이벤트는 필터링됩니다.

두 함수 모두 구독 객체를 반환합니다. 컴포넌트가 unmount될 때 `remove()`를 호출하세요:

```tsx
useEffect(() => {
  const subscription = addAdEventListenerFor(nativeId, event => {
    // …
  });
  return () => subscription.remove();
}, [nativeId]);
```

:::caution
이벤트 구독은 [`release`](./flower-sdk.md#release)와 독립적입니다. 세션을 release해도 앱이 직접 추가한 리스너는 제거되지 않습니다.
:::

## AdEvent

`AdEvent`는 `event` 필드를 기준으로 하는 discriminated union이므로, 이 필드로 좁히면 해당 payload 필드에 접근할 수 있습니다:

```ts
export type AdEvent = {nativeId: string} & (
  | {event: 'adBreakPrepare'; adCount: number}
  | {event: 'prepare'; adDurationMs: number}
  | {event: 'play'}
  | {event: 'adPlay'; adId: string; durationMs: number}
  | {event: 'completed'}
  | {event: 'error'; message: string | null}
  | {event: 'adUserAction'; action: string; adId: string}
  | {event: 'adBreakSkipped'; reason: number}
);
```

```tsx
addAdEventListenerFor(nativeId, event => {
  switch (event.event) {
    case 'prepare':
      console.log(`break ready, ${event.adDurationMs}ms`); // adDurationMs 접근 가능
      break;
    case 'adPlay':
      console.log(`ad ${event.adId} started`); // adId 접근 가능
      break;
  }
});
```

## 이벤트

### adBreakPrepare

전면 광고 또는 VOD 광고의 광고 매니페스트가 로드되었을 때 발생합니다.

| **필드** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 이벤트가 속한 세션 |
| adCount | number | 해당 브레이크에 로드된 광고 개수 |

### prepare

전면 광고 또는 VOD 광고의 브레이크가 로드되었을 때 발생합니다(VOD mid-roll은 콘텐츠가 브레이크 위치에 도달했을 때). 앱은 이 시점에 [`play`](./flower-sdk.md#play)를 호출합니다. 전면 광고나 인라인 브레이크의 경우 앱이 이 시점에 콘텐츠도 일시정지합니다. VOD 브레이크의 경우 앱은 여기서 아무것도 일시정지하지 않습니다. 프리롤은 앱이 첫 시작 전의 콘텐츠를 아직 붙잡아 두고 있을 때 도착하며, mid-roll은 SDK가 직접 콘텐츠를 일시정지합니다.

| **필드** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 이벤트가 속한 세션 |
| adDurationMs | number | 광고 브레이크 전체 길이(밀리초) |

### play

광고 재생이 시작되었을 때 발생합니다.

| **필드** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 이벤트가 속한 세션 |

### adPlay

개별 광고 단위의 재생이 시작될 때마다 발생합니다.

| **필드** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 이벤트가 속한 세션 |
| adId | string | VAST 응답에 명시된 광고 ID. 응답에 없으면 빈 문자열 |
| durationMs | number | 해당 광고의 길이(밀리초) |

### completed

광고 재생이 종료되었을 때 발생합니다. 인라인 브레이크에서는 앱이 이 시점에 콘텐츠를 재개합니다. VOD에서는 첫 `completed`에서 앱이 붙잡아 둔 콘텐츠를 시작합니다. 프리롤이 없거나, 광고 응답이 비어 있거나, 요청이 실패해도 SDK는 이 이벤트를 보냅니다. VOD mid-roll 이후에는 SDK가 직접 콘텐츠를 재개합니다.

| **필드** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 이벤트가 속한 세션 |

### error

Flower SDK에서 오류가 발생했을 때 발생합니다.

| **필드** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 이벤트가 속한 세션 |
| message | string \| null | SDK가 제공한 오류 메시지 |

:::caution
인라인 브레이크 도중 `error`가 발생하면, 콘텐츠를 일시정지한 주체가 앱이므로 콘텐츠는 멈춘 상태로 남습니다. `completed`뿐 아니라 이 분기에서도 콘텐츠를 재개하지 않으면 시청자가 멈춘 화면에 남게 됩니다.
:::

`error`는 광고 재생에 실패했을 때, 또는 콘텐츠 재생이 중단되었고 네이티브 SDK가 이를 복구하지 않을 때 전달됩니다. 후자의 경우 `message`는 `playback unrecoverable`로 시작하며, 장애 1건당 한 번 전달됩니다(iOS의 `playerType: 'bitmovin'`에서는 보고되지 않음). Android에서는 SDK의 로컬 프록시 서버가 응답하지 못할 때도 전달됩니다. VOD 광고 요청이 실패하거나, 타임아웃되거나, 광고가 없으면 `error`가 아니라 `completed`로 끝납니다.

`error` 시 해야 할 일은 세션 종류에 따라 다릅니다:

*   **Linear TV / FAST**: `await stop(nativeId)`로 광고 매니저를 중지한 뒤 채널을 다시 시작합니다 — `prerollAdTagUrl`을 포함해 첫 시작과 완전히 같은 파라미터로 `changeChannelUrl()`을 새로 호출하고, 반환된 새 프록시 URL은 첫 시작과 같은 방식으로 처리합니다. 시청자에게 프리롤이 다시 표시되지는 않습니다. SDK가 마지막으로 진입한 채널의 프리롤을 건너뛰고 바로 `completed`를 보내기 때문입니다. [오류 복구](../ad-insertion/linear-tv-fast/linear-tv-implementation.md#오류-복구)를 참고하세요.
*   **VOD**: 콘텐츠의 상태에 따라 다릅니다. 브레이크가 실패하면 SDK가 이 이벤트를 보내기 전에 콘텐츠를 되돌려 놓으므로, 여기서 재개, seek, 소스 변경을 하지 마세요. 실패한 브레이크에 대해 `completed`도 전달될 수 있으며 순서는 정해져 있지 않습니다.
    *   아직 시작 전(프리롤): `completed`와 똑같이, 붙잡아 둔 콘텐츠를 시작합니다.
    *   시작했고 아직 끝나지 않음(mid-roll): 할 일이 없습니다 — 콘텐츠는 이미 중단 지점보다 되감기 시간만큼 앞에서 다시 재생 중입니다.
    *   종료됨(post-roll): 재개할 것이 없습니다 — 재생이 끝났습니다.
    *   `playback unrecoverable`: 콘텐츠 자체가 멈췄습니다. 다시 로드하거나 오류를 표시하세요.
*   **인라인**: `completed`와 마찬가지로 콘텐츠를 재개하고 `stop(nativeId)`를 호출합니다.

### adUserAction

사용자가 광고와 상호작용했을 때 발생합니다.

| **필드** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 이벤트가 속한 세션 |
| action | string | 사용자 동작 유형<br/>`learn_more`: 자세히 보기 / 클릭 영역을 클릭<br/>`skip`: 건너뛰기 버튼을 누름 |
| adId | string | 해당 동작이 수행된 광고 ID |

### adBreakSkipped

광고 브레이크가 건너뛰어졌을 때 발생합니다.

| **필드** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 이벤트가 속한 세션 |
| reason | number | 건너뛴 사유 코드<br/>`0`: Unknown<br/>`1`: No Ad<br/>`2`: Timeout<br/>`3`: Error |

## 관련 API

*   [SDK 생명주기](./flower-sdk.md)
*   [Linear Channels / FAST](./linear-channels-fast.md)
*   [VOD](./vod.md)
*   [전면 광고](./interstitial-ads.md)
