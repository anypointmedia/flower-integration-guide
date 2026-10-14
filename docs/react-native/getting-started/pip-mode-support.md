---
sidebar_position: 4
---

# PIP Mode Support

Ads are not played in PIP (Picture-in-Picture) mode by default, and the SDK does not detect PIP mode by itself. Two functions control this, both imported from the package root:

```ts
import {
  notifyPictureInPictureModeChanged,
  setIgnoreAdBreakInPIPMode,
} from '@anypoint/flower-sdk-react-native';
```

Both apply to the whole app, not to one `nativeId`.

## Methods

### notifyPictureInPictureModeChanged

```ts
function notifyPictureInPictureModeChanged(isInPictureInPictureMode: boolean): Promise<void>;
```

Tells the SDK the app went into (`true`) or came back from (`false`) PIP mode.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| isInPictureInPictureMode | boolean | `true` when entering PIP mode, `false` when exiting it |

### setIgnoreAdBreakInPIPMode

```ts
function setIgnoreAdBreakInPIPMode(ignore: boolean): Promise<void>;
```

Selects how ads are played. The default is `true`. Call it before requesting ads — the ad player is chosen when ads are requested.

| **Value** | **Ad player** | **Ads in PIP mode** |
| ---| ---| --- |
| `true` (default) | VOD and inline breaks play in the SDK's own ad player, in the overlay over your `<Video>`. | Not supported. An ad playing when the app enters PIP is paused, and mid-roll or post-roll breaks are not requested while in PIP. |
| `false` | VOD breaks play inside your `<Video>`'s own player (`react-native-video` on Android and iOS, Bitmovin on Android): the ads are put in front of the content, and the content comes back afterwards. Inline breaks, and VOD breaks with Bitmovin on iOS, still play in the SDK's own ad player. | Supported for VOD breaks on the app's player. Ads keep playing in PIP mode. |

:::caution
Report both moments, entering and exiting PIP, through `notifyPictureInPictureModeChanged`. The SDK does not detect PIP mode by itself. The only exception is `playerType: 'bitmovin'` on Android, where the SDK receives Bitmovin's own PIP events.
:::

## Ads in PIP Mode (Default)

Ads are not supported in PIP mode by default. Therefore, if an ad is playing, the app must notify the SDK of PIP mode changes through `notifyPictureInPictureModeChanged`. Only then is the ad paused when the app enters PIP, and resumed when the user returns to the app. In addition, while an ad is playing, the app must not switch the content player into PIP, even if the app goes into PIP mode, because PIP mode could otherwise be used to bypass the ad.

*   When the app calls `notifyPictureInPictureModeChanged(true)` while an ad is playing, the SDK pauses the ad and hides the ad UI. While the ad is paused, its progress does not advance and no quartile tracking events are sent.
*   When the app calls `notifyPictureInPictureModeChanged(false)`, the ad resumes from where it stopped and plays to completion.
*   While the app is in PIP mode, mid-roll and post-roll breaks are not requested.
*   Linear TV ads spliced into the stream are not affected by this option. They keep playing in PIP mode, and only the ad UI is hidden. A channel pre-roll (`prerollAdTagUrl`) is paused and resumed in the same way as VOD ads.

Which window goes into PIP is decided by the OS and the app, not by the SDK: on iOS, the player layer the PIP controller is attached to — the content player; on Android, the whole Activity. While an ad is playing, do not let the content `<Video>` enter PIP.

```tsx
import React, {useEffect, useState} from 'react';
import Video from 'react-native-video';
import {
  addAdEventListenerFor,
  notifyPictureInPictureModeChanged,
} from '@anypoint/flower-sdk-react-native';

export function VodPlayer({nativeId, contentUrl}: {nativeId: string; contentUrl: string}) {
  const [adPlaying, setAdPlaying] = useState(false);

  useEffect(() => {
    const subscription = addAdEventListenerFor(nativeId, event => {
      if (event.event === 'play') {
        setAdPlaying(true);
      } else if (event.event === 'completed' || event.event === 'error') {
        setAdPlaying(false);
      }
    });
    return () => subscription.remove();
  }, [nativeId]);

  return (
    <Video
      nativeID={nativeId}
      source={{uri: contentUrl}}
      // Keep the content out of PIP while an ad plays.
      enterPictureInPictureOnLeave={!adPlaying}
      // Report both entering and exiting PIP.
      onPictureInPictureStatusChanged={({isActive}) =>
        notifyPictureInPictureModeChanged(isActive).catch(() => {})
      }
    />
  );
}
```

If your app enters PIP by other means (for example its own native code on Android), call `notifyPictureInPictureModeChanged` from there in the same way.

## Supporting Ads in PIP Mode

Conversely, to support ads in PIP mode as well for more ad inventory (`setIgnoreAdBreakInPIPMode(false)`), the app needs to pay attention to how it handles player events.

```tsx
// Play ads in the app's player so that they keep playing in PIP mode.
await setIgnoreAdBreakInPIPMode(false);
```

A VOD break plays inside your player in this mode for:

*   `react-native-video` on Android and iOS
*   `playerType: 'bitmovin'` on Android

`playerType: 'bitmovin'` on iOS always uses the SDK's own ad player, and so do inline breaks (`requestAd()`) on every player — the app still pauses and resumes its content around an inline break.

The rule for the content is the same as in the default mode: hold it paused before its first start, until the first `completed` or `error`, and never pause, seek or re-source it after it has started. On an `error` after a failed mid-roll, do nothing to the content: the SDK has already dropped the failed ad and put the content back into the player at the resume point, and is playing it. Because the ad player and the content player adapter share the player in this mode, one ad failure can surface as two `error` events. Mark the content ended at the same point where you call `notifyContentEnded()` (see below), so a post-roll `error` does not resume it. See [VOD Ad Implementation](../ad-insertion/vod/vod-ad-implementation.md#handling-error).

### How Ads Are Played in Your Player

1. When a break starts, the SDK puts the ad items in front of the content in the native player behind your `<Video>`, and the player moves to the ads.
2. When the break ends, the SDK puts the content back as a **new player item** at the resume point (the interrupted position minus the rewind duration). With `react-native-video` on iOS it is a new `AVPlayerItem` built from the content URL; with `react-native-video` on Android the original media item is added again, clipped to start at the resume point; with Bitmovin on Android the original source is loaded again with a start offset at the resume point.

### Handling Player Events

Because the native player's current item changes around every break, any logic that detects item changes or the end of playback must react only to the content, not to whichever item is current.

*   `react-native-video` binds its observers to the item it loaded. On iOS its `onEnd` does not fire after a break in this mode, and on Android the ended state is also reported around breaks. Do not rely on `onEnd` alone to call `notifyContentEnded()`, and call it only once per content.
*   With `react-native-video` on Android, the position reported after a mid-roll (`onProgress`'s `currentTime`) counts from the resume point, not from the start of the content, because the content comes back clipped. Bitmovin on Android reloads the source at an offset instead, so this does not apply to it.
*   On iOS, settings applied to the item `react-native-video` built (for example `source.headers`, DRM, buffer and bitrate settings, selected audio and text tracks) are not carried over to the item the SDK puts back.

If your app cannot detect the end of the content without these item-bound events, or relies on item-level settings, use the default mode.

## Related

*   [VOD Ad Implementation](../ad-insertion/vod/vod-ad-implementation.md)
*   [SDK Lifecycle](../api/flower-sdk.md)
