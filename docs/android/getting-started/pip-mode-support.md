---
sidebar_position: 4
---

# PIP Mode Support

> This API is available in Flower Android SDK version 2.8.0 and later.

Flower SDK restricts CTA (Call To Action) functionality in PIP (Picture-in-Picture) mode. To ensure correct behavior, the application must notify the SDK about state changes using the following API. For PIP mode handling specific to VOD, please refer to the [VOD PIP Mode Support](../ad-insertion/vod/pip-mode-support) page.

```kotlin
FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode: Boolean)
```

Below is an Android source code example:

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
