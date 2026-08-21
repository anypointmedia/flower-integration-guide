---
sidebar_position: 2
---

# Initialization and Release

## Initializing the SDK

Call `initialize()` once during your app's startup, before any other SDK function. It resolves with the version of the **native** SDK that is running underneath — the Android SDK on Android, the iOS SDK on iOS — which is useful for logging and support requests.

```tsx
import {useEffect} from 'react';
import {initialize} from '@anypoint/flower-sdk-react-native';

export default function App() {
  useEffect(() => {
    initialize('Info')
      .then(version => console.log(`Flower SDK initialized: ${version}`))
      .catch(error => console.error(`Flower SDK init failed: ${error.message}`));
  }, []);

  // ...
}
```

The single argument is the log level, and it defaults to `'Info'`. See [Log Level Settings](./log-level-settings.md) for the available values.

:::note
Unlike the native SDKs, the React Native package does not expose an environment mode (`local` / `dev` / `prod`). The log level is set directly through `initialize()`.
:::

## Releasing a Session

Every SDK session is keyed by the `nativeID` of the `<Video>` element it belongs to. The native side retains an ad overlay for each one, so it has to be told when the video goes away.

Call `release(nativeId)` when the component that owns the video unmounts:

```tsx
import {useEffect} from 'react';
import {release} from '@anypoint/flower-sdk-react-native';

function ChannelPlayer({nativeId}: {nativeId: string}) {
  useEffect(
    () => () => {
      release(nativeId).catch(() => {});
    },
    [nativeId],
  );

  // ...
}
```

:::caution
Skipping `release()` leaks the ad overlay: it outlives the player it was mounted over, along with its ads manager and its local proxy.
:::

`release()` also removes the listener the SDK registered internally and stops any break in progress, so it is the only teardown call required. Event subscriptions you created yourself with `addAdEventListener()` or `addAdEventListenerFor()` are separate — remove those through the returned subscription:

```tsx
useEffect(() => {
  const subscription = addAdEventListenerFor(nativeId, handleAdEvent);
  return () => subscription.remove();
}, [nativeId]);
```

## Stop vs. Release

| Function | Effect | Unknown `nativeId` |
| ---| ---| --- |
| `stop(nativeId)` | Stops the current ad break. Playback of the content itself continues, and the session stays alive. | Ignored — safe to call unconditionally from teardown paths |
| `release(nativeId)` | Detaches the SDK from that `<Video>` entirely and tears the overlay down. | Ignored |

## Multiple Players on One Screen

All SDK state is keyed by `nativeID`, and every ad event carries the id it belongs to. Several `<Video>` elements can therefore each run their own channel, each with its own ad overlay, its own ads manager and its own local proxy — as long as every `nativeID` on screen is unique.

```tsx
{channels.map(channel => (
  <Video key={channel.nativeId} nativeID={channel.nativeId} ... />
))}
```
