---
sidebar_position: 3
---

# Log Level Settings

You can set the log level as below to inspect the operation of the SDK. While we recommend using the default log level that is set by _setEnv,_ you can customize the log level if needed.

| **Log Level** | **Description** |
| ---| --- |
| `Verbose` | Produces all log entries. |
| `Debug` | Produces all log entries with the `Debug` level and above. |
| `Info` | Produces all log entries with the `Info` level and above. |
| `Warn` | Produces all log entries with the `Warn` level and above. |
| `Error` | Produces log entries only with the `Error` level. |
| `Off` | Does not produce any log entries. |

The log level will start to apply from the logs that are generated immediately after setting it. For example, to set the log level to _Verbose_, use the code below:

```javascript
FlowerSdk.setLogLevel("Verbose")
```
