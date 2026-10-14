---
sidebar_position: 3
---

# VOD

## 메서드

### requestVodAd

```ts
function requestVodAd(nativeId: string, params: VodAdParams): Promise<void>;
```

`<Video nativeID={nativeId}>`에서 재생 중인 VOD 콘텐츠의 광고 브레이크를 요청합니다.

여기서는 아무것도 재작성되지 않습니다 — 콘텐츠는 원래 URL로 계속 재생되고, 각 브레이크는 `prepare` 이벤트로 전달되며(mid-roll은 콘텐츠가 해당 위치에 도달했을 때), 앱은 그 시점에 [`play`](./flower-sdk.md#play)를 호출합니다.

SDK는 프리롤을 위해 콘텐츠를 붙잡아 두지 않으므로, `<Video>`를 일시정지 상태로 마운트하고 첫 `completed` 또는 `error`에서 콘텐츠를 시작하세요. 프리롤이 없거나, 광고 응답이 비어 있거나, 요청이 실패해도 `completed`가 전달됩니다. 그 이후에는 콘텐츠를 건드리지 마세요. 기본 설정에서 브레이크는 SDK 자체 광고 플레이어에서 재생되며, mid-roll의 경우 SDK가 콘텐츠를 일시정지하고 `completed` 시점에 되감기 시간(5초)만큼 되돌려 재개합니다. 콘텐츠가 시작된 뒤에는 일시정지, 탐색, 재로드하지 마세요. 콘텐츠가 시작된 뒤의 `error`도 마찬가지입니다. 브레이크가 실패하면 SDK가 `error`를 보내기 전에 콘텐츠를 되돌려 놓으므로, mid-roll 실패 후 콘텐츠는 이미 다시 재생 중이며, post-roll `error` 이후에는 콘텐츠가 끝난 상태입니다. 메시지가 `playback unrecoverable`로 시작하는 `error`(콘텐츠 자체가 멈춤)일 때만 콘텐츠를 다시 로드하거나 오류를 표시하세요. [VOD 광고 구현](../ad-insertion/vod/vod-ad-implementation.md#handling-error)을 참고하세요.

[`changeChannelUrl`](./linear-channels-fast.md#changechannelurl)과 동일한 조건이 적용됩니다 — `<Video>`의 플레이어가 이미 존재해야 합니다.

| **파라미터** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 콘텐츠를 재생 중인 `<Video>`의 `nativeID` |
| params | [`VodAdParams`](#vodadparams) | 콘텐츠 및 광고 설정 |

### VodAdParams

| **필드** | **타입** | **설명** |
| ---| ---| --- |
| adTagUrl | string | 광고 서버에서 발급한 광고 태그 URL |
| contentId | string | 콘텐츠 ID<br/>FLOWER 백엔드 시스템에 등록되어 있어야 합니다 |
| durationMs | number | VOD 콘텐츠의 총 재생 시간(밀리초). SDK가 이 값을 기준으로 브레이크를 배치합니다 |
| playerType | [`PlayerType`](./flower-sdk.md#playertype) | (선택) 뷰를 소유한 플레이어 라이브러리. 기본값 `'react-native-video'` |
| extraParams | [`StringMap`](./flower-sdk.md#stringmap) | (선택) 타게팅을 위해 사전 협의된 추가 정보 |
| adTagHeaders | [`StringMap`](./flower-sdk.md#stringmap) | (선택) 광고 요청에 추가할 HTTP 헤더 |

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

해당 `nativeID`를 가진 뷰가 없거나, 뷰의 플레이어가 아직 생성되지 않았으면 **reject**됩니다.

### notifyContentEnded

콘텐츠가 끝까지 재생되었음을 SDK에 알려 post-roll이 재생될 수 있게 합니다. [`notifyContentEnded`](./flower-sdk.md#notifycontentended)를 참고하세요.

### play

준비된 브레이크를 시작합니다. [`play`](./flower-sdk.md#play)를 참고하세요.

### stop

현재 브레이크를 종료합니다. [`stop`](./flower-sdk.md#stop)을 참고하세요.

## 작업 절차

1. 콘텐츠 URL로 `<Video nativeID="…" paused>`를 마운트하고, 프리롤이 끝날 때까지 붙잡아 둡니다. VOD에서는 URL이 재작성되지 않습니다.
2. [`addAdEventListenerFor`](./ad-event.md#addadeventlistenerfor)로 광고 이벤트를 구독합니다.
3. `onLoad`가 발생하면 해당 `nativeID`로 `requestVodAd()`를 호출합니다.
4. `prepare`에서 [`play`](./flower-sdk.md#play)를 호출합니다.
5. 첫 `completed` 또는 `error`에서 콘텐츠를 시작합니다. 그 이후에는 콘텐츠를 건드리지 마세요 — mid-roll 전후의 일시정지와 재개는 SDK가 처리합니다. 이후의 `error`에서도 할 일은 없습니다 — SDK가 이벤트를 보내기 전에 콘텐츠를 되돌려 놓습니다. 단, 메시지가 `playback unrecoverable`로 시작하면 콘텐츠를 다시 로드하거나 오류를 표시합니다.
6. post-roll이 재생될 수 있도록 `<Video>` 컴포넌트의 `onEnd` prop에서 [`notifyContentEnded`](./flower-sdk.md#notifycontentended)를 호출합니다. 그 전에 콘텐츠 종료를 ref로 표시해 두어, post-roll `error`가 콘텐츠를 재개하지 않게 합니다.
7. `<Video>`가 unmount될 때 [`release`](./flower-sdk.md#release)를 호출합니다.

```tsx
// arg0: nativeId, 콘텐츠를 재생 중인 <Video>의 nativeID
// params.adTagUrl:      flower 시스템에서 발급된 URL
//                       adTagUrl은 Anypoint Media에 요청하여 발급받아야 합니다.
// params.contentId:     서비스 내 고유 콘텐츠 ID
// params.durationMs:    VOD 콘텐츠의 재생 시간(밀리초)
// params.extraParams:   (선택) 타게팅용으로 전달할 값
// params.adTagHeaders:  (선택) 광고 요청 헤더에 포함할 값
await requestVodAd('vod-1', {
  adTagUrl: 'https://ad_request',
  contentId: '100',
  durationMs: 3600000,
  extraParams: {genre: 'horror'},
  adTagHeaders: {'custom-ad-header': 'custom-ad-header-value'},
});
```

:::caution
`durationMs`는 콘텐츠의 실제 총 재생 시간이어야 합니다. SDK가 이 값을 기준으로 브레이크 위치를 배치하므로, 값이 잘못되면 mid-roll이 엉뚱한 위치에 삽입됩니다.
:::

## 관련 API

*   [SDK 생명주기](./flower-sdk.md)
*   [광고 이벤트](./ad-event.md)
*   [VOD 광고 구현](../ad-insertion/vod/vod-ad-implementation.md)
