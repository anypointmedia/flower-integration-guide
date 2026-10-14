---
sidebar_position: 4
---

# PIP Mode Support

> This API is available in Flower Android SDK version 2.8.0 and later.

Flower SDK restricts CTA (Call To Action) functionality while the user is away from the app, for example in PIP (Picture-in-Picture) mode. To ensure correct behavior, the application must notify the SDK when the user leaves the app and when the user comes back, using the following API. For PIP mode handling specific to VOD, please refer to the [VOD PIP Mode Support](../ad-insertion/vod/pip-mode-support) page.

```kotlin
FlowerSdk.notifyUserLeftApp(hasLeftApp: Boolean)
```

Pass `true` when the user leaves the app (to the home screen, to another app, or when the app's video moves to a PIP window), and `false` when the user comes back to the app. Report it whether or not the app enters PIP.

:::note
`notifyPictureInPictureModeChanged` is deprecated and replaced by `notifyUserLeftApp`. Existing calls keep working.
:::

Ads are not supported in PIP mode by default (`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`). When the user leaves the app while an ad is playing, the SDK pauses the ad, and resumes it when the user comes back. This works only if the app reports both leaving and returning, because the SDK does not detect this by itself. In addition, while an ad is playing, the app must not switch the content player into PIP, because PIP mode could otherwise be used to bypass the ad. This is why the app reports the user leaving the app, not entering PIP: while an ad is playing, the app does not enter PIP at all. See [VOD PIP Mode Support](../ad-insertion/vod/pip-mode-support) for details and for supporting ads in PIP mode.

Below is an Android source code example. The Activity is resumed when the user comes back to the app, including when the PIP window is expanded back to full screen.

**_Java_**

```java
public class YourActivity extends Activity {
    // Updated from FlowerAdsManagerListener: onPlay() -> true, onCompleted() / onError() -> false
    private boolean isAdPlaying = false;

    ...

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();

        // TODO GUIDE: Notify Flower SDK that the user left the app, whether or not the app enters PIP
        FlowerSdk.notifyUserLeftApp(true);

        // TODO GUIDE: Do not enter PIP while an ad is playing
        //             (enterPictureInPictureMode(PictureInPictureParams) requires API 26)
        if (!isAdPlaying && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            enterPictureInPictureMode(new PictureInPictureParams.Builder().build());
        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        // TODO GUIDE: Notify Flower SDK that the user came back to the app
        FlowerSdk.notifyUserLeftApp(false);
    }

    ...
}
```

**_Kotlin_**

```kotlin
class YourActivity : Activity() {
    // Updated from FlowerAdsManagerListener: onPlay() -> true, onCompleted() / onError() -> false
    private var isAdPlaying = false

    ...

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()

        // TODO GUIDE: Notify Flower SDK that the user left the app, whether or not the app enters PIP
        FlowerSdk.notifyUserLeftApp(true)

        // TODO GUIDE: Do not enter PIP while an ad is playing
        //             (enterPictureInPictureMode(PictureInPictureParams) requires API 26)
        if (!isAdPlaying && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            enterPictureInPictureMode(PictureInPictureParams.Builder().build())
        }
    }

    override fun onResume() {
        super.onResume()

        // TODO GUIDE: Notify Flower SDK that the user came back to the app
        FlowerSdk.notifyUserLeftApp(false)
    }

    ...
}
```
