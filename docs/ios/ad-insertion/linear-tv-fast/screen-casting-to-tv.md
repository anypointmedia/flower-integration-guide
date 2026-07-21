---
sidebar_position: 3
---

# Screen Casting To TV

When inserting replacement ads into linear TV streams on iOS, the Flower SDK runs an **internal Proxy Server** that rewrites the original manifest (m3u8/mpd) on the fly. As a result, the URL returned by `changeChannelUrl()` is a **loopback address** that points to this in-app Proxy Server, not the original CDN.

Loopback URLs are only reachable from the device that produced them. If you hand that URL to another screen — for example, an external TV via AirPlay, Chromecast, or a Smart TV — the remote screen cannot resolve it and playback will fail.

:::caution Screen casting is not supported
Serving a castable URL from the in-app Proxy Server would require keeping that server — and therefore the app — alive as a **background service** for the entire casting session. Maintaining such a background service reliably is not feasible, so casting the ad-replaced stream to an external screen is unstable and is therefore **not supported**.

When you need to cast to an external screen (AirPlay, Chromecast, Smart TV, etc.), do the following instead:

1. Call `FlowerAdsManager.stop()` to shut down the Proxy Server and end ad replacement.
2. Cast the **original stream URL** (the CDN URL, not the loopback URL returned by `changeChannelUrl()`) to the external screen.

Note that ad replacement is not applied on the external screen in this case, because the stream is played directly from the original CDN without going through the Proxy Server.
:::

## Example

```swift
// Keep a reference to the original stream URL so it can be reused when casting.
private let originalStreamUrl = "https://XXX"

private func playLinearTv() {
    // TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
    let changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        videoUrl: originalStreamUrl,
        adTagUrl: "https://ad_request",
        channelId: "100",
        extraParams: ["custom-param": "custom-param-value"],
        mediaPlayerHook: mediaPlayerHook,
        adTagHeaders: ["custom-ad-header": "custom-ad-header-value"],
        channelStreamHeaders: ["custom-stream-header": "custom-stream-header-value"],
        prerollAdTagUrl: nil
    )

    // TODO GUIDE: Use the loopback URL on the local player
    player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: changedChannelUrl)!))
    player.play()
}

// TODO GUIDE: When casting to another screen (e.g., TV),
// stop the SDK and cast the original stream URL instead of the loopback URL.
func startCastingToTv() {
    // Shut down the Proxy Server. Ad replacement is no longer applied.
    flowerAdView.adsManager.stop()

    // Cast the original stream URL (not the URL returned by changeChannelUrl()).
    castSession.loadMedia(url: originalStreamUrl)
}
```

## When to Use

| Scenario | URL to Use |
| ---| --- |
| Local in-app playback | URL returned by `changeChannelUrl()` |
| Casting to an external screen (AirPlay receiver, Chromecast, Smart TV, etc.) | Original stream URL, after calling `FlowerAdsManager.stop()` |
