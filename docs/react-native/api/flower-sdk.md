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

### stop

```ts
function stop(nativeId: string): Promise<void>;
```

Stops the current ad break. Playback of the content itself continues and the session stays alive.

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
