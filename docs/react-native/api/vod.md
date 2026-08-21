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

Nothing is rewritten here — the content keeps playing from its own URL, and each break arrives as a `prepare` event. That is where the app pauses the content and calls [`play`](./flower-sdk.md#play); the break ends with `completed`, where the content resumes.

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

1. Mount `<Video nativeID="…">` on the content URL. It is never rewritten for VOD.
2. Subscribe to ad events with [`addAdEventListenerFor`](./ad-event.md#addadeventlistenerfor).
3. Once `onLoad` fires, call `requestVodAd()` with that `nativeID`.
4. On `prepare`, pause the content and call [`play`](./flower-sdk.md#play). On `completed`, resume it.
5. Call [`notifyContentEnded`](./flower-sdk.md#notifycontentended) from the `<Video>` component's `onEnd` prop so a post-roll can run.
6. Call [`release`](./flower-sdk.md#release) when the `<Video>` unmounts.

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
