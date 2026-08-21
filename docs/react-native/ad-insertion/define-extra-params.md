---
sidebar_position: 6
---

# Define extraParams

Providing additional parameters to the SDK when requesting an ad helps the SDK deliver the most relevant ad.

In React Native, `extraParams` is a plain `{key: value}` object of strings, accepted by `changeChannelUrl()`, `requestVodAd()` and `requestAd()`:

```ts
export type StringMap = {[key: string]: string};
```

```tsx
await changeChannelUrl(nativeId, {
  videoUrl,
  adTagUrl,
  channelId,
  extraParams: {
    title: 'My Summer Vacation',
    genre: 'horror',
    contentRating: 'PG-13',
  },
});
```

| **Key (examples)** | **Value (examples)** |
| ---| --- |
| title | My Summer Vacation |
| genre | horror |
| contentRating | PG-13 |

:::note
Leaving `extraParams` out is not the same as passing an empty object — the SDK reads an omitted value as "not supplied". The same applies to `adTagHeaders` and `channelStreamHeaders`.
:::

The keys and values are agreed with AnypointMedia in advance. Contact [dev-support@anypointmedia.com](mailto:dev-support@anypointmedia.com) to arrange the targeting schema for your service.

## HTTP Headers

`adTagHeaders` and `channelStreamHeaders` use the same `StringMap` shape:

| Parameter | Applies to | Available on |
| ---| ---| --- |
| `adTagHeaders` | Ad requests | `changeChannelUrl`, `requestVodAd`, `requestAd` |
| `channelStreamHeaders` | Requests for the original stream | `changeChannelUrl` only |

```tsx
await changeChannelUrl(nativeId, {
  videoUrl,
  adTagUrl,
  channelId,
  adTagHeaders: {'custom-ad-header': 'custom-ad-header-value'},
  channelStreamHeaders: {'custom-stream-header': 'custom-stream-header-value'},
});
```
