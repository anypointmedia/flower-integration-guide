---
sidebar_position: 5
---

# Adding the Google PAL SDK

The Google **PAL (Programmatic Access Library) SDK** generates a nonce (a single-use, encrypted string) that is required for programmatic ad access on Linear TV / FAST channels. When you use the PAL SDK together with the Flower SDK, the generated nonce is passed to the ad request so that Google can verify the playback environment.

This guide describes how to add the Google PAL SDK as a library to your iOS project.

:::note
The PAL SDK is only required when your integration serves programmatic ads that mandate a PAL nonce. If your service does not use PAL, you can skip this guide.
:::

## Requirements

| Item | Requirement |
| --- | --- |
| Xcode | 13 or higher |
| Framework | `ProgrammaticAccessLibrary` |
| Distribution | Swift Package Manager (recommended) or manual `.xcframework` |

## Option 1. Swift Package Manager (Recommended)

The PAL SDK supports Swift Package Manager since version 2.5.3, and this is the recommended way to add the library.

1. **Add the Package Dependency:** In Xcode, go to **File** > **Add Package Dependencies…** and enter the PAL SDK repository URL.

   ```
   https://github.com/googleads/swift-package-manager-google-programmatic-access-library-ios
   ```

2. **Choose a version rule:** Select **Up to Next Major Version** so that you automatically receive compatible updates.

3. **Add the library to your target:** Select the `ProgrammaticAccessLibrary` package product and add it to your iOS app target.

4. **Verify the dependency:** Confirm that the package appears under **Package Dependencies** in your project navigator and is listed in your target's **General** > **Frameworks, Libraries, and Embedded Content**.

## Option 2. Manual Installation

If you cannot use Swift Package Manager, you can integrate the framework manually.

1. Download the latest PAL SDK for iOS from the [PAL SDK download page](https://developers.google.com/ad-manager/pal/ios/download).
2. Drag the `ProgrammaticAccessLibrary.xcframework` into your Xcode project.
3. In your target's **General** > **Frameworks, Libraries, and Embedded Content**, set the framework to **Embed & Sign**.

## Verifying the Integration

After adding the library, import it in a Swift source file to confirm the framework resolves correctly.

```swift
import ProgrammaticAccessLibrary
```

The following minimal example shows how to create a nonce loader and request a nonce. Refer to the [official PAL SDK guide](https://developers.google.com/ad-manager/pal/ios/get-started) for the full API.

```swift
import ProgrammaticAccessLibrary

class VideoViewController: UIViewController, PALNonceLoaderDelegate {
    private var nonceLoader: PALNonceLoader!
    private var nonceManager: PALNonceManager?

    override func viewDidLoad() {
        super.viewDidLoad()

        let settings = PALSettings()
        settings.directedForChildOrUnknownAge = false

        nonceLoader = PALNonceLoader(settings: settings)
        nonceLoader.delegate = self
    }

    func requestNonce() {
        let request = PALNonceRequest()
        request.continuousPlayback = .off
        request.willAdAutoPlay = .on
        nonceLoader.loadNonceManager(with: request)
    }

    // MARK: - PALNonceLoaderDelegate

    func nonceLoader(_ nonceLoader: PALNonceLoader,
                     with request: PALNonceRequest,
                     didLoad nonceManager: PALNonceManager) {
        self.nonceManager = nonceManager
        // Pass nonceManager.nonce to your ad request.
        print("PAL nonce: \(nonceManager.nonce)")
    }

    func nonceLoader(_ nonceLoader: PALNonceLoader,
                     with request: PALNonceRequest,
                     didFailWith error: Error) {
        print("PAL nonce load failed: \(error.localizedDescription)")
    }
}
```

:::tip
When integrating with the Flower SDK, provide the player type and player version to the SDK (see `getPlayerType()` / `getPlayerVersion()`) so that the values reported to Google match your PAL nonce configuration.
:::
