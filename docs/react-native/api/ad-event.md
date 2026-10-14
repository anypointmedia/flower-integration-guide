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

Dispatched when the ad break is loaded for interstitial or VOD ads (for a VOD mid-roll, when the content reaches the break position). This is where the app calls [`play`](./flower-sdk.md#play). For an interstitial or inline break, the app also pauses its content here. For a VOD break, the app pauses nothing here: a pre-roll arrives while the app still holds the content before its first start, and for a mid-roll the SDK pauses the content itself.

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

Dispatched when ad playback ends. For inline breaks, this is where the app resumes its content. For VOD, the first `completed` is where the app starts the content it has been holding — the SDK sends it even when there is no pre-roll, the ad response is empty or the request fails. After a VOD mid-roll, the SDK resumes the content itself.

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
An `error` during an inline break leaves your content paused, because pausing it was your app's doing. Resume it from this branch as well as from `completed`, or the viewer is left on a frozen frame.
:::

`error` is sent when an ad fails to play, or when the content stops and the native SDK will not recover it — then `message` starts with `playback unrecoverable`, once per incident (not reported on iOS with `playerType: 'bitmovin'`). On Android it is also sent when the SDK's local proxy server fails to respond. A VOD ad request that fails, times out or returns no ads ends with `completed`, not `error`.

What to do on `error` depends on the kind of session:

*   **Linear TV / FAST**: stop the ads manager with `await stop(nativeId)`, then start the channel over — a new `changeChannelUrl()` with exactly the same parameters as the first start, `prerollAdTagUrl` included, and the new proxy URL it returns handled the same way as the first time. The viewer does not see the pre-roll again: the SDK skips the pre-roll of the channel entered last and sends `completed` right away. See [Recovering from an Error](../ad-insertion/linear-tv-fast/linear-tv-implementation.md#recovering-from-an-error).
*   **VOD**, by where the content is. When a break fails, the SDK brings the content back before this event is sent, so never resume, seek or re-source it here. `completed` may also arrive for the failed break, in either order.
    *   Not started yet (pre-roll): start the held content, exactly as on `completed`.
    *   Started and not ended (mid-roll): nothing — the content is already playing again from the rewind duration before the interruption point.
    *   Ended (post-roll): nothing to resume — playback is over.
    *   `playback unrecoverable`: the content itself stopped. Reload it or show an error.
*   **Inline**: resume your content and call `stop(nativeId)`, as on `completed`.

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
