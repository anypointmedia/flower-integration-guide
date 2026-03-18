---
sidebar_position: 4
---

# PIP Mode Support

> This API is available in Flower Android SDK version 2.8.0 and later.

Flower SDK can correctly handle Picture-in-Picture behavior when ads are displayed as overlay on top of existing content (for example, VOD midroll cases when Flower Player is not used). To ensure proper behavior during PiP mode transitions, the application should notify the SDK about Picture-in-Picture state changes using the following API:

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
