---
sidebar_position: 1
---

# 인라인 광고 구현

인라인(전면) 광고는 `requestAd()`로 요청하는 독립적인 광고 브레이크입니다. 지정한 `<Video>` 위에 마운트된 오버레이 안에서, SDK 자체 광고 플레이어로 재생됩니다 — 콘텐츠 플레이어는 SDK에 인계되지 않습니다.

이 차이가 중요합니다. **`requestAd()`는 비디오의 플레이어가 아직 생성되지 않아도 됩니다.** 뷰만 조회하므로 `<Video>`가 마운트되기만 하면 호출할 수 있습니다. 브레이크 전후로 콘텐츠를 일시정지하고 재개하는 것은 여전히 앱의 몫입니다.

## 구현

```tsx
import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Video from 'react-native-video';
import {
  addAdEventListenerFor,
  play,
  release,
  requestAd,
  stop,
} from '@anypoint/flower-sdk-react-native';

type Props = {
  nativeId: string;
  contentUrl: string;
  adTagUrl: string;
};

export function InlineAdPlayer({nativeId, contentUrl, adTagUrl}: Props) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const subscription = addAdEventListenerFor(nativeId, event => {
      switch (event.event) {
        case 'prepare':
          // 브레이크가 준비되어 대기 중입니다. 콘텐츠를 멈추고 재생을 시작합니다.
          setPaused(true);
          play(nativeId).catch(e => console.error(`play failed: ${e.message}`));
          break;
        case 'adPlay':
          console.log(`ad ${event.adId} started, ${event.durationMs}ms`);
          break;
        case 'completed':
          setPaused(false);
          stop(nativeId).catch(() => {});
          break;
        case 'error':
          setPaused(false);
          stop(nativeId).catch(() => {});
          console.error(`ad error: ${event.message}`);
          break;
        case 'adBreakSkipped':
          setPaused(false);
          console.log(`ad break skipped, reason ${event.reason}`);
          break;
      }
    });
    return () => subscription.remove();
  }, [nativeId]);

  useEffect(
    () => () => {
      release(nativeId).catch(() => {});
    },
    [nativeId],
  );

  // Linear TV, VOD와 달리 플레이어가 필요 없고 마운트된 뷰만 있으면 됩니다.
  const showAd = useCallback(async () => {
    try {
      await requestAd(nativeId, {adTagUrl});
    } catch (error: any) {
      console.error(`requestAd failed: ${error.message}`);
    }
  }, [nativeId, adTagUrl]);

  return (
    <View style={styles.player}>
      <Video
        nativeID={nativeId}
        source={{uri: contentUrl}}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        paused={paused}
      />
      {/* 앱 흐름에서 브레이크가 필요한 지점에서 showAd()를 호출하세요 */}
    </View>
  );
}

const styles = StyleSheet.create({
  player: {width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000'},
});
```

:::note
오버레이는 `nativeID`를 가진 뷰 위에 마운트되며 그 뷰를 가득 채웁니다. 전체 화면 전면 광고를 원한다면 전체 화면 `<Video>`를 지정하세요.
:::

## 타게팅과 헤더

```tsx
await requestAd(nativeId, {
  adTagUrl,
  extraParams: {title: 'My Summer Vacation', genre: 'horror'},
  adTagHeaders: {'custom-ad-header': 'custom-ad-header-value'},
});
```

[`requestAd` API 레퍼런스](../../api/interstitial-ads.md)를 참고하세요.

## 다른 광고 유형과의 비교

| | Linear TV | VOD | Inline |
| ---| ---| ---| --- |
| 함수 | `changeChannelUrl()` | `requestVodAd()` | `requestAd()` |
| 콘텐츠 플레이어 필요 | 필요 | 필요 | **불필요** |
| 콘텐츠 URL 재작성 | 재작성 | 안 함 | 안 함 |
| 브레이크 시작 주체 | SDK | 앱 (`play()`) | 앱 (`play()`) |
| 앱이 콘텐츠 일시정지 | 안 함 | 함 | 함 |

## 관련 문서

*   [`requestAd` API 레퍼런스](../../api/interstitial-ads.md)
*   [광고 이벤트](../../api/ad-event.md)
*   [연동 동작 방식](../how-the-integration-works.md)
