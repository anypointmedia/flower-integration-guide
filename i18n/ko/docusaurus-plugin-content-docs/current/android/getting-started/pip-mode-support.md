---
sidebar_position: 4
---

# PIP 모드 지원

> 이 API는 Flower Android SDK 버전 2.8.0 이상에서 사용할 수 있습니다.

Flower SDK는 PIP(Picture-in-Picture) 모드에서는 CTA(Call To Action) 기능을 제한합니다. 따라서 올바른 동작을 보장하기 위해서는 애플리케이션에서 다음 API를 사용하여 상태 변경을 알려야 합니다. VOD일 때 PIP 모드 처리에 따른 사용 여부는 [VOD PIP 모드 지원](../ad-insertion/vod/pip-mode-support) 페이지를 참고하세요.

```kotlin
FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode: Boolean)
```

PIP 모드에서는 기본적으로 광고를 지원하지 않습니다(`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`). 광고 재생 중 앱이 PIP에 진입하면 SDK는 광고를 일시정지하고, 앱이 PIP에서 돌아오면 광고를 재개합니다. SDK는 PIP 모드를 스스로 감지하지 않으므로, 앱이 PIP 진입과 해제를 모두 알려주어야 이렇게 동작합니다. 또한 앱에서는 광고가 재생 중일 때 본편 플레이어를 PIP로 전환하지 않아야 합니다. 광고 재생 중 PIP 모드를 이용해 광고를 우회할 수 있기 때문입니다. 자세한 내용과 PIP 모드에서 광고를 지원하는 방법은 [VOD PIP 모드 지원](../ad-insertion/vod/pip-mode-support) 페이지를 참고하세요.

아래는 Android 소스 코드 예시입니다:

**_Java_**

```java
public class YourActivity extends Activity {
    ...

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, @Nullable Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);

        // TODO GUIDE: Notify Flower SDK about Picture-in-Picture mode changes
        FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode);
    }

    ...
}
```

**_Kotlin_**

```kotlin
class YourActivity : Activity() {
    ...

    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration?) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)

        // TODO GUIDE: Notify Flower SDK about Picture-in-Picture mode changes
        FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode)
    }

    ...
}
```
