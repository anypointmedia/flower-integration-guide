---
sidebar_position: 3
sidebar_label: "로그 레벨 설정"
---

# 로그 레벨 설정

SDK의 작동을 확인하기 위해 로그 레벨을 아래와 같이 설정할 수 있습니다. 기본적으로 _setEnv_를 통해 설정되는 기본 로그 레벨을 사용하고 필요한 경우에만 로그 레벨을 설정하길 권장합니다.

| **로그 레벨** | **설명** |
| ---| --- |
| Verbose | SDK의 모든 로그를 출력합니다. |
| Debug | SDK 내에서 Debug 레벨 이상의 모든 로그를 출력합니다. |
| Info | SDK 내에서 Info 레벨 이상의 모든 로그를 출력합니다. |
| Warn | SDK 내에서 Warn 레벨 이상의 모든 로그를 출력합니다. |
| Error | SDK 내에서 Error 레벨만 출력합니다. |
| Off | SDK의 모든 로그를 출력하지 않습니다. |

로그 레벨은 설정 직후에 발생한 로그부터 즉시 적용됩니다. 예를 들어 로그 레벨을 *Verbose*로 설정하려면 아래 코드를 사용합니다.

```swift
FlowerSdk.setLogLevel("Verbose")
```
