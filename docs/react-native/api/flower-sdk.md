---
sidebar_position: 1
---

# SDK Lifecycle

The functions on this page manage the SDK itself and the lifecycle of an ad session. Everything is imported from the package root:

```ts
import {
  initialize,
  play,
  notifyContentEnded,
  notifyPictureInPictureModeChanged,
  setIgnoreAdBreakInPIPMode,
  stop,
  release,
} from '@anypoint/flower-sdk-react-native';
```

Every session function takes a `nativeId` as its first argument — the `nativeID` prop of the `<Video>` the session belongs to.

## Methods

### initialize

```ts
function initialize(logLevel?: LogLevel): Promise<string>;
```

Initializes the SDK. Resolves with the version string of the native SDK running underneath.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| logLevel | [`LogLevel`](#loglevel) | (Optional) Log level. Defaults to `'Info'`. |

```tsx
const version = await initialize('Verbose');
```

### play

```ts
function play(nativeId: string): Promise<void>;
```

Plays a prepared ad break. VOD and inline breaks wait for this call; a linear break plays itself, scheduled by the cue in the stream.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The `nativeID` of the `<Video>` the session belongs to |

**Rejects** when no channel, VOD or inline request was started for `nativeId`.

### notifyContentEnded

```ts
function notifyContentEnded(nativeId: string): Promise<void>;
```

Tells the SDK the VOD content played to its end, so a post-roll can run. Wire it to the `<Video>` component's `onEnd` prop.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The `nativeID` of the `<Video>` the session belongs to |

**Rejects** when no channel, VOD or inline request was started for `nativeId`.

### notifyPictureInPictureModeChanged

```ts
function notifyPictureInPictureModeChanged(isInPictureInPictureMode: boolean): Promise<void>;
```

Tells the SDK the app went into (`true`) or came back from (`false`) PIP mode. App-wide, not per `nativeId`. With the default `setIgnoreAdBreakInPIPMode(true)`, an ad playing when the app enters PIP is paused and resumes when the app comes back — but only if the app reports both moments. See [PIP Mode Support](../getting-started/pip-mode-support.md).

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| isInPictureInPictureMode | boolean | `true` when entering PIP mode, `false` when exiting it |

### setIgnoreAdBreakInPIPMode

```ts
function setIgnoreAdBreakInPIPMode(ignore: boolean): Promise<void>;
```

Selects how ads are played. App-wide, not per `nativeId`. Call it before requesting ads. See [PIP Mode Support](../getting-started/pip-mode-support.md).

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| ignore | boolean | `true` (the default): ads play on the SDK's own ad player over the content, VOD mid-rolls and post-rolls are not requested in PIP, and an ad playing when PIP starts is paused until the app comes back.<br/>`false`: VOD breaks play on the app's own player (`react-native-video` on Android and iOS, Bitmovin on Android) and keep playing in PIP. Inline breaks, and VOD breaks with Bitmovin on iOS, still use the SDK's own ad player. Where the break plays on the app's player, the content comes back afterwards as a new player item, so anything the app watches per item has to match the content rather than the item it loaded. |

### stop

```ts
function stop(nativeId: string): Promise<void>;
```

Stops the ads manager of `nativeId`. This ends the current ad break and the ad session:

*   **Linear TV / FAST**: the local proxy is shut down, so the proxy URL stops serving and no later break plays. To keep playing the channel, call [`changeChannelUrl`](./linear-channels-fast.md#changechannelurl) again and play the new proxy URL.
*   **VOD**: the content keeps playing from its own URL, but no later break (mid-roll, post-roll) plays until a new [`requestVodAd`](./vod.md).
*   **Inline / Interstitial**: the break ends.

Unlike [`release`](#release), the ad overlay and the event subscription stay in place.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The `nativeID` of the `<Video>` the session belongs to |

Unknown `nativeId` values are ignored rather than rejected, so teardown paths can call this without tracking whether a session was ever started.

### release

```ts
function release(nativeId: string): Promise<void>;
```

Detaches the SDK from one `<Video>`. Call this when that video unmounts — the native side retains the ad overlay, so skipping this leaks it.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| nativeId | string | The `nativeID` of the `<Video>` the session belongs to |

`release()` removes the SDK's internal listener and stops any break in progress, so it is the only teardown call required. Subscriptions you created with `addAdEventListener()` or `addAdEventListenerFor()` are separate — remove those yourself.

## Types

### LogLevel

```ts
type LogLevel = 'Verbose' | 'Debug' | 'Info' | 'Warn' | 'Error' | 'Off';
```

See [Log Level Settings](../getting-started/log-level-settings.md).

### StringMap

```ts
type StringMap = {[key: string]: string};
```

Targeting information and HTTP headers are plain `{key: value}` objects. See [Define extraParams](../ad-insertion/define-extra-params.md).

### PlayerType

```ts
type PlayerType = 'react-native-video' | 'bitmovin';
```

Which player library owns the view behind a `nativeId`. `'react-native-video'` is the default and needs no extra package; `'bitmovin'` requires `bitmovin-player-react-native` in your app. See [Using the Bitmovin Player](../ad-insertion/using-bitmovin-player.md).

## Related APIs

*   [Linear Channels / FAST](./linear-channels-fast.md)
*   [VOD](./vod.md)
*   [Interstitial Ads](./interstitial-ads.md)
*   [Ad Events](./ad-event.md)
