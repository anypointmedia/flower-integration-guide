---
sidebar_position: 4
---

# PIP 모드 지원

> 이 API는 Flower Android SDK 버전 2.8.0 이상에서 사용할 수 있습니다.

Flower SDK는 기존 콘텐츠 위에 오버레이로 광고가 표시되는 경우(예: Flower Player를 사용하지 않는 VOD 미드롤의 경우) Picture-in-Picture 동작을 올바르게 처리할 수 있습니다. PiP 모드 전환 시 올바른 동작을 보장하기 위해, 애플리케이션은 다음 API를 사용하여 SDK에 Picture-in-Picture 상태 변경을 알려야 합니다:

```kotlin
FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode: Boolean)
```

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
