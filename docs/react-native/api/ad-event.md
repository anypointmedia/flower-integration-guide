---
sidebar_position: 5
---

# Ad Events

Ad events replace the `FlowerAdsManagerListener` interface of the native SDKs. Instead of implementing a listener object, you subscribe to a stream of `AdEvent` values.

Every event carries the `nativeId` of the `<Video>` it belongs to, which is what keeps several players apart.

## Subscribing

### addAdEventListener

```ts
function addAdEventListener(listener: (event: AdEvent) => void): EmitterSubscription;
```

Subscribes to ad events from **every** session. Use `event.nativeId` to tell them apart.

### addAdEventListenerFor

```ts
function addAdEventListenerFor(
  nativeId: string,
  listener: (event: AdEvent) => void,
): EmitterSubscription;
```

Subscribes to ad events from **one** session only. Events for other `nativeId` values are filtered out.

Both return a subscription — call `remove()` on it when the component unmounts:

```tsx
useEffect(() => {
  const subscription = addAdEventListenerFor(nativeId, event => {
    // …
  });
  return () => subscription.remove();
}, [nativeId]);
```

:::caution
Event subscriptions are independent of [`release`](./flower-sdk.md#release). Releasing a session does not remove listeners you added yourself.
:::

## AdEvent

`AdEvent` is a discriminated union on the `event` field, so narrowing on it gives you the payload fields:

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
      console.log(`break ready, ${event.adDurationMs}ms`); // adDurationMs is in scope
      break;
    case 'adPlay':
      console.log(`ad ${event.adId} started`); // adId is in scope
      break;
  }
});
```

## Events

### adBreakPrepare

Dispatched when the ad manifest is loaded for interstitial or VOD ads.

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The session the event belongs to |
| adCount | number | Number of ads loaded for the break |

### prepare

Dispatched when the ad break is loaded for interstitial or VOD ads. This is where the app pauses its content and calls [`play`](./flower-sdk.md#play).

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The session the event belongs to |
| adDurationMs | number | Total ad break duration in milliseconds |

### play

Dispatched when ad playback starts.

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The session the event belongs to |

### adPlay

Dispatched when each individual ad unit begins playback.

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The session the event belongs to |
| adId | string | Ad id specified in the VAST response. An empty string when the response carried none. |
| durationMs | number | Duration of this ad in milliseconds |

### completed

Dispatched when ad playback ends. For VOD and inline breaks, this is where the app resumes its content.

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The session the event belongs to |

### error

Dispatched when any error happens in the Flower SDK.

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The session the event belongs to |
| message | string \| null | Error message, when the SDK supplied one |

:::caution
An `error` during a VOD or inline break leaves your content paused, because pausing it was your app's doing. Resume it from this branch as well as from `completed`, or the viewer is left on a frozen frame.
:::

### adUserAction

Dispatched when the user interacts with the ad.

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The session the event belongs to |
| action | string | User action type.<br/>`learn_more`: the user clicked the learn-more / click-through area.<br/>`skip`: the user pressed the skip button. |
| adId | string | Ad id the action was performed on |

### adBreakSkipped

Dispatched when an ad break is skipped.

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The session the event belongs to |
| reason | number | Code describing why the break was skipped.<br/>`0`: Unknown<br/>`1`: No Ad<br/>`2`: Timeout<br/>`3`: Error |

## Related APIs

*   [SDK Lifecycle](./flower-sdk.md)
*   [Linear Channels / FAST](./linear-channels-fast.md)
*   [VOD](./vod.md)
*   [Interstitial Ads](./interstitial-ads.md)
