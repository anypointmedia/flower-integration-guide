---
sidebar_position: 3
---

# PIP 모드 지원

PIP(Picture-in-Picture) 모드와 관련해 아래의 두 가지 옵션을 제공합니다:

#### `FlowerSdk.notifyUserLeftApp`

사용자가 앱을 떠나거나(`true`) 앱으로 돌아오면(`false`) 이를 SDK에 알려주는 역할입니다. 홈 화면이나 다른 앱으로 이동하는 경우와 앱의 영상이 PIP 창으로 전환되는 경우 모두 앱을 떠난 것에 해당합니다. `notifyPictureInPictureModeChanged`는 deprecated 되었으며 `notifyUserLeftApp`으로 대체되었습니다. 기존 호출도 계속 동작합니다.

#### `FlowerSdk.setIgnoreAdBreakInPIPMode`

광고 재생 방식을 선택합니다. 기본값은 `true`입니다.

| **값** | **광고 플레이어** | **PIP 모드에서의 광고** |
| ---| ---| --- |
| `true` (기본값) | VOD 광고(프리롤, Mid-roll, Post-roll)와 인라인 광고를 SDK의 별도 광고 플레이어에서 재생하며, 본편 위에 표시합니다. | 지원하지 않습니다. 사용자가 앱을 떠날 때 재생 중이던 광고는 일시정지되며, 사용자가 앱을 떠나 있는 동안에는 Mid-roll 또는 Post-roll Ad Break를 요청하지 않습니다. |
| `false` | 지원하는 플레이어의 경우, 앱의 플레이어 playlist에서 본편 앞에 광고 아이템을 넣어 앱의 플레이어 안에서 VOD 광고를 재생합니다. 인라인 광고(`requestAd`)는 이 옵션과 관계없이 항상 SDK의 별도 광고 플레이어에서 재생됩니다. | VOD 광고는 지원합니다. PIP 모드에서도 광고가 계속 재생됩니다. |

`setIgnoreAdBreakInPIPMode`는 광고를 요청하기 전에 호출하세요. 광고 플레이어는 광고를 요청할 때 결정됩니다.

:::caution
앱이 PIP에 진입하는지와 관계없이, 사용자가 앱을 떠날 때와 앱으로 돌아올 때 모두 `notifyUserLeftApp`으로 반드시 알려주어야 합니다. Bitmovin Player를 포함해 어떤 플레이어에서도 SDK는 이를 스스로 감지하지 않습니다.
:::

## PIP 모드에서의 광고 (기본값)

PIP 모드에서는 기본적으로 광고를 지원하지 않습니다. 앱에서는 광고가 재생 중일 때 본편 플레이어를 PIP로 전환하지 않아야 합니다. 광고 재생 중 PIP 모드를 이용해 광고를 우회할 수 있기 때문입니다. 따라서 앱에서는 PIP 진입 여부와 관계없이 사용자가 앱을 떠나면 `notifyUserLeftApp`을 통해 반드시 알려주어야 합니다. 그래야 사용자가 앱을 떠나면 광고가 일시정지되고, 다시 앱으로 돌아오면 광고가 재개됩니다.

*   광고 재생 중 앱이 `notifyUserLeftApp(true)`를 호출하면 SDK는 광고를 일시정지하고 광고 UI를 숨깁니다. 광고가 일시정지된 동안에는 진행 시간이 흐르지 않으며 쿼타일 트래킹 이벤트도 전송되지 않습니다.
*   앱이 `notifyUserLeftApp(false)`를 호출하면 광고는 멈췄던 위치부터 다시 재생되어 끝까지 재생됩니다.
*   사용자가 앱을 떠나 있는 동안에는 Mid-roll 및 Post-roll Ad Break를 요청하지 않습니다.
*   스트림에 삽입되는 Linear TV 광고는 이 옵션의 영향을 받지 않습니다. 사용자가 앱을 떠나 있는 동안에도 계속 재생되며 광고 UI만 숨겨집니다. 단, Linear 채널의 프리롤(`prerollAdTagUrl`)은 VOD 광고와 동일하게 일시정지 및 재개됩니다.

어떤 화면이 PIP로 전환되는지는 SDK가 아니라 OS와 앱이 결정합니다. Android에서는 Activity 전체가 PIP로 전환되므로 본편 플레이어를 PIP 화면에서 제외할 수 없습니다. 광고 재생 중에는 앱이 직접 PIP를 시작하지 말고(예: `onUserLeaveHint()`에서 진입하거나 `setAutoEnterEnabled(true)`를 사용하는 경우), 광고가 일시정지된 동안 PIP 화면에서 본편 플레이어를 재개하지 마세요. 광고가 끝나면 SDK가 본편을 직접 재개합니다.

`Activity.enterPictureInPictureMode(PictureInPictureParams)`는 API 레벨 26(Android 8.0) 이상, `PictureInPictureParams.Builder.setAutoEnterEnabled()`는 API 레벨 31(Android 12) 이상에서 사용할 수 있습니다. Flower SDK는 더 낮은 API 레벨도 지원하므로 PIP에 진입하기 전에 API 레벨을 확인하세요.

아래 예시에서는 `onUserLeaveHint()`에서 PIP 진입 여부를 정하기 전에 사용자가 앱을 떠났음을 알리고, `onResume()`에서 사용자가 돌아왔음을 알립니다. 사용자가 앱으로 돌아오면 Activity가 resume되며, PIP 창을 다시 전체 화면으로 확대하는 경우도 마찬가지입니다.

**_Kotlin_**

```kotlin
class YourActivity : Activity() {
    private var isAdPlaying = false

    private val adsManagerListener = object : FlowerAdsManagerListener {
        override fun onPlay() { isAdPlaying = true }
        override fun onCompleted() { isAdPlaying = false }
        override fun onError(error: FlowerError?) { isAdPlaying = false }
        ...
    }

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

**_Java_**

```java
public class YourActivity extends Activity {
    private boolean isAdPlaying = false;

    private final FlowerAdsManagerListener adsManagerListener = new FlowerAdsManagerListener() {
        @Override public void onPlay() { isAdPlaying = true; }
        @Override public void onCompleted() { isAdPlaying = false; }
        @Override public void onError(@Nullable FlowerError error) { isAdPlaying = false; }
        ...
    };

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

## PIP 모드에서 광고 지원하기

반대로 더 많은 광고 인벤토리를 위해 PIP 모드에서도 광고를 지원하려면(`setIgnoreAdBreakInPIPMode(false)`) 앱에서 이벤트 처리에 신경 써야 합니다.

```kotlin
// TODO GUIDE: PIP 모드에서도 광고가 재생되도록 앱의 플레이어에서 광고 재생
FlowerSdk.setIgnoreAdBreakInPIPMode(false)
```

이 모드에서 앱의 플레이어 안에서 광고를 재생하는 플레이어는 아래와 같습니다. 그 외의 플레이어(커스텀 플레이어 포함)는 항상 SDK의 별도 광고 플레이어를 사용합니다.

*   Media3 ExoPlayer 및 `FlowerMedia3ExoPlayer`
*   ExoPlayer2 및 `FlowerExoPlayer2`
*   Bitmovin Player 및 `FlowerBitmovinPlayer`

### 앱의 플레이어에서 광고가 재생되는 방식

1. Ad Break가 시작되면 SDK는 플레이어의 playlist에서 본편 앞에 광고 아이템을 추가하고, 플레이어는 광고로 이동합니다.
2. Ad Break가 끝나면 SDK는 본편을 재개 지점(중단된 위치에서 `rewindDuration`만큼 앞선 위치)으로 되돌려 놓습니다. 방식은 플레이어에 따라 다릅니다.
    *   **Media3 ExoPlayer / ExoPlayer2:** 본편이 **새로운 미디어 아이템**으로 다시 들어옵니다. 원래의 `MediaItem`을 재개 지점부터 시작하도록 클리핑하여 다시 추가합니다. 따라서 `currentPosition`은 재개 지점부터 계산되며, 원래 본편 기준 위치는 클리핑 시작 위치와 `currentPosition`을 더한 값입니다.
    *   **Bitmovin Player:** `currentTime`은 원래 본편 기준 위치 그대로이므로 별도로 변환할 필요가 없습니다.

```kotlin
// Media3 ExoPlayer / ExoPlayer2: Mid-roll 이후 원래 본편 기준 위치
val contentPositionMs =
    (player.currentMediaItem?.clippingConfiguration?.startPositionMs ?: 0L) + player.currentPosition
```

### 플레이어 이벤트 처리

Ad Break 전후마다 현재 미디어 아이템이 바뀌므로, 미디어 아이템 변경이나 재생 완료를 감지하는 앱의 로직(재생 종료, 미디어 아이템 전환, 특정 아이템에 붙인 리스너 등)은 현재 아이템이 무엇이든 반응하지 말고 본편 URL일 때만 반응해야 합니다. 앱이 생성한 미디어 아이템이 계속 재생 중이라고 가정하지 마세요.

*   `Player.STATE_ENDED`와 `onMediaItemTransition`은 Ad Break 전후에도 발생합니다. 본편의 이벤트로 처리하기 전에 현재 미디어 아이템이 본편인지 확인하세요.
*   Post-roll이 끝나면 본편이 끝 위치로 다시 들어오므로 `STATE_ENDED`가 다시 보고될 수 있습니다. `notifyContentEnded()`는 본편당 한 번만 호출하세요.
*   광고가 실패하면 SDK는 `onError`를 호출하기 전에 같은 방식으로 본편을 되돌려 놓고 재생합니다. `onError`에서 본편을 정지, 탐색(seek), 재로드하지 마세요. Mid-roll 오류 후에는 [VOD 프리롤, Mid-roll, Post-roll 광고 적용](./vod-ad-implementation)과 같이 안전장치로 본편을 재개하세요. 이 모드에서는 광고 실패 1건이 `onError`로 두 번 보고될 수 있습니다.

**_Kotlin_**

```kotlin
private val contentUrl = "https://vod_content_url"
private var isContentEnd = false

private fun isPlayingContent(): Boolean =
    player.currentMediaItem?.localConfiguration?.uri?.toString() == contentUrl

player.addListener(object : Player.Listener {
    override fun onPlaybackStateChanged(playbackState: Int) {
        // TODO GUIDE: 광고 아이템의 STATE_ENDED는 본편 종료가 아님
        if (playbackState != Player.STATE_ENDED || !isPlayingContent()) return

        // TODO GUIDE: 본편 종료는 한 번만 알림
        if (isContentEnd) return
        isContentEnd = true
        flowerAdView.adsManager.notifyContentEnded()
    }

    override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
        // OPTIONAL GUIDE: 예) 본편 재생 중에만 플레이어 컨트롤 표시
        playerView.useController = mediaItem?.localConfiguration?.uri?.toString() == contentUrl
    }
})
```

Bitmovin Player의 경우에도 같은 방식으로 현재 소스를 확인하세요. 예를 들어 `PlayerEvent.PlaybackFinished`에서 `player.source?.config?.url`을 본편 URL과 비교합니다.
