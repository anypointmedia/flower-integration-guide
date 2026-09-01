---
sidebar_position: 1
---

# Setting up Development Environment

:::tip LLM Prompts Available
For LLM-assisted SDK integration, see the [React Native Prompts section](../prompts/how-to-use-prompts.md). Step-by-step and integrated prompts are available.
:::

The React Native package is a single npm package that carries the JavaScript API together with the Android and iOS native sources. The platform SDKs themselves are resolved as ordinary dependencies — `flower-sdk:sdk-android-ott` through Gradle on Android, and the `FlowerSdk` pod through CocoaPods on iOS — so no separate SDK download is required.

## Requirements

| Item | Requirement |
| ---| --- |
| React Native | Verified against **0.86.2**. Both the legacy and the new architecture are supported. |
| `react-native-video` | 6.0.0 and above (verified against **6.19.2**) |
| Android | minSdk 24, compileSdk 35 and above, Java 17 |
| iOS | 15.0 and above |
| Node.js | 22.11.0 and above |

`react`, `react-native` and `react-native-video` are declared as peer dependencies, so your app must install them itself.

:::caution
`react-native-video` is accessed through internal fields to obtain the underlying player instance, so the version is a hard coupling. Pin `react-native-video` in your app and re-verify after upgrading it.
:::

## Registry Configuration

The package is published to AnypointMedia's npm registry. Add the scope line below to your project's `.npmrc`. Reads are anonymous, so no credential is needed.

```ini
@anypoint:registry=https://maven.anypoint.tv/repository/npm-registry/
```

:::caution
Note the `@anypoint:` scope prefix. Without it this becomes the *default* registry and every dependency — public ones included — starts resolving through Nexus.
:::

## Installing the Package

```bash
npm install @anypoint/flower-sdk-react-native react-native-video
```

To pin a specific version:

```bash
npm install @anypoint/flower-sdk-react-native@1.0.2
```

## Android Configuration

### 1. Repositories

Gradle resolves an autolinked project's external artifacts using the **consumer's** repositories, so these must be declared in your app, not in the package. Add them to `android/build.gradle`:

```gradle
allprojects {
    repositories {
        // Flower SDK release repository.
        maven { url "https://maven.anypoint.tv/repository/public-release" }
        // sdk-android-ott depends on com.github.fingerprintjs:fingerprint-android at runtime,
        // which is published to JitPack and is absent from Maven Central.
        maven { url "https://jitpack.io" }
    }
}
```

### 2. `useExoplayerIMA`

This flag is **mandatory**. Add it to the `buildscript.ext` block of `android/build.gradle`:

```gradle
buildscript {
    ext {
        useExoplayerIMA = true
    }
}
```

:::caution
Left at its default of `false`, `react-native-video` compiles its own stub classes into the real IMA package (`com/google/ads/interactivemedia/v3/api/`). Those stubs land in a lower-numbered dex than the real IMA SDK and shadow it, so `ImaSdkFactory.createAdDisplayContainer()` fails at runtime with `NoSuchMethodError`. Only Google/IMA ads break — manifest splicing keeps working — which makes it easy to miss.
:::

### 3. Core Library Desugaring

`flower-sdk:sdk-android-ott` is built with desugaring enabled, and its AAR metadata requires the host app to opt in too. Without it the build fails at `checkDebugAarMetadata`. Add to `android/app/build.gradle`:

```gradle
android {
    compileOptions {
        coreLibraryDesugaringEnabled true
    }
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
}
```

### 4. Media3 Version Alignment

The Flower media3 adapter must be compiled against the **same** `androidx.media3` version that `react-native-video` uses, otherwise the adapter's generated `Player` overrides will not line up. Declare it once in `android/build.gradle`:

```gradle
buildscript {
    ext {
        // react-native-video and the Flower media3 adapter must agree on this.
        media3Version = "1.8.0"
        // Optional: pins the underlying Android SDK version.
        flowerSdkVersion = "2.9.23"
    }
}
```

:::info
If your app needs a media3 version for which no matching adapter artifact is published, please contact us at [dev-support@anypointmedia.com](mailto:dev-support@anypointmedia.com).
:::

### 5. Cleartext Traffic Exception

The SDK communicates with a specific domain over HTTP, and Android 9 (API level 28) and above block cleartext traffic by default. Create `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">
            prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com
        </domain>
    </domain-config>
</network-security-config>
```

Then reference it from `AndroidManifest.xml`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="false"
    ... >
```

For the full explanation of both configuration methods, see the [Android guide](../../android/getting-started/setting-up-dev-environment.mdx).

## iOS Configuration

### 1. CocoaPods

Autolinking picks up the podspec, which depends on the `FlowerSdk` pod. Nothing else is required:

```bash
cd ios && pod install
```

:::note
The iOS SDK is published to both SPM and CocoaPods, but React Native takes the CocoaPods path deliberately: the package's Swift sources import React, so they compile inside a pod target, and Xcode does not put a Swift Package added to the *app* target on a pod target's import path.
:::

### 2. App Transport Security

The SDK's local proxy is served from `http://127.0.0.1:<port>`, which ATS blocks by default with `NSURLErrorDomain -1022`. Add the appropriate key to `ios/<YourApp>/Info.plist`.

**If every stream is served over HTTPS**, `NSAllowsLocalNetworking` is enough — it covers the local proxy:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

**If any stream is served over plain HTTP**, use `NSAllowsArbitraryLoads` instead:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

:::caution
`NSAllowsArbitraryLoads` has to stand **alone**. iOS 10 and above silently ignore it whenever a more specific ATS key (`NSAllowsLocalNetworking`, `NSAllowsArbitraryLoadsInMedia`, …) sits alongside it — the configuration looks permissive and behaves as if the key were absent, and the resulting error names ATS but not the reason.
:::

## Bitmovin Player

`react-native-video` is the default and needs none of the above changed. To drive a Bitmovin player instead, see [Using the Bitmovin Player](../ad-insertion/using-bitmovin-player.md).
