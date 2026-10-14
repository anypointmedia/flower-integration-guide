---
sidebar_position: 3
---

# VOD

## Methods

### requestVodAd

```ts
function requestVodAd(nativeId: string, params: VodAdParams): Promise<void>;
```

Requests the ad breaks of a VOD content playing in `<Video nativeID={nativeId}>`.

Nothing is rewritten here — the content keeps playing from its own URL, and each break arrives as a `prepare` event (a mid-roll's when the content reaches its position), which is where the app calls [`play`](./flower-sdk.md#play).

The SDK does not hold the content for a pre-roll, so mount the `<Video>` paused and start the content on the first `completed` or `error`. `completed` also arrives when there is no pre-roll, the ad response is empty or the request fails. After that, leave the content alone: by default the break plays on the SDK's own ad player, and for a mid-roll the SDK pauses the content, and at `completed` seeks it back by the rewind duration (5 seconds) and resumes it. Do not pause, seek or re-source the content once it has started. That includes an `error` after the content has started: when a break fails, the SDK brings the content back before it sends `error`, so after a failed mid-roll the content is already playing again, and after a post-roll `error` the content has ended. Only an `error` whose message starts with `playback unrecoverable` — the content itself stopped — calls for reloading it or showing an error. See [VOD Ad Implementation](../ad-insertion/vod/vod-ad-implementation.md#handling-error).

The same requirement as [`changeChannelUrl`](./linear-channels-fast.md#changechannelurl) applies: the `<Video>` player must already exist.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The `nativeID` of the `<Video>` playing the content |
| params | [`VodAdParams`](#vodadparams) | Content and ad configuration |

### VodAdParams

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | Ad tag URL issued by an ad server |
| contentId | string | Content's ID<br/>Must be registered in the FLOWER backend system |
| durationMs | number | Total playback time of the VOD content in milliseconds — the SDK places the breaks against it |
| playerType | [`PlayerType`](./flower-sdk.md#playertype) | (Optional) Player library owning the view. Defaults to `'react-native-video'`. |
| extraParams | [`StringMap`](./flower-sdk.md#stringmap) | (Optional) Additional information pre-agreed for targeting |
| adTagHeaders | [`StringMap`](./flower-sdk.md#stringmap) | (Optional) HTTP headers added to ad requests |

```ts
export type VodAdParams = {
  adTagUrl: string;
  contentId: string;
  durationMs: number;
  playerType?: PlayerType;
  extraParams?: StringMap;
  adTagHeaders?: StringMap;
};
```

**Rejects** when no view carries that `nativeID`, or when its player has not been built yet.

### notifyContentEnded

Tells the SDK the content played to its end, so a post-roll can run. See [`notifyContentEnded`](./flower-sdk.md#notifycontentended).

### play

Starts a prepared break. See [`play`](./flower-sdk.md#play).

### stop

Ends the current break. See [`stop`](./flower-sdk.md#stop).

## Work Process

1. Mount `<Video nativeID="…" paused>` on the content URL, held until the pre-roll is over. The URL is never rewritten for VOD.
2. Subscribe to ad events with [`addAdEventListenerFor`](./ad-event.md#addadeventlistenerfor).
3. Once `onLoad` fires, call `requestVodAd()` with that `nativeID`.
4. On `prepare`, call [`play`](./flower-sdk.md#play).
5. On the first `completed` or `error`, start the content. From then on leave it alone — the SDK pauses and resumes it around a mid-roll. A later `error` needs nothing either — the SDK has brought the content back before sending it — unless its message starts with `playback unrecoverable`, in which case reload the content or show an error.
6. Call [`notifyContentEnded`](./flower-sdk.md#notifycontentended) from the `<Video>` component's `onEnd` prop so a post-roll can run, after marking the content ended (a ref) so a post-roll `error` does not resume it.
7. Call [`release`](./flower-sdk.md#release) when the `<Video>` unmounts.

```tsx
// arg0: nativeId, the nativeID of the <Video> playing the content
// params.adTagUrl:      url from the flower system
//                       You must file a request to Anypoint Media to receive an adTagUrl.
// params.contentId:     unique content id in your service
// params.durationMs:    duration of the vod content in milliseconds
// params.extraParams:   (Optional) values you can provide for targeting
// params.adTagHeaders:  (Optional) values included in headers for ad requests
await requestVodAd('vod-1', {
  adTagUrl: 'https://ad_request',
  contentId: '100',
  durationMs: 3600000,
  extraParams: {genre: 'horror'},
  adTagHeaders: {'custom-ad-header': 'custom-ad-header-value'},
});
```

:::caution
`durationMs` must be the real total duration of the content. The SDK places the break positions against it, so a wrong value puts the mid-rolls in the wrong place.
:::

## Related APIs

*   [SDK Lifecycle](./flower-sdk.md)
*   [Ad Events](./ad-event.md)
*   [VOD Ad Implementation](../ad-insertion/vod/vod-ad-implementation.md)
