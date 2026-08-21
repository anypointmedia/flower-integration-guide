---
sidebar_position: 6
---

# extraParams 정의

광고를 요청할 때 추가 정보를 SDK에 전달하면, SDK가 더 적합한 광고를 제공하는 데 도움이 됩니다.

React Native에서 `extraParams`는 문자열 값을 갖는 일반 `{key: value}` 객체이며, `changeChannelUrl()`, `requestVodAd()`, `requestAd()`에서 모두 사용할 수 있습니다:

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

| **키 (예시)** | **값 (예시)** |
| ---| --- |
| title | My Summer Vacation |
| genre | horror |
| contentRating | PG-13 |

:::note
`extraParams`를 생략하는 것과 빈 객체를 전달하는 것은 다릅니다. SDK는 생략된 값을 "제공되지 않음"으로 해석합니다. `adTagHeaders`, `channelStreamHeaders`도 마찬가지입니다.
:::

키와 값은 AnypointMedia와 사전에 협의합니다. 서비스에 맞는 타게팅 스키마를 정하려면 [dev-support@anypointmedia.com](mailto:dev-support@anypointmedia.com)으로 문의해 주세요.

## HTTP 헤더

`adTagHeaders`와 `channelStreamHeaders`도 동일한 `StringMap` 형태를 사용합니다:

| 파라미터 | 적용 대상 | 사용 가능한 함수 |
| ---| ---| --- |
| `adTagHeaders` | 광고 요청 | `changeChannelUrl`, `requestVodAd`, `requestAd` |
| `channelStreamHeaders` | 원본 스트림 요청 | `changeChannelUrl` 전용 |

```tsx
await changeChannelUrl(nativeId, {
  videoUrl,
  adTagUrl,
  channelId,
  adTagHeaders: {'custom-ad-header': 'custom-ad-header-value'},
  channelStreamHeaders: {'custom-stream-header': 'custom-stream-header-value'},
});
```
