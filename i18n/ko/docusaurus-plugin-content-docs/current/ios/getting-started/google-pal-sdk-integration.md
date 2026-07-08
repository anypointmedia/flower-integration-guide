---
sidebar_position: 5
sidebar_label: "Google PAL SDK 추가"
---

# Google PAL SDK 추가

Google **PAL(Programmatic Access Library) SDK**는 Linear TV / FAST 채널의 프로그래매틱 광고 접근에 필요한 nonce(1회성 암호화 문자열)를 생성합니다. PAL SDK를 Flower SDK와 함께 사용하면 생성된 nonce가 광고 요청에 전달되어, Google이 재생 환경을 검증할 수 있습니다.

이 문서는 iOS 프로젝트에 Google PAL SDK를 라이브러리로 추가하는 방법을 설명합니다.

:::note
PAL SDK는 PAL nonce가 요구되는 프로그래매틱 광고를 서비스할 때만 필요합니다. PAL을 사용하지 않는 서비스라면 이 문서는 건너뛰어도 됩니다.
:::

## 요구 사항

| 항목 | 요구 사항 |
| --- | --- |
| Xcode | 13 이상 |
| 프레임워크 | `ProgrammaticAccessLibrary` |
| 배포 방식 | Swift Package Manager(권장) 또는 수동 `.xcframework` |

## 방법 1. Swift Package Manager (권장)

PAL SDK는 버전 2.5.3부터 Swift Package Manager를 지원하며, 이 방식이 라이브러리 추가에 권장됩니다.

1. **패키지 종속성 추가:** Xcode 상단 메뉴에서 **File** > **Add Package Dependencies...** 를 선택하고 PAL SDK 저장소 URL을 입력합니다.

   ```
   https://github.com/googleads/swift-package-manager-google-programmatic-access-library-ios
   ```

2. **버전 규칙 선택:** **Up to Next Major Version**을 선택하여 호환되는 업데이트를 자동으로 받을 수 있도록 합니다.

3. **타겟에 라이브러리 추가:** `ProgrammaticAccessLibrary` 패키지 제품을 선택하고 iOS 앱 타겟에 추가합니다.

4. **종속성 확인:** 프로젝트 내비게이터의 **Package Dependencies**에 패키지가 표시되는지, 타겟의 **General** > **Frameworks, Libraries, and Embedded Content**에 추가되었는지 확인합니다.

## 방법 2. 수동 설치

Swift Package Manager를 사용할 수 없는 경우 프레임워크를 수동으로 추가할 수 있습니다.

1. [PAL SDK 다운로드 페이지](https://developers.google.com/ad-manager/pal/ios/download)에서 최신 iOS용 PAL SDK를 다운로드합니다.
2. `ProgrammaticAccessLibrary.xcframework`를 Xcode 프로젝트로 드래그합니다.
3. 타겟의 **General** > **Frameworks, Libraries, and Embedded Content**에서 해당 프레임워크를 **Embed & Sign**으로 설정합니다.

## 통합 확인

라이브러리를 추가한 뒤, Swift 소스 파일에서 아래와 같이 import 하여 프레임워크가 정상적으로 인식되는지 확인합니다.

```swift
import ProgrammaticAccessLibrary
```

다음은 nonce 로더를 생성하고 nonce를 요청하는 최소 예제입니다. 전체 API는 [PAL SDK 공식 가이드](https://developers.google.com/ad-manager/pal/ios/get-started)를 참고하세요.

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
        // nonceManager.nonce 값을 광고 요청에 전달합니다.
        print("PAL nonce: \(nonceManager.nonce)")
    }

    func nonceLoader(_ nonceLoader: PALNonceLoader,
                     with request: PALNonceRequest,
                     didFailWith error: Error) {
        print("PAL nonce 로드 실패: \(error.localizedDescription)")
    }
}
```

:::tip
Flower SDK와 통합할 때는 `getPlayerType()` / `getPlayerVersion()`을 통해 플레이어 타입과 버전을 SDK에 전달하여, Google에 보고되는 값이 PAL nonce 설정과 일치하도록 합니다.
:::
