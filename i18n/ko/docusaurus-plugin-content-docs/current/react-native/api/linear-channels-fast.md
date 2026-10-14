---
sidebar_position: 2
---

# Linear Channels / FAST

## 메서드

### changeChannelUrl

```ts
function changeChannelUrl(nativeId: string, params: ChannelParams): Promise<string>;
```

`<Video nativeID={nativeId}>`의 플레이어를 SDK에 인계하고, `params.videoUrl` 대신 재생할 **로컬 프록시 URL**을 반환합니다.

`<Video>`는 이미 원본 URL로 마운트되어 있어야 합니다. `react-native-video`는 소스가 설정된 뒤에야 플레이어를 만들고, SDK는 어댑터를 선택하기 위해 그 인스턴스가 필요하기 때문입니다. `onLoad`를 기다리는 것이 확실한 신호입니다.

| **파라미터** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 인계할 `<Video>`의 `nativeID` |
| params | [`ChannelParams`](#channelparams) | 채널 및 광고 설정 |

### ChannelParams

| **필드** | **타입** | **설명** |
| ---| ---| --- |
| videoUrl | string | 원본 재생 URL |
| adTagUrl | string | 광고 서버에서 발급한 광고 태그 URL |
| channelId | string | 채널 ID<br/>FLOWER 백엔드 시스템에 등록된 채널 ID여야 합니다 |
| playerType | [`PlayerType`](./flower-sdk.md#playertype) | (선택) 뷰를 소유한 플레이어 라이브러리. 기본값 `'react-native-video'` |
| extraParams | [`StringMap`](./flower-sdk.md#stringmap) | (선택) 타게팅을 위해 사전 협의된 추가 정보 |
| adTagHeaders | [`StringMap`](./flower-sdk.md#stringmap) | (선택) 광고 요청에 추가할 HTTP 헤더 |
| channelStreamHeaders | [`StringMap`](./flower-sdk.md#stringmap) | (선택) 원본 스트림 요청에 추가할 HTTP 헤더 |
| prerollAdTagUrl | string | (선택) 채널 재생 전에 삽입할 프리롤 광고 태그 URL |

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

해당 `nativeID`를 가진 뷰가 없거나, 뷰의 플레이어가 아직 생성되지 않았으면 **reject**됩니다.

### prerollAdTagUrl

`prerollAdTagUrl`을 지정하면 SDK는 채널 자체가 시작되기 전에 채널 프리롤을 재생합니다:

*   Promise는 그대로 즉시 프록시 URL로 resolve됩니다. 이 URL을 보관하고, 아직 소스로 설정하지 마세요.
*   SDK가 프리롤을 직접 시작합니다 — `prepare`, 이어서 `play` — 오버레이 안의 SDK 자체 광고 플레이어에서 재생하며, 그동안 콘텐츠 플레이어를 일시정지합니다. 앱은 프리롤을 위해 [`play`](./flower-sdk.md#play)를 호출하지 않습니다.
*   프리롤이 끝나면 SDK가 `completed`를 보냅니다. 이때 보관한 프록시 URL을 소스로 설정하세요.
*   프리롤 태그가 광고를 반환하지 않거나 요청 또는 재생이 실패해도 SDK는 `error`가 아니라 `completed`를 보내므로, 채널은 그대로 시작됩니다.
*   `changeChannelUrl()`을 호출할 때마다 해당 `nativeId`에서 실행 중이던 세션이 중지되고(아직 재생 중인 프리롤 포함), 새 호출의 프리롤이 요청됩니다. 프리롤 없이 시작하려면 `error` 이후의 재시작처럼 `prerollAdTagUrl`을 생략하세요.

[프리롤 광고](../ad-insertion/linear-tv-fast/linear-tv-implementation.md#프리롤-광고)를 참고하세요.

### stop

해당 채널의 현재 광고 브레이크를 중단합니다. 콘텐츠 재생은 계속됩니다. [`stop`](./flower-sdk.md#stop)을 참고하세요.

`error` 이벤트 이후의 `stop()`은 채널 재시작의 첫 단계입니다: 광고 매니저를 중지한 뒤 `prerollAdTagUrl` 없이 `changeChannelUrl()`을 다시 호출하고, 반환된 새 프록시 URL을 재생합니다. [오류 복구](../ad-insertion/linear-tv-fast/linear-tv-implementation.md#오류-복구)를 참고하세요.

## 작업 절차

1. `react-native-video`가 플레이어를 만들도록 **원본** 스트림 URL로 `<Video nativeID="…">`를 마운트합니다.
2. 광고 재생에 반응해야 한다면 [`addAdEventListenerFor`](./ad-event.md#addadeventlistenerfor)로 광고 이벤트를 구독합니다.
3. `onLoad`가 발생하면 해당 `nativeID`로 `changeChannelUrl()`을 호출합니다.
4. `<Video>`의 소스를 반환된 프록시 URL로 교체합니다. 플레이어는 재생성되지 않고 재사용됩니다. `prerollAdTagUrl`을 지정했다면 프록시 URL을 보관했다가, 프리롤이 끝났음을 알리는 `completed` 이벤트에서 교체합니다.
5. [`error`](./ad-event.md#error) 이벤트가 발생하면 `await stop(nativeId)` 후 3–4단계를 반복합니다: `prerollAdTagUrl`을 제외한 같은 파라미터로 `changeChannelUrl()`을 새로 호출하고, 새 프록시 URL을 바로 소스로 설정합니다. 재시작할 때는 채널 프리롤을 넣지 않습니다(`prerollAdTagUrl` 생략). 시청자가 이미 프리롤을 봤기 때문이며, 따라서 기다릴 `completed`도 없습니다. 계속 실패하는 채널이 무한 반복되지 않도록 재시작 횟수에 상한을 두세요.
6. `<Video>`가 unmount될 때 [`release`](./flower-sdk.md#release)를 호출합니다.

```tsx
// arg0: nativeId, 인계할 <Video>의 nativeID
// params.videoUrl:              Linear TV 원본 스트림 URL
// params.adTagUrl:              flower 시스템에서 발급된 URL
//                               adTagUrl은 Anypoint Media에 요청하여 발급받아야 합니다.
// params.channelId:             서비스 내 고유 채널 ID
// params.extraParams:           (선택) 타게팅용으로 전달할 값
// params.adTagHeaders:          (선택) 광고 요청 헤더에 포함할 값
// params.channelStreamHeaders:  (선택) 채널 스트림 요청 헤더에 포함할 값
// params.prerollAdTagUrl:       (선택) 프리롤 광고 태그 URL
const proxyUrl = await changeChannelUrl('channel-1', {
  videoUrl: 'https://XXX',
  adTagUrl: 'https://ad_request',
  channelId: '100',
  extraParams: {genre: 'horror'},
  adTagHeaders: {'custom-ad-header': 'custom-ad-header-value'},
  channelStreamHeaders: {'custom-stream-header': 'custom-stream-header-value'},
  prerollAdTagUrl: 'https://preroll_ad_request',
});

// prerollAdTagUrl이 있으면 프록시 URL을 보관했다가 'completed'에서 소스로 설정합니다.
// 없으면 바로 설정합니다: setSourceUri(proxyUrl).
pendingProxyUrl.current = proxyUrl;
```

## 관련 API

*   [SDK 생명주기](./flower-sdk.md)
*   [광고 이벤트](./ad-event.md)
*   [Linear TV 광고 구현](../ad-insertion/linear-tv-fast/linear-tv-implementation.md)
