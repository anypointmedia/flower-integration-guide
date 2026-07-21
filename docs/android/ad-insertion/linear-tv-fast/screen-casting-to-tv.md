---
sidebar_position: 4
---

# Screen Casting To TV

When inserting replacement ads into linear TV streams on Android, the Flower SDK runs an **internal Proxy Server** that rewrites the original manifest (m3u8/mpd) on the fly. As a result, the URL returned by `changeChannelUrl()` is a **loopback address** that points to this in-app Proxy Server, not the original CDN.

Loopback URLs are only reachable from the device that produced them. If you hand that URL to another screen — for example, an external TV via Chromecast, AirPlay, or a Smart TV — the remote screen cannot resolve it and playback will fail.

:::caution Screen casting is not supported
Serving a castable URL from the in-app Proxy Server would require keeping that server — and therefore the app — alive as a **background service** for the entire casting session. Maintaining such a background service reliably is not feasible, so casting the ad-replaced stream to an external screen is unstable and is therefore **not supported**.

When you need to cast to an external screen (Chromecast, AirPlay, Smart TV, etc.), do the following instead:

1. Call `FlowerAdsManager.stop()` to shut down the Proxy Server and end ad replacement.
2. Cast the **original stream URL** (the CDN URL, not the loopback URL returned by `changeChannelUrl()`) to the external screen.

Note that ad replacement is not applied on the external screen in this case, because the stream is played directly from the original CDN without going through the Proxy Server.
:::

## Example

```kotlin
// Keep a reference to the original stream URL so it can be reused when casting.
private val originalStreamUrl = "https://XXX"

private fun playLinearTv() {
    // TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
    val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        originalStreamUrl,
        "https://ad_request",
        "100",
        mapOf("custom-param" to "custom-param-value"),
        mediaPlayerHook,
        mapOf("custom-ad-header" to "custom-ad-header-value"),
        mapOf("custom-stream-header" to "custom-stream-header-value"),
        null
    )

    // TODO GUIDE: Use the loopback URL on the local player
    player.setMediaItem(MediaItem.fromUri(changedChannelUrl))
    player.prepare()
    player.play()
}

// TODO GUIDE: When casting to another screen (e.g., TV),
// stop the SDK and cast the original stream URL instead of the loopback URL.
fun startCastingToTv() {
    // Shut down the Proxy Server. Ad replacement is no longer applied.
    flowerAdView.adsManager.stop()

    // Cast the original stream URL (not the URL returned by changeChannelUrl()).
    castSession.loadMedia(originalStreamUrl)
}
```

## When to Use

| Scenario | URL to Use |
| ---| --- |
| Local in-app playback | URL returned by `changeChannelUrl()` |
| Casting to an external screen (Chromecast, AirPlay receiver, Smart TV, etc.) | Original stream URL, after calling `FlowerAdsManager.stop()` |
