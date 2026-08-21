---
sidebar_position: 3
---

# 로그 레벨 설정

로그 레벨은 [`initialize()`](./initialization-and-release.md)에 전달하며, 내부에서 동작하는 네이티브 SDK에 적용됩니다.

```tsx
import {initialize} from '@anypoint/flower-sdk-react-native';

await initialize('Verbose');
```

## 사용 가능한 레벨

`LogLevel` 타입은 다음 값을 허용합니다:

| **로그 레벨** | **설명** |
| ---| --- |
| `Verbose` | 모든 로그를 출력합니다. |
| `Debug` | Debug 레벨 이상의 로그를 출력합니다. |
| `Info` | Info 레벨 이상의 로그를 출력합니다. **기본값입니다.** |
| `Warn` | Warn 레벨 이상의 로그를 출력합니다. |
| `Error` | Error 레벨의 로그만 출력합니다. |
| `Off` | 로그를 출력하지 않습니다. |

```ts
export type LogLevel = 'Verbose' | 'Debug' | 'Info' | 'Warn' | 'Error' | 'Off';
```

설정한 로그 레벨은 `initialize()`가 완료된 직후 생성되는 로그부터 적용됩니다.

:::tip
연동 중에는 `'Verbose'`를 사용하면 광고 요청, 매니페스트 조작, 플레이어 어댑터 선택 과정을 모두 확인할 수 있습니다. 운영 빌드에서는 `'Info'` 또는 `'Warn'`으로 낮추세요.
:::

## 로그 확인 위치

네이티브 SDK 로그는 JavaScript가 아니라 각 플랫폼의 로깅 기능으로 기록되므로 Metro 콘솔에는 **표시되지 않습니다**:

| 플랫폼 | 확인 위치 |
| ---| --- |
| Android | `adb logcat` — 네이티브 SDK 로그는 SDK 자체 태그로 기록되며, JavaScript `console.log`는 `ReactNativeJS` 태그로 출력됩니다 |
| iOS | Xcode 콘솔 / `Console.app` |
