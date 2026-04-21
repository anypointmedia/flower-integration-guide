---
sidebar_position: 3
---

# PIP Mode Support

To support PIP (Picture-in-Picture) mode, Flower SDK uses the player received through `MediaPlayerHook` to play ads.

The SDK provides the following two options related to PIP mode:

#### `FlowerSdk.notifyPictureInPictureModeChanged`

Notifies the SDK when PIP mode is entered or exited.

#### `FlowerSdk.setIgnoreAdBreakInPIPMode`

When set to `true`, Mid-roll or Post-roll Ad Breaks that occur in PIP mode are ignored. In other words, the policy is to not serve ads in PIP mode. When this value is `true`, the SDK uses a separate player for ad playback when not in PIP mode.

:::caution
You must notify PIP mode transitions using `notifyPictureInPictureModeChanged`.
:::

## Behavior by Ad Type

### Pre-roll Ads

When `setIgnoreAdBreakInPIPMode` is `true` and the app enters PIP mode during a pre-roll ad, the ad will be stopped. The SDK then delivers the `onCompleted` event, and the app should perform the appropriate action for its scenario at that point.

### Mid-roll and Post-roll Ads

When ads are used in PIP mode, the SDK saves the currently playing media item and playback position when the ad playback time arrives, and attempts to resume playback from that position after the ad ends.

However, if `setIgnoreAdBreakInPIPMode` is `true` and the app is in PIP mode, the ad break is ignored even when triggered. Additionally, any currently playing ad will also be terminated.

## Example

**_Kotlin_**

```kotlin
class YourActivity : Activity() {
    ...

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // TODO GUIDE: Set to ignore ad breaks in PIP mode
        FlowerSdk.setIgnoreAdBreakInPIPMode(true)
    }

    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration?) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)

        // TODO GUIDE: Notify Flower SDK about Picture-in-Picture mode changes
        FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode)
    }

    ...
}
```

**_Java_**

```java
public class YourActivity extends Activity {
    ...

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // TODO GUIDE: Set to ignore ad breaks in PIP mode
        FlowerSdk.setIgnoreAdBreakInPIPMode(true);
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, @Nullable Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);

        // TODO GUIDE: Notify Flower SDK about Picture-in-Picture mode changes
        FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode);
    }

    ...
}
```
