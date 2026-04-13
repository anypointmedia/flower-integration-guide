---
sidebar_position: 2
---

# Initialization and Release

Before using any features of the SDK, you must initialize it in your OTT app's startup process. Set the operating environment mode to either _local_, _dev_, or _prod_ as described below.
*   **_local_:** This mode can be used in a local environment and the default log level is _Verbose_.
*   **_dev_:** This mode can be used in a development environment and in this mode, the error log that is generated in the SDK is saved in the server. The default log level is _Info_.
*   **_prod_:** This mode can be used in a commercial environment and in this mode, the error log that is generated in the SDK is saved in the server. The default log level is _Warn_.

When using SwiftUI, we recommend initializing the SDK using AppDelegate via `UIApplicationDelegateAdaptor`.

:::note
The iOS SDK does not require an explicit release/destroy call. Resources are managed internally.
:::

**_SwiftUI_**

```swift
import UIKit
import SwiftUI
import FlowerSdk

class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FlowerSdk.setEnv(env: "local")
        FlowerSdk.doInit()
        return true
    }
}

@main
struct YourApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        ...
    }
}
```

**_UIKit_**

```swift
import UIKit
import FlowerSdk

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FlowerSdk.setEnv(env: "local")
        FlowerSdk.doInit()
        return true
    }
}
```
