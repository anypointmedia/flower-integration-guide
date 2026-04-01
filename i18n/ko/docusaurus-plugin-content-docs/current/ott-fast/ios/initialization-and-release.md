---
sidebar_position: 2
sidebar_label: "초기화 및 해제"
---

# 초기화 및 해제

SDK의 기능을 사용하기 전에 OTT 앱의 시작 프로세스에서 SDK를 초기화해야 합니다. 동작 환경 모드를 아래와 같이 _local_, _dev_, _prod_ 중 하나로 설정합니다.
*   **_local_:** 로컬 환경에서 개발할 때 사용 가능하며 기본 로그 레벨이 *Verbose*로 설정됩니다.
*   **_dev_:** 개발 환경에서 사용 가능하고 SDK에서 발생하는 에러 로그가 서버로 수집됩니다. 기본 로그 레벨은 *Info*로 설정됩니다.
*   **_prod_:** 상용 환경에서 사용 가능하고 SDK에서 발생하는 에러 로그가 서버로 수집됩니다. 기본 로그 레벨은 *Warn*으로 설정됩니다.

SwiftUI를 사용할 경우 `UIApplicationDelegateAdaptor`를 이용하여 AppDelegate에서 SDK를 초기화하길 권장합니다.

:::note
iOS SDK는 명시적인 해제/destroy 호출이 필요하지 않습니다. 리소스는 내부적으로 관리됩니다.
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
