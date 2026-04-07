---
sidebar_position: 1
---

# Step 1: Project Setup & SDK Initialization

This prompt guides LLM to set up Flower SDK dependency and initialization in an iOS project.

```plain
We are integrating the FLOWER SDK into our iOS project.

========================================
STEP 1 — Add FLOWER SDK Dependency (Swift Package Manager)
========================================

1. In Xcode, go to File > Add Package Dependencies…
2. Enter the repository URL:
   https://github.com/anypointmedia/flower-sdk-ios
3. Select FlowerSdk and add it to your iOS app target.
4. Verify the SDK appears in your project's General settings tab under Frameworks.

========================================
STEP 2 — Initialize and Release SDK
========================================

Environment modes:
- "local": Local environment, default log level Verbose
- "dev": Development environment, error logs saved to server, default log level Info
- "prod": Production environment, error logs saved to server, default log level Warn

--------------------------------------------------
SwiftUI (recommended to use UIApplicationDelegateAdaptor):

import UIKit
import SwiftUI
import FlowerSdk

class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FlowerSdk.setEnv(env: "local")  // Change to "dev" or "prod" as appropriate
        FlowerSdk.doInit()
        return true
    }

}

@main
struct YourApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

--------------------------------------------------
UIKit:

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

========================================
STEP 3 — Info.plist Configuration
========================================

Add the following to Info.plist:

1. Allow HTTP traffic (required for ad/stream requests):
   NSAppTransportSecurity > NSAllowsArbitraryLoads = YES

2. For Linear TV with background playback:
   UIBackgroundModes > audio

========================================
CONSTRAINTS
========================================

- iOS SDK uses FlowerSdk.doInit() (not FlowerSdk.init()).
- iOS SDK does NOT require an explicit destroy/release call.
- import FlowerSdk is required in all files using the SDK.
```
