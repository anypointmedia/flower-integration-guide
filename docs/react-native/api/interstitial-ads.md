---
sidebar_position: 4
---

# Interstitial Ads

## Methods

### requestAd

```ts
function requestAd(nativeId: string, params: InlineAdParams): Promise<void>;
```

Requests an inline (interstitial) ad break, played in the overlay over `<Video nativeID={nativeId}>` on the SDK's own ad player.

Pausing and resuming the content around it is the app's business, which is also why this call — unlike [`changeChannelUrl`](./linear-channels-fast.md#changechannelurl) and [`requestVodAd`](./vod.md#requestvodad) — does **not** need the video's player to exist yet. Only the view is looked up.

Ads arrive as a `prepare` event and then wait for [`play`](./flower-sdk.md#play).

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The `nativeID` of the view the ad overlay mounts on |
| params | [`InlineAdParams`](#inlineadparams) | Ad configuration |

### InlineAdParams

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | Ad tag URL issued by an ad server |
| playerType | [`PlayerType`](./flower-sdk.md#playertype) | (Optional) Player library owning the view. Defaults to `'react-native-video'`. |
| extraParams | [`StringMap`](./flower-sdk.md#stringmap) | (Optional) Additional information pre-agreed for targeting |
| adTagHeaders | [`StringMap`](./flower-sdk.md#stringmap) | (Optional) HTTP headers added to ad requests |

```ts
export type InlineAdParams = {
  adTagUrl: string;
  playerType?: PlayerType;
  extraParams?: StringMap;
  adTagHeaders?: StringMap;
};
```

**Rejects** when no view carries that `nativeID`.

:::note
`playerType` still matters here even though the break plays on the SDK's own ad player: it decides which kind of view is looked up to mount the overlay on.
:::

### play

Starts the prepared break. See [`play`](./flower-sdk.md#play).

### stop

Ends ad playback. See [`stop`](./flower-sdk.md#stop).

## Work Process

1. Mount the `<Video nativeID="…">` the overlay should cover. For a full-screen interstitial, make it full screen.
2. Subscribe to ad events with [`addAdEventListenerFor`](./ad-event.md#addadeventlistenerfor).
3. Call `requestAd()` at the point the break belongs in your flow.
4. On `prepare`, pause your content and call [`play`](./flower-sdk.md#play). On `completed` or `error`, resume it and call [`stop`](./flower-sdk.md#stop).
5. Call [`release`](./flower-sdk.md#release) when the view unmounts.

```tsx
// arg0: nativeId, the nativeID of the view the ad overlay mounts on
// params.adTagUrl:      url from the flower system
//                       You must file a request to Anypoint Media to receive an adTagUrl.
// params.extraParams:   (Optional) values you can provide for targeting
// params.adTagHeaders:  (Optional) values included in headers for ad requests
await requestAd('inline-1', {
  adTagUrl: 'https://ad_request',
  extraParams: {genre: 'horror'},
  adTagHeaders: {'custom-ad-header': 'custom-ad-header-value'},
});
```

## Related APIs

*   [SDK Lifecycle](./flower-sdk.md)
*   [Ad Events](./ad-event.md)
*   [Inline Ad Implementation](../ad-insertion/advanced-ad-formats/inline-ad-implementation.md)
