---
sidebar_position: 2
---

# Step 2: 광고 UI 선언 및 플레이어 생성

이 프롬프트는 LLM이 HTML5/Web용 광고 표시 컨테이너를 설정하고 비디오 플레이어를 생성하도록 안내합니다.

**사용 전:** `{{AD_TYPE}}`과 `{{APPROACH}}`를 입력하세요.

```plain
We are integrating the FLOWER SDK into our HTML5/Web project.
This step sets up the ad display container and creates the video player.

AD_TYPE: {{AD_TYPE}}
(linear-tv | vod | interstitial)

APPROACH: {{APPROACH}}
(flower-hls | media-player-hook)
Note: For interstitial AD_TYPE, no APPROACH selection is needed.

Note: "flower-hls" is the HTML5 equivalent of FlowerPlayer.

========================================
PART 1 — Declare the Ad UI (HTML/CSS)
========================================

If APPROACH is "flower-hls":
    FlowerHls manages its own video element internally.
    Only need a container div.

    <div id="video-container" style="position: relative; width: 1920px; height: 1080px;">
    </div>

If APPROACH is "media-player-hook":
    Two layers: video element + ad container overlay.
    The ad container is absolutely positioned over the video and hidden by default.

    <div id="video-container" style="position: relative; width: 1920px; height: 1080px;">
        <video id="video-element" controls
            style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%; height: 100%;">
        </video>
        <div id="ad-container"
            style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: none;">
        </div>
    </div>

If AD_TYPE is "interstitial":
    Only the ad container is needed. No video element.

    <div id="ad-container" style="width: 100%; height: 100%;"></div>

========================================
PART 2 — Create FlowerAdView Instance
========================================

If APPROACH is "flower-hls":
    FlowerHls manages ads internally. No separate FlowerAdView needed.
    (Ad listener is registered via hls.addAdListener())

If APPROACH is "media-player-hook" or AD_TYPE is "interstitial":
    const flowerAdView = new FlowerAdView(document.getElementById('ad-container'));

React:
    const adContainerRef = useRef(null);
    const flowerAdViewRef = useRef(null);
    useEffect(() => {
        if (!adContainerRef.current) return;
        flowerAdViewRef.current = new window.FlowerAdView(adContainerRef.current);
    }, [adContainerRef]);

========================================
PART 3 — Create Video Player
========================================

If APPROACH is "flower-hls":
    const hls = new FlowerHls({
        backBufferLength: 30,
        liveSyncDurationCount: 1,
    });
    hls.attachContainer(document.getElementById('video-container'));

If APPROACH is "media-player-hook":
    Choose one of the supported players:

    HLS.js:
    const player = new Hls();
    const videoElement = document.getElementById('video-element');
    player.attachMedia(videoElement);

    Bitmovin:
    const player = new bitmovin.player.Player(
        document.getElementById('video-container'),
        { key: 'YOUR_API_KEY' }
    );

    Dash.js:
    const player = dashjs.MediaPlayer().create();
    player.initialize(videoElement, null, false);

If AD_TYPE is "interstitial":
    No player creation needed.

========================================
CONSTRAINTS
========================================

- FlowerHls is a wrapper around HLS.js with integrated ad support.
- For media-player-hook, the ad container must have "display: none" initially.
- Supported players for media-player-hook: HLS.js, Video.js, Bitmovin Player, Dash.js.
- FlowerAdView constructor requires a DOM element reference.
```
