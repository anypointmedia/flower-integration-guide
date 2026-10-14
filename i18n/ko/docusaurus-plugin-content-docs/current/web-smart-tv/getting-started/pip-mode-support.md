---
sidebar_position: 4
---

# PIP 모드 지원

Flower SDK는 PIP(Picture-in-Picture) 모드에서는 CTA(Call To Action) 기능을 제한하며, 기본적으로 PIP 모드에서는 광고를 재생하지 않습니다. 따라서 올바른 동작을 보장하기 위해서는 애플리케이션에서 PIP 상태 변경을 SDK에 알려야 합니다.

PIP 모드와 관련해 아래의 두 가지 옵션을 제공합니다:

#### `FlowerSdk.notifyPictureInPictureModeChanged`

PIP 모드가 되거나(`true`) 해제되면(`false`) 이를 SDK에 알려주는 역할입니다.

```javascript
FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode)
```

#### `FlowerSdk.setIgnoreAdBreakInPIPMode`

광고 재생 방식을 선택합니다. 기본값은 `true`입니다.

```javascript
FlowerSdk.setIgnoreAdBreakInPIPMode(ignore)
```

| **값** | **광고 플레이어** | **PIP 모드에서의 광고** |
| ---| ---| --- |
| `true` (기본값) | VOD 광고(프리롤, Mid-roll, Post-roll)와 인라인 광고를 SDK의 별도 video 요소에서 재생하며, 본편 위에 표시합니다. | 지원하지 않습니다. PIP 모드에 진입할 때 재생 중이던 광고는 일시정지되며, PIP 모드에서는 Mid-roll 또는 Post-roll Ad Break를 요청하지 않습니다. |
| `false` | 지원하는 플레이어의 경우, 앱의 플레이어 소스를 광고로 전환했다가 다시 본편으로 되돌려 앱의 플레이어 안에서 광고를 재생합니다. | 지원합니다. PIP 모드에서도 광고가 계속 재생됩니다. |

`setIgnoreAdBreakInPIPMode`는 광고를 요청하기 전에 호출하세요. 광고 플레이어는 광고를 요청할 때 결정됩니다.

:::caution
`notifyPictureInPictureModeChanged`로 PIP 진입과 해제를 모두 반드시 알려주어야 합니다. SDK는 PIP 모드를 스스로 감지하지 않습니다.
:::

## PIP 모드에서의 광고 (기본값)

PIP 모드에서는 기본적으로 광고를 지원하지 않습니다. 따라서 광고가 재생 중이라면 앱에서는 `notifyPictureInPictureModeChanged`를 통해 PIP 변경 여부를 반드시 알려주어야 합니다. 그래야 PIP에 진입하면 광고가 일시정지되고, 다시 앱으로 돌아오면 광고가 재개됩니다. 또한 앱에서는 광고가 재생 중일 때 PIP 모드로 바뀌더라도 본편 플레이어를 PIP로 전환하지 않아야 합니다. 광고 재생 중 PIP 모드를 이용해 광고를 우회할 수 있기 때문입니다.

*   광고 재생 중 앱이 `notifyPictureInPictureModeChanged(true)`를 호출하면 SDK는 광고를 일시정지하고 광고 UI를 숨깁니다. 광고가 일시정지된 동안에는 진행 시간이 흐르지 않으며 쿼타일 트래킹 이벤트도 전송되지 않습니다.
*   앱이 `notifyPictureInPictureModeChanged(false)`를 호출하면 광고는 멈췄던 위치부터 다시 재생되어 끝까지 재생됩니다.
*   앱이 PIP 모드인 동안에는 Mid-roll 및 Post-roll Ad Break를 요청하지 않습니다.
*   스트림에 삽입되는 Linear TV 광고는 이 옵션의 영향을 받지 않습니다. PIP 모드에서도 계속 재생되며 광고 UI만 숨겨집니다. 단, Linear 채널의 프리롤(`prerollAdTagUrl`)은 VOD 광고와 동일하게 일시정지 및 재개됩니다.

어떤 영상이 PIP로 전환되는지는 SDK가 아니라 앱이 결정합니다. 웹에서는 앱이 PIP를 요청한 `<video>` 요소, 즉 본편 video가 PIP로 전환됩니다. 광고 재생 중에는 본편 video에 PIP를 요청하지 말고, 광고 구간이 끝날 때까지 본편 video의 PIP를 비활성화하세요.

```javascript
const videoElement = document.querySelector('video');

// TODO GUIDE: PIP 모드 전환을 Flower SDK에 알림
videoElement.addEventListener('enterpictureinpicture', () => {
    FlowerSdk.notifyPictureInPictureModeChanged(true);
});
videoElement.addEventListener('leavepictureinpicture', () => {
    FlowerSdk.notifyPictureInPictureModeChanged(false);
});

// TODO GUIDE: 광고 재생 중에는 본편 video가 PIP로 전환되지 않도록 함
const adsManagerListener = {
    onPlay() {
        videoElement.disablePictureInPicture = true;
    },
    onCompleted() {
        videoElement.disablePictureInPicture = false;
        ...
    },
    onError(error) {
        videoElement.disablePictureInPicture = false;
        ...
    },
    ...
};
```

## PIP 모드에서 광고 지원하기

반대로 더 많은 광고 인벤토리를 위해 PIP 모드에서도 광고를 지원하려면(`setIgnoreAdBreakInPIPMode(false)`) 앱에서 이벤트 처리에 신경 써야 합니다.

```javascript
// TODO GUIDE: PIP 모드에서도 광고가 재생되도록 앱의 플레이어에서 광고 재생
FlowerSdk.setIgnoreAdBreakInPIPMode(false);
```

이 모드에서 앱의 플레이어 안에서 광고를 재생하는 플레이어는 아래와 같습니다. 그 외에 지원되는 플레이어(Shaka Player, dash.js)는 항상 SDK의 별도 video 요소를 사용합니다.

*   HLS.js (`FlowerHls` 포함)
*   Bitmovin Player

### 앱의 플레이어에서 광고가 재생되는 방식

1. Ad Break가 시작되면 SDK는 플레이어의 소스를 광고로 전환합니다.
2. Ad Break가 끝나면 SDK는 소스를 다시 본편으로 전환하여 재개 지점(중단된 위치에서 `rewindDuration`만큼 앞선 위치)부터 재생합니다.

### 플레이어 이벤트 처리

Ad Break 전후마다 플레이어의 소스가 바뀌므로, 소스 변경이나 재생 완료를 감지하는 앱의 로직(`ended` 이벤트, 소스 로드 이벤트 등)은 현재 소스가 무엇이든 반응하지 말고 본편 URL일 때만 반응해야 합니다.

*   video 요소의 `ended` 이벤트는 각 광고가 끝날 때에도 발생합니다. 본편 종료로 처리하기 전에 현재 소스가 본편인지 확인하세요.
*   `notifyContentEnded()`는 본편당 한 번만 호출하세요.

### _HLS.js_

```javascript
const contentUrl = 'https://vod_content_url';
let isContentEnd = false;

videoElement.addEventListener('ended', () => {
    // TODO GUIDE: 광고 종료는 본편 종료가 아님
    if (hls.url !== contentUrl) return;

    // TODO GUIDE: 본편 종료는 한 번만 알림
    if (isContentEnd) return;
    isContentEnd = true;
    flowerAdView.adsManager.notifyContentEnded();
});
```

### _Bitmovin Player_

```javascript
const contentUrl = 'https://vod_content_url';
let isContentEnd = false;

player.on(bitmovin.player.PlayerEvent.PlaybackFinished, () => {
    // TODO GUIDE: 광고 종료는 본편 종료가 아님
    if (player.getSource()?.hls !== contentUrl) return;

    // TODO GUIDE: 본편 종료는 한 번만 알림
    if (isContentEnd) return;
    isContentEnd = true;
    flowerAdView.adsManager.notifyContentEnded();
});
```
