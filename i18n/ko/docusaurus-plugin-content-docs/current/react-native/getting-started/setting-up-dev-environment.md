---
sidebar_position: 1
---

# 개발 환경 설정

:::tip LLM 프롬프트 제공
LLM을 활용한 SDK 연동은 [React Native 프롬프트 섹션](../prompts/how-to-use-prompts.md)을 참고하세요. 단계별 프롬프트와 통합 프롬프트를 제공합니다.
:::

React Native 패키지는 JavaScript API와 Android/iOS 네이티브 소스를 함께 담은 하나의 npm 패키지입니다. 플랫폼 SDK 자체는 일반 의존성으로 해석됩니다 — Android는 Gradle을 통해 `flower-sdk:sdk-android-ott`를, iOS는 CocoaPods를 통해 `FlowerSdk` Pod을 가져옵니다. 따라서 SDK를 별도로 내려받을 필요가 없습니다.

## 요구 사항

| 항목 | 요구 사항 |
| ---| --- |
| React Native | **0.86.2**로 검증. Legacy 및 New Architecture를 모두 지원합니다. |
| `react-native-video` | 6.0.0 이상 (**6.19.2**로 검증) |
| Android | minSdk 24, compileSdk 35 이상, Java 17 |
| iOS | 15.0 이상 |
| Node.js | 22.11.0 이상 |

`react`, `react-native`, `react-native-video`는 peer dependency로 선언되어 있으므로 앱에서 직접 설치해야 합니다.

:::caution
SDK는 내부 플레이어 인스턴스를 얻기 위해 `react-native-video`의 내부 필드에 접근합니다. 따라서 버전이 강하게 결합되어 있습니다. 앱에서 `react-native-video` 버전을 고정하고, 업그레이드할 때마다 재검증하세요.
:::

## 레지스트리 설정

패키지는 AnypointMedia의 npm 레지스트리에 배포됩니다. 프로젝트의 `.npmrc`에 아래 스코프 설정을 추가하세요. 읽기는 익명으로 가능하므로 인증 정보는 필요하지 않습니다.

```ini
@anypoint:registry=https://maven.anypoint.tv/repository/npm-registry/
```

:::caution
`@anypoint:` 스코프 접두사를 반드시 유지하세요. 접두사가 없으면 이 설정이 *기본* 레지스트리가 되어, 공개 패키지를 포함한 모든 의존성이 Nexus를 통해 해석됩니다.
:::

## 패키지 설치

```bash
npm install @anypoint/flower-sdk-react-native react-native-video
```

특정 버전을 고정하려면:

```bash
npm install @anypoint/flower-sdk-react-native@1.0.1
```

## Android 설정

### 1. 저장소

Gradle은 autolink된 프로젝트의 외부 아티팩트를 **소비자(consumer)** 의 저장소로 해석합니다. 따라서 패키지가 아니라 앱에 선언해야 합니다. `android/build.gradle`에 추가하세요:

```gradle
allprojects {
    repositories {
        // Flower SDK 릴리스 저장소
        maven { url "https://maven.anypoint.tv/repository/public-release" }
        // sdk-android-ott는 런타임에 com.github.fingerprintjs:fingerprint-android에 의존하며,
        // 이 라이브러리는 JitPack에만 있고 Maven Central에는 없습니다.
        maven { url "https://jitpack.io" }
    }
}
```

### 2. `useExoplayerIMA`

이 플래그는 **필수**입니다. `android/build.gradle`의 `buildscript.ext` 블록에 추가하세요:

```gradle
buildscript {
    ext {
        useExoplayerIMA = true
    }
}
```

:::caution
기본값인 `false` 상태로 두면 `react-native-video`가 실제 IMA 패키지(`com/google/ads/interactivemedia/v3/api/`)에 자체 stub 클래스를 컴파일해 넣습니다. 이 stub이 실제 IMA SDK보다 낮은 번호의 dex에 들어가 실제 SDK를 가려버리고, 그 결과 `ImaSdkFactory.createAdDisplayContainer()`가 런타임에 `NoSuchMethodError`로 실패합니다. Google/IMA 광고만 깨지고 매니페스트 조작은 정상 동작하므로 놓치기 쉽습니다.
:::

### 3. Core Library Desugaring

`flower-sdk:sdk-android-ott`는 desugaring이 활성화된 상태로 빌드되며, AAR 메타데이터가 호스트 앱에도 동일한 설정을 요구합니다. 설정하지 않으면 `checkDebugAarMetadata`에서 빌드가 실패합니다. `android/app/build.gradle`에 추가하세요:

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

### 4. Media3 버전 정렬

Flower media3 어댑터는 `react-native-video`가 사용하는 것과 **동일한** `androidx.media3` 버전으로 컴파일되어야 합니다. 그렇지 않으면 어댑터가 생성한 `Player` override가 맞지 않습니다. `android/build.gradle`에 한 번만 선언하세요:

```gradle
buildscript {
    ext {
        // react-native-video와 Flower media3 어댑터가 같은 버전을 사용해야 합니다.
        media3Version = "1.8.0"
        // (선택) 내부적으로 사용할 Android SDK 버전을 고정합니다.
        flowerSdkVersion = "2.9.22"
    }
}
```

:::info
사용 중인 media3 버전에 대응하는 어댑터 아티팩트가 배포되어 있지 않은 경우, [dev-support@anypointmedia.com](mailto:dev-support@anypointmedia.com)으로 문의해 주세요.
:::

### 5. Cleartext 트래픽 예외 설정

SDK는 특정 도메인과 HTTP로 통신하며, Android 9(API level 28) 이상에서는 cleartext 트래픽이 기본적으로 차단됩니다. `android/app/src/main/res/xml/network_security_config.xml`을 생성하세요:

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

그리고 `AndroidManifest.xml`에서 참조합니다:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="false"
    ... >
```

두 가지 설정 방식에 대한 자세한 설명은 [Android 가이드](../../android/getting-started/setting-up-dev-environment.mdx)를 참고하세요.

## iOS 설정

### 1. CocoaPods

Autolinking이 podspec을 인식하며, podspec은 `FlowerSdk` Pod에 의존합니다. 이외에 필요한 작업은 없습니다:

```bash
cd ios && pod install
```

:::note
iOS SDK는 SPM과 CocoaPods 양쪽에 배포되지만, React Native는 의도적으로 CocoaPods 경로를 사용합니다. 패키지의 Swift 소스가 React를 import하므로 Pod 타겟 안에서 컴파일되어야 하는데, Xcode는 *앱* 타겟에 추가된 Swift Package를 Pod 타겟의 import 경로에 넣어주지 않기 때문입니다.
:::

### 2. App Transport Security

SDK의 로컬 프록시는 `http://127.0.0.1:<port>`로 제공되며, ATS는 기본적으로 이를 `NSURLErrorDomain -1022`로 차단합니다. `ios/<YourApp>/Info.plist`에 적절한 키를 추가하세요.

**모든 스트림이 HTTPS인 경우**에는 `NSAllowsLocalNetworking`만으로 충분합니다. 로컬 프록시를 포함합니다:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

**스트림 중 하나라도 평문 HTTP인 경우**에는 대신 `NSAllowsArbitraryLoads`를 사용합니다:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

:::caution
`NSAllowsArbitraryLoads`는 **단독으로** 선언해야 합니다. iOS 10 이상에서는 더 구체적인 ATS 키(`NSAllowsLocalNetworking`, `NSAllowsArbitraryLoadsInMedia` 등)가 함께 있으면 이 키를 조용히 무시합니다. 설정은 허용적으로 보이지만 실제로는 키가 없는 것처럼 동작하며, 이때 발생하는 오류는 ATS를 언급할 뿐 원인을 알려주지 않습니다.
:::

## Bitmovin 플레이어

`react-native-video`가 기본값이며, 위 설정에서 변경할 부분이 없습니다. Bitmovin 플레이어를 사용하려면 [Bitmovin 플레이어 사용하기](../ad-insertion/using-bitmovin-player.md)를 참고하세요.
