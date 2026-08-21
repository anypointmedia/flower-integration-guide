---
sidebar_position: 5
---

# Bitmovin 플레이어 사용하기

`react-native-video`가 기본 플레이어이며, 이 페이지의 내용은 필요하지 않습니다. `changeChannelUrl()`, `requestVodAd()`, `requestAd()`에 `playerType: 'bitmovin'`을 전달하면 [`bitmovin-player-react-native`](https://github.com/bitmovin/bitmovin-player-react-native) 플레이어를 구동합니다.

Flower 패키지는 앱이 Bitmovin을 설치하지 않는 한 Bitmovin에 전혀 의존하지 않습니다. 따라서 Bitmovin을 사용하지 않는 앱의 빌드에는 라이선스 플레이어가 포함되지 않습니다.

## 하나의 id, 두 개의 대상

`react-native-video`에서는 하나의 `nativeID`가 하나의 대상 — 플레이어를 소유한 비디오 뷰 — 을 가리킵니다. 그러나 Bitmovin에서는 두 대상이 원래 서로 무관한 객체입니다:

*   React Native가 뷰에 부여하는 `nativeID` prop
*   `usePlayer({nativeId})`가 Bitmovin 자체 레지스트리에 등록하는 키

Flower 패키지는 앱이 **이 둘에 같은 문자열을 사용**하도록 요구합니다. 그래야 하나의 JS 인자로 SDK가 구동할 플레이어와 광고 오버레이가 마운트될 뷰를 모두 지정할 수 있습니다.

:::caution
서로 다른 문자열을 전달하면 플레이어가 없는 뷰가 조회되고, 호출은 그 사유를 담아 reject됩니다.
:::

### id는 `<PlayerView>`가 아니라 오버레이 `<View>`에 부여

SDK는 id를 가진 뷰에 광고 UI를 **네이티브** 자식으로 추가합니다. React가 관리하면서 자체 React 자식도 가진 뷰에 이렇게 하면, React의 인덱스 관리와 실제 자식 목록이 어긋나게 됩니다. 비어 있는 오버레이 뷰는 어긋날 관리 상태가 없고, 플레이어 위에 위치하므로 광고 오버레이가 있어야 할 자리이기도 합니다.

```tsx
import {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {PlayerView, SourceType, usePlayer} from 'bitmovin-player-react-native';
import {changeChannelUrl} from '@anypoint/flower-sdk-react-native';

const NATIVE_ID = 'ch1';

function BitmovinChannel({videoUrl, adTagUrl, channelId, licenseKey}) {
  // 여기의 nativeId는 아래 <View nativeID>와 반드시 같은 문자열이어야 합니다.
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
      {/* 광고 오버레이의 호스트. 의도적으로 <PlayerView>와 분리합니다. */}
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
Bitmovin에서는 플레이어가 뷰가 아니라 `usePlayer({nativeId})`에서 오므로, 해당 훅이 실행되는 즉시 플레이어가 존재합니다. 뷰 마운트를 기다리는 것은 *오버레이* 쪽입니다. 그 외의 흐름은 [react-native-video 경로](./how-the-integration-works.md)와 동일합니다.
:::

## Expo 모듈

`bitmovin-player-react-native`는 **Expo 모듈**이며, 이 사실이 두 플랫폼의 설정 전체를 좌우합니다. JS 측은 `global.expo`를 통해 네이티브에 접근하고, iOS Pod은 Expo의 autolinker를 통해서만 존재하며, Android 빌드는 `expo-crypto` / `expo-keep-awake`를 끌어옵니다. Expo에서 다른 것은 아무것도 쓰지 않는 순수 React Native 앱이라도, 아래 플랫폼별 설정이 동작하려면 먼저 Expo를 구성해야 합니다.

두 플랫폼이 공통으로 필요한 항목은 다음 두 가지입니다.

| 항목 | 이유 |
| ---| --- |
| `dependencies`의 `expo` | 이 패키지는 React Native가 아닌 Expo의 autolinker를 통해 링크됨 |
| Babel 프리셋으로 `babel-preset-expo` | 해당 모듈의 JS가 전제하는 `process.env.EXPO_OS`를 인라인 처리 |

:::caution
JS 공통 항목이나 iOS 항목 중 하나라도 빠지면 빌드는 그대로 성공합니다. 대신 런타임에 `usePlayer`가 `undefined`가 되어 렌더링 중 예외가 발생하고, 오류 화면이 아니라 흰 화면으로 나타납니다. Android Gradle 배선만은 빌드 타임에 명시적으로 실패합니다.
:::

나머지는 플랫폼별입니다 — Android는 Gradle autolinking, iOS는 Podfile과 앱 델리게이트.

## Android 설정

### 1. Bitmovin 저장소

저장소 하나를 앱에 선언합니다. Flower 저장소와 같은 이유입니다 — autolink된 Gradle 프로젝트는 외부 아티팩트를 **소비자(consumer)** 의 저장소로 해석합니다.

```gradle
allprojects {
    repositories {
        maven { url "https://artifacts.bitmovin.com/artifactory/public-releases" }
    }
}
```

### 2. Gradle의 Expo autolinking

`android/settings.gradle`에서 Expo의 Gradle 플러그인 빌드를 include하고 autolinker를 실행해야 합니다. 이것이 없으면 `:expo` 평가 단계에서 *"Plugin with id 'expo-module-gradle-plugin' not found"* 로 빌드가 실패합니다.

```gradle
pluginManagement {
    // React Native 자체의 includeBuild는 그대로 둡니다.

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

그리고 `android/build.gradle`에 대응하는 루트 플러그인을 적용합니다.

```gradle
apply plugin: "expo-root-project"
```

이것으로 끝입니다. Android에서는 Flower 측 어댑터가 관여하지 않습니다 — SDK 자체의 플레이어 어댑터 팩토리가 이미 `com.bitmovin.player.api.Player`를 인식합니다.

## iOS 설정

### 1. Podfile 플래그

`ios/Podfile`의 `target` 블록 **위**에 다음 줄을 추가합니다:

```ruby
$FlowerSdkUseBitmovin = true
```

이 플래그가 있어야 Flower podspec이 `RNBitmovinPlayer`에 의존하게 되고, 그 의존성이 있어야 패키지의 Bitmovin 소스가 컴파일됩니다. 플래그가 없으면 `playerType: 'bitmovin'`은 런타임에 그 사유를 담아 reject됩니다.

### 2. iOS의 Expo 모듈

플래그만으로는 부족합니다. 앱에 [Expo 모듈](#expo-모듈)이 구성되기 전까지는 플래그가 해석할 `RNBitmovinPlayer` Pod 자체가 존재하지 않기 때문입니다. 공통 항목 두 가지에 더해 iOS에는 다음 세 가지가 필요합니다.

| 항목 | 이유 |
| ---| --- |
| Podfile 타겟의 `use_expo_modules!` | 이 Pod은 React Native가 아닌 Expo의 autolinker를 통해서만 존재 |
| 앱 델리게이트의 `ExpoAppDelegate` + `ExpoReactNativeFactory` | `global.expo`를 설치하는 앱 컨텍스트를 시작 |
| 앱 **및** `flower-sdk-react-native` Pod의 deployment target을 Expo SDK 기준(SDK 57 기준 16.4) 이상으로 설정 | `expo-modules-autolinking`은 앱 버전이 낮은 모듈을 조용히 건너뛰며, Swift는 자신보다 높은 타겟으로 빌드된 모듈을 import하지 않음 |

Pod의 deployment target을 올리는 작업은 `post_install`에서 처리합니다. 다른 어떤 단계도 이 값을 올려주지 않기 때문입니다:

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

    # Swift는 자신보다 높은 타겟으로 빌드된 모듈을 import하지 않습니다.
    installer.pods_project.targets.each do |target|
      next unless target.name == 'flower-sdk-react-native'
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = EXPO_DEPLOYMENT_TARGET
      end
    end
  end
end
```

## 라이선스 키

두 플랫폼 모두 Bitmovin 라이선스 키가 필요하며, `usePlayer({licenseKey})` 또는 앱의 `Info.plist` / `AndroidManifest.xml`을 통해 전달합니다. Bitmovin은 라이선스를 번들 ID / 애플리케이션 ID에 바인딩하므로, 각 앱을 Bitmovin 대시보드에 등록해야 합니다.

## 알려진 제약

*   **iOS에서는 deferred ad start를 사용할 수 없습니다.** Android 어댑터는 로드된 DASH 광고 브레이크를 붙잡아 두었다가 표시 전에 위치를 조정하지만, 이에 해당하는 호출 쌍이 iOS `MediaPlayerAdapter` 프로토콜에는 아예 없습니다. 따라서 iOS의 Bitmovin DASH 브레이크는 AVPlayer 경로와 동일하게 다음 아이템을 그대로 재생하는 방식으로 폴백합니다. HLS는 영향을 받지 않습니다.
*   **Bitmovin은 플레이리스트 내 라이브 스트림을 미지원으로 문서화하고 있습니다.** 광고 스플라이싱이 사용하는 것이 바로 이 메커니즘입니다. Android E2E 앱은 같은 경로를 문제없이 통과하므로 실제 제약은 이 문장보다 좁지만, iOS에서는 아직 측정되지 않았습니다.

## 검증된 버전

핵심 결합 지점은 Flower 패키지가 플레이어를 꺼내오는 레지스트리, 즉 `PlayerRegistry.getPlayer`입니다.

| 구성 요소 | 버전 | 검증 내용 |
| ---| --- | --- |
| `bitmovin-player-react-native` | 1.25.0 | 레지스트리 API를 두 플랫폼 모두에서 이 릴리스 기준으로 검증 |
| `bitmovin-player-react-native` | 1.19.0 | 동일한 레지스트리 API를 선언 — 설치된 패키지를 확인한 수준이며 실행 검증은 아님 |

## 관련 문서

*   [연동 동작 방식](./how-the-integration-works.md)
*   [Linear TV 광고 구현](./linear-tv-fast/linear-tv-implementation.md)
