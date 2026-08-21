---
sidebar_position: 4
---

# 전면 광고

## 메서드

### requestAd

```ts
function requestAd(nativeId: string, params: InlineAdParams): Promise<void>;
```

`<Video nativeID={nativeId}>` 위의 오버레이에서 SDK 자체 광고 플레이어로 재생되는 인라인(전면) 광고 브레이크를 요청합니다.

브레이크 전후로 콘텐츠를 일시정지하고 재개하는 것은 앱의 몫이며, 그렇기 때문에 이 호출은 [`changeChannelUrl`](./linear-channels-fast.md#changechannelurl), [`requestVodAd`](./vod.md#requestvodad)와 달리 비디오의 플레이어가 아직 생성되지 않아도 됩니다. 뷰만 조회합니다.

광고는 `prepare` 이벤트로 전달된 뒤 [`play`](./flower-sdk.md#play)를 기다립니다.

| **파라미터** | **타입** | **설명** |
| ---| ---| --- |
| nativeId | string | 광고 오버레이가 마운트될 뷰의 `nativeID` |
| params | [`InlineAdParams`](#inlineadparams) | 광고 설정 |

### InlineAdParams

| **필드** | **타입** | **설명** |
| ---| ---| --- |
| adTagUrl | string | 광고 서버에서 발급한 광고 태그 URL |
| playerType | [`PlayerType`](./flower-sdk.md#playertype) | (선택) 뷰를 소유한 플레이어 라이브러리. 기본값 `'react-native-video'` |
| extraParams | [`StringMap`](./flower-sdk.md#stringmap) | (선택) 타게팅을 위해 사전 협의된 추가 정보 |
| adTagHeaders | [`StringMap`](./flower-sdk.md#stringmap) | (선택) 광고 요청에 추가할 HTTP 헤더 |

```ts
export type InlineAdParams = {
  adTagUrl: string;
  playerType?: PlayerType;
  extraParams?: StringMap;
  adTagHeaders?: StringMap;
};
```

해당 `nativeID`를 가진 뷰가 없으면 **reject**됩니다.

:::note
브레이크가 SDK 자체 광고 플레이어에서 재생되더라도 `playerType`은 여전히 의미가 있습니다. 오버레이를 마운트할 뷰를 어떤 방식으로 조회할지 결정하기 때문입니다.
:::

### play

준비된 브레이크를 시작합니다. [`play`](./flower-sdk.md#play)를 참고하세요.

### stop

광고 재생을 종료합니다. [`stop`](./flower-sdk.md#stop)을 참고하세요.

## 작업 절차

1. 오버레이가 덮을 `<Video nativeID="…">`를 마운트합니다. 전체 화면 전면 광고를 원한다면 전체 화면으로 배치하세요.
2. [`addAdEventListenerFor`](./ad-event.md#addadeventlistenerfor)로 광고 이벤트를 구독합니다.
3. 앱 흐름에서 브레이크가 필요한 지점에 `requestAd()`를 호출합니다.
4. `prepare`에서 콘텐츠를 일시정지하고 [`play`](./flower-sdk.md#play)를 호출합니다. `completed` 또는 `error`에서 콘텐츠를 재개하고 [`stop`](./flower-sdk.md#stop)을 호출합니다.
5. 뷰가 unmount될 때 [`release`](./flower-sdk.md#release)를 호출합니다.

```tsx
// arg0: nativeId, 광고 오버레이가 마운트될 뷰의 nativeID
// params.adTagUrl:      flower 시스템에서 발급된 URL
//                       adTagUrl은 Anypoint Media에 요청하여 발급받아야 합니다.
// params.extraParams:   (선택) 타게팅용으로 전달할 값
// params.adTagHeaders:  (선택) 광고 요청 헤더에 포함할 값
await requestAd('inline-1', {
  adTagUrl: 'https://ad_request',
  extraParams: {genre: 'horror'},
  adTagHeaders: {'custom-ad-header': 'custom-ad-header-value'},
});
```

## 관련 API

*   [SDK 생명주기](./flower-sdk.md)
*   [광고 이벤트](./ad-event.md)
*   [인라인 광고 구현](../ad-insertion/advanced-ad-formats/inline-ad-implementation.md)
