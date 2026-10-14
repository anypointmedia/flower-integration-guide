---
sidebar_position: 2
---

# Linear Channels / FAST

## Methods

### changeChannelUrl

```ts
function changeChannelUrl(nativeId: string, params: ChannelParams): Promise<string>;
```

Hands the player of the `<Video nativeID={nativeId}>` to the SDK and resolves with the **local proxy URL** to play instead of `params.videoUrl`.

The `<Video>` must already be mounted on the original URL: `react-native-video` only builds its player once a source is set, and the SDK needs that instance to pick an adapter. Waiting for `onLoad` is the reliable signal.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The `nativeID` of the `<Video>` to hand over |
| params | [`ChannelParams`](#channelparams) | Channel and ad configuration |

### ChannelParams

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | string | Original playback URL |
| adTagUrl | string | Ad tag URL issued by an ad server |
| channelId | string | Channel ID<br/>Channel IDs must be registered in the FLOWER backend system |
| playerType | [`PlayerType`](./flower-sdk.md#playertype) | (Optional) Player library owning the view. Defaults to `'react-native-video'`. |
| extraParams | [`StringMap`](./flower-sdk.md#stringmap) | (Optional) Additional information pre-agreed for targeting |
| adTagHeaders | [`StringMap`](./flower-sdk.md#stringmap) | (Optional) HTTP headers added to ad requests |
| channelStreamHeaders | [`StringMap`](./flower-sdk.md#stringmap) | (Optional) HTTP headers added to requests for the original stream |
| prerollAdTagUrl | string | (Optional) Ad tag URL for a pre-roll break, played before the channel itself starts |

```ts
export type ChannelParams = {
  videoUrl: string;
  adTagUrl: string;
  channelId: string;
  playerType?: PlayerType;
  extraParams?: StringMap;
  adTagHeaders?: StringMap;
  channelStreamHeaders?: StringMap;
  prerollAdTagUrl?: string;
};
```

**Rejects** when no view carries that `nativeID`, or when its player has not been built yet.

### prerollAdTagUrl

With `prerollAdTagUrl`, the SDK plays a channel pre-roll before the channel itself starts:

*   The promise still resolves with the proxy URL right away. Hold it: do not set it as the source yet.
*   The SDK starts the pre-roll by itself — `prepare`, then `play` — on its own ad player in the overlay, and pauses the content player while it runs. The app does not call [`play`](./flower-sdk.md#play) for it.
*   When the pre-roll ends, the SDK sends `completed`. Set the held proxy URL as the source there.
*   When the pre-roll tag returns no ad, or the request or playback fails, the SDK still sends `completed`, never `error`, so the channel still starts.
*   Each `changeChannelUrl()` call stops the session that was running for that `nativeId`, a pre-roll still playing included, and requests the pre-roll of the new call. Omit `prerollAdTagUrl` to start without one — as a restart after an `error` does.

See [Pre-roll Ads](../ad-insertion/linear-tv-fast/linear-tv-implementation.md#pre-roll-ads).

### stop

Stops the current ad break for one channel. Playback of the content itself continues. See [`stop`](./flower-sdk.md#stop).

After an `error` event, `stop()` is the first half of a channel restart: stop the ads manager, then call `changeChannelUrl()` again without `prerollAdTagUrl` and play the new proxy URL it returns. See [Recovering from an Error](../ad-insertion/linear-tv-fast/linear-tv-implementation.md#recovering-from-an-error).

## Work Process

1. Mount `<Video nativeID="…">` on the **original** stream URL so `react-native-video` builds its player.
2. Subscribe to ad events with [`addAdEventListenerFor`](./ad-event.md#addadeventlistenerfor) if your app needs to react to ad playback.
3. Once `onLoad` fires, call `changeChannelUrl()` with that `nativeID`.
4. Swap the `<Video>` source to the returned proxy URL. The player is reused, not rebuilt. With `prerollAdTagUrl`, hold the proxy URL and swap it in on the `completed` event that ends the pre-roll.
5. On an [`error`](./ad-event.md#error) event, `await stop(nativeId)`, then repeat steps 3–4: a new `changeChannelUrl()` with the same parameters except `prerollAdTagUrl`, and its new proxy URL as the source right away. A restart leaves the channel pre-roll out (`prerollAdTagUrl` omitted): the viewer has already seen it, so there is no `completed` to wait for. Cap the number of restarts so a channel that keeps failing does not loop.
6. Call [`release`](./flower-sdk.md#release) when the `<Video>` unmounts.

```tsx
// arg0: nativeId, the nativeID of the <Video> to hand over
// params.videoUrl:              original Linear TV stream url
// params.adTagUrl:              url from the flower system
//                               You must file a request to Anypoint Media to receive an adTagUrl.
// params.channelId:             unique channel id in your service
// params.extraParams:           (Optional) values you can provide for targeting
// params.adTagHeaders:          (Optional) values included in headers for ad requests
// params.channelStreamHeaders:  (Optional) values included in headers for the channel stream
// params.prerollAdTagUrl:       (Optional) ad tag url for a pre-roll break
const proxyUrl = await changeChannelUrl('channel-1', {
  videoUrl: 'https://XXX',
  adTagUrl: 'https://ad_request',
  channelId: '100',
  extraParams: {genre: 'horror'},
  adTagHeaders: {'custom-ad-header': 'custom-ad-header-value'},
  channelStreamHeaders: {'custom-stream-header': 'custom-stream-header-value'},
  prerollAdTagUrl: 'https://preroll_ad_request',
});

// With a prerollAdTagUrl, hold the proxy url and set it as the source on 'completed'.
// Without one, set it right away: setSourceUri(proxyUrl).
pendingProxyUrl.current = proxyUrl;
```

## Related APIs

*   [SDK Lifecycle](./flower-sdk.md)
*   [Ad Events](./ad-event.md)
*   [Linear TV Ad Implementation](../ad-insertion/linear-tv-fast/linear-tv-implementation.md)
