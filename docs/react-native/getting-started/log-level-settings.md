---
sidebar_position: 3
---

# Log Level Settings

The log level is passed to [`initialize()`](./initialization-and-release.md) and applies to the native SDK running underneath.

```tsx
import {initialize} from '@anypoint/flower-sdk-react-native';

await initialize('Verbose');
```

## Available Levels

The `LogLevel` type accepts the following values:

| **Log Level** | **Description** |
| ---| --- |
| `Verbose` | Produces all log entries. |
| `Debug` | Produces all log entries with the Debug level and above. |
| `Info` | Produces all log entries with the Info level and above. **Default.** |
| `Warn` | Produces all log entries with the Warn level and above. |
| `Error` | Produces log entries only with the Error level. |
| `Off` | Does not produce any log entries. |

```ts
export type LogLevel = 'Verbose' | 'Debug' | 'Info' | 'Warn' | 'Error' | 'Off';
```

The level applies from the logs generated immediately after `initialize()` resolves.

:::tip
Use `'Verbose'` while integrating so that ad requests, manifest manipulation and player adapter selection are all visible, then lower it to `'Info'` or `'Warn'` for production builds.
:::

## Where the Logs Appear

Native SDK logs are written by the platform's own logging facility, not by JavaScript, so they do **not** show up in the Metro console:

| Platform | Where to look |
| ---| --- |
| Android | `adb logcat` — native SDK logs are tagged by the SDK, JavaScript `console.log` lands under `ReactNativeJS` |
| iOS | Xcode console / `Console.app` |
