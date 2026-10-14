---
sidebar_position: 4
---

# PIP 모드 지원

> 이 API는 Flower Android SDK 버전 2.8.0 이상에서 사용할 수 있습니다.

Flower SDK는 PIP(Picture-in-Picture) 모드와 같이 사용자가 앱을 떠나 있는 동안에는 CTA(Call To Action) 기능을 제한합니다. 따라서 올바른 동작을 보장하기 위해서는 애플리케이션에서 다음 API를 사용하여 사용자가 앱을 떠날 때와 앱으로 돌아올 때 이를 알려야 합니다. VOD일 때 PIP 모드 처리에 따른 사용 여부는 [VOD PIP 모드 지원](../ad-insertion/vod/pip-mode-support) 페이지를 참고하세요.

```kotlin
FlowerSdk.notifyUserLeftApp(hasLeftApp: Boolean)
```

사용자가 앱을 떠나면(홈 화면이나 다른 앱으로 이동하거나, 앱의 영상이 PIP 창으로 전환되는 경우) `true`를, 사용자가 앱으로 돌아오면 `false`를 전달합니다. 앱이 PIP에 진입하는지와 관계없이 알려야 합니다.

:::note
`notifyPictureInPictureModeChanged`는 deprecated 되었으며 `notifyUserLeftApp`으로 대체되었습니다. 기존 호출도 계속 동작합니다.
:::

PIP 모드에서는 기본적으로 광고를 지원하지 않습니다(`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`). 광고 재생 중 사용자가 앱을 떠나면 SDK는 광고를 일시정지하고, 사용자가 앱으로 돌아오면 광고를 재개합니다. SDK는 이를 스스로 감지하지 않으므로, 앱이 떠날 때와 돌아올 때를 모두 알려주어야 이렇게 동작합니다. 또한 앱에서는 광고가 재생 중일 때 본편 플레이어를 PIP로 전환하지 않아야 합니다. 광고 재생 중 PIP 모드를 이용해 광고를 우회할 수 있기 때문입니다. 광고 재생 중에는 앱이 PIP에 진입하지 않으므로, PIP 진입이 아니라 사용자가 앱을 떠난 것을 알리는 것입니다. 자세한 내용과 PIP 모드에서 광고를 지원하는 방법은 [VOD PIP 모드 지원](../ad-insertion/vod/pip-mode-support) 페이지를 참고하세요.

아래는 Android 소스 코드 예시입니다. 사용자가 앱으로 돌아오면 Activity가 resume되며, PIP 창을 다시 전체 화면으로 확대하는 경우도 마찬가지입니다.

**_Java_**

```java
public class YourActivity extends Activity {
    // FlowerAdsManagerListener에서 갱신: onPlay() -> true, onCompleted() / onError() -> false
    private boolean isAdPlaying = false;

    ...

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();

        // TODO GUIDE: PIP 진입 여부와 관계없이 사용자가 앱을 떠났음을 Flower SDK에 알림
        FlowerSdk.notifyUserLeftApp(true);

        // TODO GUIDE: 광고 재생 중에는 PIP에 진입하지 않음
        //             (enterPictureInPictureMode(PictureInPictureParams)는 API 26 이상 필요)
        if (!isAdPlaying && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            enterPictureInPictureMode(new PictureInPictureParams.Builder().build());
        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        // TODO GUIDE: 사용자가 앱으로 돌아왔음을 Flower SDK에 알림
        FlowerSdk.notifyUserLeftApp(false);
    }

    ...
}
```

**_Kotlin_**

```kotlin
class YourActivity : Activity() {
    // FlowerAdsManagerListener에서 갱신: onPlay() -> true, onCompleted() / onError() -> false
    private var isAdPlaying = false

    ...

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()

        // TODO GUIDE: PIP 진입 여부와 관계없이 사용자가 앱을 떠났음을 Flower SDK에 알림
        FlowerSdk.notifyUserLeftApp(true)

        // TODO GUIDE: 광고 재생 중에는 PIP에 진입하지 않음
        //             (enterPictureInPictureMode(PictureInPictureParams)는 API 26 이상 필요)
        if (!isAdPlaying && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            enterPictureInPictureMode(PictureInPictureParams.Builder().build())
        }
    }

    override fun onResume() {
        super.onResume()

        // TODO GUIDE: 사용자가 앱으로 돌아왔음을 Flower SDK에 알림
        FlowerSdk.notifyUserLeftApp(false)
    }

    ...
}
```
