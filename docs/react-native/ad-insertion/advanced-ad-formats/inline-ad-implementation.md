---
sidebar_position: 1
---

# Inline Ad Implementation

An inline (interstitial) ad is a standalone break requested with `requestAd()`. It plays on the SDK's own ad player, in an overlay mounted over the `<Video>` you address — the content player is never handed over.

That difference matters: **`requestAd()` does not need the video's player to exist yet.** Only the view is looked up, so it can be called as soon as the `<Video>` is mounted. Pausing and resuming your content around the break remains your app's business.

## Implementation

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
          // The break is loaded and waiting. Pause the content, then start it.
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

  // Unlike the linear and VOD paths, this needs no player — only the mounted view.
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
      {/* call showAd() from wherever the break belongs in your flow */}
    </View>
  );
}

const styles = StyleSheet.create({
  player: {width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000'},
});
```

:::note
The overlay is mounted over the view carrying `nativeID`, and it fills that view. For a full-screen interstitial, address a full-screen `<Video>`.
:::

## Targeting and Headers

```tsx
await requestAd(nativeId, {
  adTagUrl,
  extraParams: {title: 'My Summer Vacation', genre: 'horror'},
  adTagHeaders: {'custom-ad-header': 'custom-ad-header-value'},
});
```

See the [`requestAd` API reference](../../api/interstitial-ads.md).

## Comparison with the Other Ad Types

| | Linear TV | VOD | Inline |
| ---| ---| ---| --- |
| Function | `changeChannelUrl()` | `requestVodAd()` | `requestAd()` |
| Needs the content player | Yes | Yes | **No** |
| Content URL rewritten | Yes | No | No |
| Break started by | The SDK | Your app, via `play()` | Your app, via `play()` |
| App pauses the content | No | Yes | Yes |

## Related

*   [`requestAd` API reference](../../api/interstitial-ads.md)
*   [Ad Events](../../api/ad-event.md)
*   [How the Integration Works](../how-the-integration-works.md)
