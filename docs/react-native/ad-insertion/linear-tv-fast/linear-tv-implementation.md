---
sidebar_position: 1
---

# Linear TV Ad Implementation

Linear TV and FAST channels use `changeChannelUrl()`. The SDK returns a local proxy URL that carries the original stream with replacement ads spliced into the manifest, and the breaks play themselves — scheduled by the cue in the stream, with no `play()` call from your app.

Read [How the Integration Works](../how-the-integration-works.md) first: the two-phase handover below is the core of it.

## Implementation

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
  // Phase 1: mount on the ORIGINAL url so react-native-video builds its player.
  const [sourceUri, setSourceUri] = useState(videoUrl);
  const handedOver = useRef(false);

  // Ad events for this channel only.
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

  // The native side retains this channel's ad overlay, so it has to be told when the video goes.
  useEffect(
    () => () => {
      if (handedOver.current) {
        release(nativeId).catch(() => {});
      }
    },
    [nativeId],
  );

  // Phase 2: hand the player over once it exists, then play the proxy url it returns.
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
      // Phase 3: swap the source. The player is reused, not rebuilt.
      setSourceUri(proxyUrl);
    } catch (error: any) {
      console.error(`changeChannelUrl failed: ${error.message}`);
    }
  }, [nativeId, videoUrl, adTagUrl, channelId]);

  return (
    <View style={styles.player}>
      <Video
        // The SDK addresses this player by nativeID. It must be unique on screen.
        nativeID={nativeId}
        source={{uri: sourceUri}}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        // onLoad is the reliable signal that the player exists.
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
`handOver` is guarded with a ref because `onLoad` fires again after the source is swapped to the proxy URL. Without the guard the second `onLoad` would call `changeChannelUrl()` a second time.
:::

## Targeting and Headers

`changeChannelUrl()` accepts optional targeting information and HTTP headers:

```tsx
const proxyUrl = await changeChannelUrl(nativeId, {
  videoUrl,
  adTagUrl,
  channelId,
  // Additional information pre-agreed for targeting.
  extraParams: {title: 'My Summer Vacation', genre: 'horror'},
  // Headers added to ad requests.
  adTagHeaders: {'custom-ad-header': 'custom-ad-header-value'},
  // Headers added to requests for the original stream.
  channelStreamHeaders: {'custom-stream-header': 'custom-stream-header-value'},
});
```

See [Define extraParams](../define-extra-params.md) for the targeting keys, and [`changeChannelUrl`](../../api/linear-channels-fast.md) for the full parameter reference.

## Pre-roll Ads

A `prerollAdTagUrl` schedules a break **before** the channel itself starts. When it is supplied, the pre-roll runs first — so wait for the `completed` event before playing the returned proxy URL, rather than playing it right away:

```tsx
const [sourceUri, setSourceUri] = useState(videoUrl);
const proxyUrlRef = useRef<string | null>(null);

useEffect(() => {
  const subscription = addAdEventListenerFor(nativeId, event => {
    if (event.event === 'completed' && proxyUrlRef.current) {
      // The pre-roll is over — now switch the content to the proxy url.
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
  // Held rather than applied — the pre-roll plays first.
  proxyUrlRef.current = proxyUrl;
}, [nativeId, videoUrl, adTagUrl, channelId, prerollAdTagUrl]);
```

## Stopping the Break

`stop(nativeId)` ends the ad break in progress. Playback of the channel itself continues from the proxy URL, and the session stays alive — a later break will still play.

```tsx
await stop(nativeId);
```

To leave the channel entirely, call `release(nativeId)` instead.

## Related

*   [`changeChannelUrl` API reference](../../api/linear-channels-fast.md)
*   [Ad Events](../../api/ad-event.md)
*   [Using the Bitmovin Player](../using-bitmovin-player.md)
