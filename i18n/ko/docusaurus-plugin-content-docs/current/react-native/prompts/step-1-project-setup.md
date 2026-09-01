---
sidebar_position: 1
---

# Step 1: 프로젝트 설정 및 SDK 초기화

이 프롬프트는 LLM이 React Native 프로젝트에 Flower SDK 패키지를 설치하고, 필요한 네이티브 설정을 적용하며, SDK를 초기화하도록 안내합니다.

**사용 전:** `{{SDK_VERSION}}`과 `{{PLAYER_TYPE}}`을 실제 값으로 바꾸세요.

````plain
We are integrating the FLOWER SDK into our React Native project.

SDK_VERSION: {{SDK_VERSION}}
PLAYER_TYPE: {{PLAYER_TYPE}} (react-native-video | bitmovin)

========================================
STEP 1 — Registry configuration
========================================

The package is published to AnypointMedia's npm registry. Add this scope line to the
project's .npmrc (create the file at the project root if it does not exist).
Reads are anonymous, so no credential is needed:

  @anypoint:registry=https://maven.anypoint.tv/repository/npm-registry/

IMPORTANT: keep the "@anypoint:" scope prefix. Without it this becomes the DEFAULT
registry and every dependency, public ones included, starts resolving through Nexus.

========================================
STEP 2 — Install
========================================

  npm install @anypoint/flower-sdk-react-native@{{SDK_VERSION}} react-native-video

react, react-native and react-native-video are peer dependencies of the package.
react-native-video must be >= 6.0.0 (verified against 6.19.2).

Pin react-native-video in package.json. The package reads its internal player field to
obtain the underlying player instance, so the version is a hard coupling.

========================================
STEP 3 — Android configuration
========================================

3-1. android/build.gradle — buildscript.ext

  buildscript {
      ext {
          // MANDATORY. Left at the default of false, react-native-video compiles its own
          // stub classes into com.google.ads.interactivemedia.v3.api and those stubs shadow
          // the real IMA SDK, so the Flower SDK's ImaSdkFactory.createAdDisplayContainer()
          // fails at runtime with NoSuchMethodError. Only Google/IMA ads break, so it is
          // easy to miss.
          useExoplayerIMA = true

          // react-native-video and the Flower media3 adapter must compile against the SAME
          // androidx.media3 version.
          media3Version = "1.8.0"

          // Optional: pins the underlying Android SDK version.
          flowerSdkVersion = "2.9.23"
      }
  }

3-2. android/build.gradle — repositories

Gradle resolves an autolinked project's external artifacts using the CONSUMER's
repositories, so these must be declared in the app, not in the package:

  allprojects {
      repositories {
          maven { url "https://maven.anypoint.tv/repository/public-release" }
          // sdk-android-ott depends on com.github.fingerprintjs:fingerprint-android at
          // runtime, which is on JitPack and not on Maven Central.
          maven { url "https://jitpack.io" }
      }
  }

If PLAYER_TYPE is "bitmovin", also add:

          maven { url "https://artifacts.bitmovin.com/artifactory/public-releases" }

3-3. Expo autolinking in Gradle — PLAYER_TYPE "bitmovin" only

bitmovin-player-react-native is an Expo module and its Android build pulls expo-crypto /
expo-keep-awake, so Expo's Gradle plugins have to be wired up. Without them the build
fails while evaluating :expo with "Plugin with id 'expo-module-gradle-plugin' not found":

  // android/settings.gradle — React Native's own includeBuild stays as it is
  pluginManagement {
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

  // android/build.gradle
  apply plugin: "expo-root-project"

3-4. android/app/build.gradle — core library desugaring

flower-sdk:sdk-android-ott's AAR metadata requires it. Without this the build fails at
checkDebugAarMetadata:

  android {
      compileOptions {
          coreLibraryDesugaringEnabled true
      }
  }

  dependencies {
      coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
  }

3-5. android/app/src/main/res/xml/network_security_config.xml

Android 9 (API 28) and above block cleartext traffic by default:

  <?xml version="1.0" encoding="utf-8"?>
  <network-security-config>
      <domain-config cleartextTrafficPermitted="true">
          <domain includeSubdomains="true">
              prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com
          </domain>
      </domain-config>
  </network-security-config>

Reference it from AndroidManifest.xml:

  <application
      android:networkSecurityConfig="@xml/network_security_config"
      android:usesCleartextTraffic="false"
      ... >

========================================
STEP 4 — iOS configuration
========================================

4-1. pod install

  cd ios && pod install

Autolinking picks up the podspec, which depends on the FlowerSdk pod. Nothing else is
needed for PLAYER_TYPE "react-native-video".

4-2. ios/<YourApp>/Info.plist — App Transport Security

The SDK's local proxy is http://127.0.0.1:<port>, which ATS blocks by default with
NSURLErrorDomain -1022.

If every stream is HTTPS, NSAllowsLocalNetworking is enough:

  <key>NSAppTransportSecurity</key>
  <dict>
      <key>NSAllowsLocalNetworking</key>
      <true/>
  </dict>

If any stream is plain HTTP, use NSAllowsArbitraryLoads INSTEAD — and it must stand ALONE.
iOS 10+ silently ignores it whenever a more specific ATS key sits alongside it:

  <key>NSAppTransportSecurity</key>
  <dict>
      <key>NSAllowsArbitraryLoads</key>
      <true/>
  </dict>

4-3. If PLAYER_TYPE is "bitmovin"

Add ABOVE the target block in ios/Podfile:

  $FlowerSdkUseBitmovin = true

bitmovin-player-react-native is an Expo module, so the app needs Expo wired up. Two
pieces are shared by both platforms:
  - "expo" in dependencies
  - "babel-preset-expo" as the Babel preset
Android's half is 3-3 above. iOS needs three more:
  - use_expo_modules! in the Podfile target
  - ExpoAppDelegate + ExpoReactNativeFactory in the app delegate
  - deployment target >= the Expo SDK's (16.4 for SDK 57) on the app AND on the
    flower-sdk-react-native pod, raised in post_install

Missing any of the shared or iOS pieces still builds; it fails at runtime as usePlayer
being undefined, which shows as a blank white screen. The Android Gradle wiring is the
one part that fails loudly, at build time.

========================================
STEP 5 — Initialize the SDK
========================================

Call initialize() once at app startup, before any other SDK function. It resolves with
the version of the native SDK running underneath.

  import {useEffect} from 'react';
  import {initialize} from '@anypoint/flower-sdk-react-native';

  export default function App() {
    useEffect(() => {
      initialize('Info')
        .then(version => console.log(`Flower SDK initialized: ${version}`))
        .catch(error => console.error(`init failed: ${error.message}`));
    }, []);

    // ...
  }

Log levels: 'Verbose' | 'Debug' | 'Info' | 'Warn' | 'Error' | 'Off'. Default 'Info'.
Use 'Verbose' during integration.

========================================
CONSTRAINTS
========================================

- The React Native package does NOT expose an environment mode (local/dev/prod). There
  is no setEnv(). The log level is passed to initialize() directly.
- Native SDK logs do NOT appear in the Metro console. Use adb logcat on Android and the
  Xcode console on iOS.
- Do not add the Flower SDK as a Gradle or SPM dependency by hand. The npm package
  resolves both platform SDKs itself.
- Verified against React Native 0.86.2. Android minSdk 24 / compileSdk 35+ / Java 17,
  iOS >= 15.0, Node >= 22.11.0.
````
