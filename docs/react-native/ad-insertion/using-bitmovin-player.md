---
sidebar_position: 5
---

# Using the Bitmovin Player

`react-native-video` is the default player and needs nothing on this page. Passing `playerType: 'bitmovin'` to `changeChannelUrl()`, `requestVodAd()` or `requestAd()` drives a [`bitmovin-player-react-native`](https://github.com/bitmovin/bitmovin-player-react-native) player instead.

Nothing in the Flower package depends on Bitmovin unless your app installs it, so an app that never asks for it never pulls a licensed player into its build.

## One id, Two Things

With `react-native-video`, one `nativeID` addresses one thing — the video view, which owns the player. With Bitmovin those are two unrelated objects upstream:

*   the `nativeID` prop React Native puts on a view, and
*   the key `usePlayer({nativeId})` registers under in Bitmovin's own registry.

The Flower package asks your app to use **one string for both**. That is what lets a single JS argument reach the player the SDK drives and the view its ad overlay mounts on.

:::caution
Passing different strings resolves a view with no player behind it, and the call rejects saying so.
:::

### Give the id to an overlay `<View>`, not to `<PlayerView>`

The SDK adds its ad UI as a **native** child of the view carrying the id. Doing that to a React-managed view that also has React children of its own puts React's index bookkeeping out of step with the real child list. An empty overlay view has no bookkeeping to break, and it sits above the player, which is where an ad overlay belongs.

```tsx
import {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {PlayerView, SourceType, usePlayer} from 'bitmovin-player-react-native';
import {changeChannelUrl} from '@anypoint/flower-sdk-react-native';

const NATIVE_ID = 'ch1';

function BitmovinChannel({videoUrl, adTagUrl, channelId, licenseKey}) {
  // The nativeId here must be the SAME string as the <View nativeID> below.
  const player = usePlayer({nativeId: NATIVE_ID, licenseKey});

  const handOver = async () => {
    const proxyUrl = await changeChannelUrl(NATIVE_ID, {
      videoUrl,
      adTagUrl,
      channelId,
      playerType: 'bitmovin',
    });
    player.load({url: proxyUrl, type: SourceType.HLS});
  };

  useEffect(() => {
    player.load({url: videoUrl, type: SourceType.HLS});
  }, [player, videoUrl]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <PlayerView
        player={player}
        style={StyleSheet.absoluteFill}
        onReady={handOver}
      />
      {/* The ad overlay's host. Separate from <PlayerView> on purpose. */}
      <View
        nativeID={NATIVE_ID}
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
      />
    </View>
  );
}
```

:::note
With Bitmovin the player comes from `usePlayer({nativeId})` rather than from the view, so it exists as soon as that hook has run — mounting the view is what the *overlay* waits for. The rest of the flow is identical to the [react-native-video path](./how-the-integration-works.md).
:::

## Expo Modules

`bitmovin-player-react-native` is an **Expo module**, and that shapes the setup on both platforms: its JS reaches native through `global.expo`, its iOS pod exists only through Expo's autolinker, and its Android build pulls `expo-crypto` / `expo-keep-awake`. A bare React Native app — one that wants nothing else from Expo — still has to wire Expo up before any of the platform setup below works.

Two pieces are shared by both platforms:

| What | Why |
| ---| --- |
| `expo` in `dependencies` | The package is autolinked through Expo's autolinker, which React Native's own never sees |
| `babel-preset-expo` as the Babel preset | Inlines `process.env.EXPO_OS`, which the module's JS assumes |

:::caution
Miss any Expo piece on the JS side or on iOS and the app still builds. It fails at runtime instead, as `usePlayer` being `undefined` — a throw during render, which shows as a blank white screen rather than as an error. The Android Gradle wiring is the one part that fails loudly, at build time.
:::

The rest is per-platform: Gradle autolinking on Android, the Podfile and the app delegate on iOS.

## Android Setup

### 1. Bitmovin repository

One repository, declared in your app for the same reason as the Flower ones: an autolinked Gradle project resolves its external artifacts against the **consumer's** repositories.

```gradle
allprojects {
    repositories {
        maven { url "https://artifacts.bitmovin.com/artifactory/public-releases" }
    }
}
```

### 2. Expo autolinking in Gradle

`android/settings.gradle` has to include Expo's Gradle plugin build and run its autolinker. Without it the build fails while evaluating `:expo` with *"Plugin with id 'expo-module-gradle-plugin' not found"*.

```gradle
pluginManagement {
    // React Native's own includeBuild stays as it is.

    def expoPluginsPath = new File(
        providers.exec {
            workingDir(rootDir)
            commandLine("node", "--print", "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })")
        }.standardOutput.asText.get().trim(),
        "../android/expo-gradle-plugin"
    ).absolutePath
    includeBuild(expoPluginsPath)
}

plugins {
    id("com.facebook.react.settings")
    id("expo-autolinking-settings")
}

extensions.configure(com.facebook.react.ReactSettingsExtension) { ex ->
    ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand)
}
expoAutolinking.useExpoModules()
expoAutolinking.useExpoVersionCatalog()
```

And `android/build.gradle` applies the matching root plugin:

```gradle
apply plugin: "expo-root-project"
```

That is all. No Flower-side adapter is involved on Android — the SDK's own player adapter factory already recognises `com.bitmovin.player.api.Player`.

## iOS Setup

### 1. Podfile flag

Add this line **above** the `target` block in `ios/Podfile`:

```ruby
$FlowerSdkUseBitmovin = true
```

The flag makes the Flower podspec depend on `RNBitmovinPlayer`, and that dependency is what makes the package's Bitmovin sources compile at all. Without it, `playerType: 'bitmovin'` rejects at runtime with a message saying so.

### 2. Expo modules on iOS

The flag is not sufficient on its own: there is no `RNBitmovinPlayer` pod for it to resolve until your app has [Expo modules](#expo-modules) wired up. On top of the two shared pieces, iOS needs these three.

| What | Why |
| ---| --- |
| `use_expo_modules!` in the Podfile target | The pod exists only through Expo's autolinker, never React Native's |
| `ExpoAppDelegate` + `ExpoReactNativeFactory` in the app delegate | Starts the app context that installs `global.expo` |
| A deployment target ≥ the Expo SDK's (16.4 for SDK 57) on the app **and** on the `flower-sdk-react-native` pod | `expo-modules-autolinking` silently skips modules the app is too old for, and Swift will not import a module built for a newer target than the importer |

Raising the pod's deployment target is done in `post_install`, because nothing else raises it:

```ruby
EXPO_DEPLOYMENT_TARGET = '16.4'
platform :ios, EXPO_DEPLOYMENT_TARGET

$FlowerSdkUseBitmovin = true

target 'YourApp' do
  use_expo_modules!
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  post_install do |installer|
    react_native_post_install(installer, config[:reactNativePath])

    # Swift refuses to import a module built for a target newer than the importer's.
    installer.pods_project.targets.each do |target|
      next unless target.name == 'flower-sdk-react-native'
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = EXPO_DEPLOYMENT_TARGET
      end
    end
  end
end
```

## Licence Key

Both platforms need a Bitmovin licence key, supplied either through `usePlayer({licenseKey})` or in the app's `Info.plist` / `AndroidManifest.xml`. Bitmovin binds licences to a bundle id / application id, so each app has to be registered in the Bitmovin dashboard.

## Known Limitations

*   **Deferred ad start is unavailable on iOS.** The Android adapter holds a loaded DASH break so it can be positioned before it is shown; that pair of calls is not on the iOS `MediaPlayerAdapter` protocol at all, so an iOS Bitmovin DASH break falls back to playing the next item plainly, exactly as the AVPlayer path does. HLS is unaffected.
*   **Bitmovin documents live streams as unsupported in playlists**, which is the mechanism ad splicing uses. The Android E2E app exercises that path successfully, so the real limit is narrower than the sentence suggests — but it has not been measured on iOS.

## Verified Versions

The coupling that matters is `PlayerRegistry.getPlayer`, the registry the Flower package reads a player out of.

| Component | Version | What was verified |
| ---| --- | --- |
| `bitmovin-player-react-native` | 1.25.0 | The registry API, verified against this release on both platforms |
| `bitmovin-player-react-native` | 1.19.0 | Declares the same registry API — read from the installed package rather than exercised |

## Related

*   [How the Integration Works](./how-the-integration-works.md)
*   [Linear TV Ad Implementation](./linear-tv-fast/linear-tv-implementation.md)
