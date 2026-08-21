---
sidebar_position: 1
---

# Linear TV 광고 구현

Linear TV 및 FAST 채널은 `changeChannelUrl()`을 사용합니다. SDK는 원본 스트림에 대체 광고를 매니페스트 단위로 스플라이싱한 로컬 프록시 URL을 반환하며, 광고 브레이크는 스트림의 큐(cue)에 따라 예약되어 자동으로 재생됩니다 — 앱에서 `play()`를 호출할 필요가 없습니다.

먼저 [연동 동작 방식](../how-the-integration-works.md)을 읽어보세요. 아래의 2단계 인계가 그 핵심입니다.

## 구현

```tsx
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Video from 'react-native-video';
import {
  addAdEventListenerFor,
  changeChannelUrl,
  release,
} from '@anypoint/flower-sdk-react-native';

type Props = {
  nativeId: string;
  videoUrl: string;
  adTagUrl: string;
  channelId: string;
};

export function ChannelPlayer({nativeId, videoUrl, adTagUrl, channelId}: Props) {
  // 1단계: react-native-video가 플레이어를 만들도록 원본 URL로 마운트합니다.
  const [sourceUri, setSourceUri] = useState(videoUrl);
  const handedOver = useRef(false);

  // 이 채널의 광고 이벤트만 구독합니다.
  useEffect(() => {
    const subscription = addAdEventListenerFor(nativeId, event => {
      switch (event.event) {
        case 'adBreakPrepare':
          console.log(`ad break loaded: ${event.adCount} ads`);
          break;
        case 'play':
          console.log('ad break started');
          break;
        case 'completed':
          console.log('ad break finished');
          break;
        case 'error':
          console.error(`ad error: ${event.message}`);
          break;
      }
    });
    return () => subscription.remove();
  }, [nativeId]);

  // 네이티브 측이 이 채널의 광고 오버레이를 보유하므로, 비디오가 사라질 때 알려야 합니다.
  useEffect(
    () => () => {
      if (handedOver.current) {
        release(nativeId).catch(() => {});
      }
    },
    [nativeId],
  );

  // 2단계: 플레이어가 생성된 뒤 인계하고, 반환된 프록시 URL을 재생합니다.
  const handOver = useCallback(async () => {
    if (handedOver.current) {
      return;
    }
    try {
      const proxyUrl = await changeChannelUrl(nativeId, {
        videoUrl,
        adTagUrl,
        channelId,
      });
      handedOver.current = true;
      // 3단계: 소스를 교체합니다. 플레이어는 재생성되지 않고 재사용됩니다.
      setSourceUri(proxyUrl);
    } catch (error: any) {
      console.error(`changeChannelUrl failed: ${error.message}`);
    }
  }, [nativeId, videoUrl, adTagUrl, channelId]);

  return (
    <View style={styles.player}>
      <Video
        // SDK는 nativeID로 이 플레이어를 찾습니다. 화면 내에서 고유해야 합니다.
        nativeID={nativeId}
        source={{uri: sourceUri}}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        // onLoad는 플레이어가 존재한다는 확실한 신호입니다.
        onLoad={handOver}
        onError={e => console.error(`player error: ${JSON.stringify(e)}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  player: {width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000'},
});
```

:::caution
`handOver`를 ref로 가드하는 이유는, 소스를 프록시 URL로 교체하면 `onLoad`가 다시 발생하기 때문입니다. 가드가 없으면 두 번째 `onLoad`에서 `changeChannelUrl()`이 한 번 더 호출됩니다.
:::

## 타게팅과 헤더

`changeChannelUrl()`은 선택적으로 타게팅 정보와 HTTP 헤더를 받습니다:

```tsx
const proxyUrl = await changeChannelUrl(nativeId, {
  videoUrl,
  adTagUrl,
  channelId,
  // 타게팅을 위해 사전 협의된 추가 정보
  extraParams: {title: 'My Summer Vacation', genre: 'horror'},
  // 광고 요청에 추가할 헤더
  adTagHeaders: {'custom-ad-header': 'custom-ad-header-value'},
  // 원본 스트림 요청에 추가할 헤더
  channelStreamHeaders: {'custom-stream-header': 'custom-stream-header-value'},
});
```

타게팅 키는 [extraParams 정의](../define-extra-params.md)를, 전체 파라미터는 [`changeChannelUrl` 레퍼런스](../../api/linear-channels-fast.md)를 참고하세요.

## Pre-roll 광고

`prerollAdTagUrl`을 지정하면 채널 재생이 시작되기 **전에** 광고 브레이크가 예약됩니다. 이 경우 pre-roll이 먼저 재생되므로, 반환된 프록시 URL을 즉시 재생하지 말고 `completed` 이벤트를 기다렸다가 적용하세요:

```tsx
const [sourceUri, setSourceUri] = useState(videoUrl);
const proxyUrlRef = useRef<string | null>(null);

useEffect(() => {
  const subscription = addAdEventListenerFor(nativeId, event => {
    if (event.event === 'completed' && proxyUrlRef.current) {
      // pre-roll이 끝났으므로 이제 콘텐츠를 프록시 URL로 전환합니다.
      setSourceUri(proxyUrlRef.current);
      proxyUrlRef.current = null;
    }
  });
  return () => subscription.remove();
}, [nativeId]);

const handOver = useCallback(async () => {
  const proxyUrl = await changeChannelUrl(nativeId, {
    videoUrl,
    adTagUrl,
    channelId,
    prerollAdTagUrl,
  });
  // 즉시 적용하지 않고 보관합니다 — pre-roll이 먼저 재생됩니다.
  proxyUrlRef.current = proxyUrl;
}, [nativeId, videoUrl, adTagUrl, channelId, prerollAdTagUrl]);
```

## 광고 브레이크 중단

`stop(nativeId)`은 진행 중인 광고 브레이크를 종료합니다. 채널 자체의 재생은 프록시 URL에서 계속되고 세션도 유지되므로, 이후의 브레이크는 정상적으로 재생됩니다.

```tsx
await stop(nativeId);
```

채널에서 완전히 벗어날 때는 `release(nativeId)`를 호출하세요.

## 관련 문서

*   [`changeChannelUrl` API 레퍼런스](../../api/linear-channels-fast.md)
*   [광고 이벤트](../../api/ad-event.md)
*   [Bitmovin 플레이어 사용하기](../using-bitmovin-player.md)
