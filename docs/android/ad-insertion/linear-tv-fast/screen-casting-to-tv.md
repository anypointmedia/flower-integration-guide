---
sidebar_position: 4
---

# Screen Casting To TV

When inserting replacement ads into linear TV streams on Android, the Flower SDK runs an **internal Proxy Server** that rewrites the original manifest (m3u8/mpd) on the fly. As a result, the URL returned by `changeChannelUrl()` is a **loopback address** that points to this in-app Proxy Server, not the original CDN.

Loopback URLs are only reachable from the device that produced them. If you hand that URL to another screen — for example, an external TV via Chromecast, AirPlay, or a Smart TV — the remote screen cannot resolve it and playback will fail.

For these screen casting scenarios, use `FlowerAdsManager.getScreenCastingUrl()` to obtain a URL that the remote screen can play.

## FlowerAdsManager.getScreenCastingUrl

Returns a stream URL suitable for casting to an external screen.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| _(none)_ |  |  |

| **Return** | **Type** | **Description** |
| ---| ---| --- |
| screenCastingUrl | string | URL that can be played on an external screen.<br/>Falls back to the original stream URL if a casting URL cannot be produced.<br/>Returns an empty string (`""`) if called before `changeChannelUrl()`. |

:::note Usage requirements
- `getScreenCastingUrl()` must be called **after** `changeChannelUrl()`. Calling it earlier returns an empty string (`""`) because the Proxy Server has not been initialized yet.
- On any internal error, the SDK returns the original stream URL so that casting can continue, although ad replacement will not be applied on the remote screen in that case.
:::

:::caution Do not stop the SDK while casting
Screen casting is served by the **ad SDK (Proxy Server) running on the local device**, which rewrites the original stream on the fly. While casting is in progress, you must therefore:

- **Do not call `FlowerAdsManager.stop()`.** Stopping the SDK shuts down the Proxy Server, so ad replacement halts on the remote screen and playback may fail.
- **Keep the SDK running in the background** even when the app leaves the foreground, so that casting continues after the user navigates away from the app.

In other words, the SDK must stay active in the background **until the user explicitly stops casting**.
:::

## Example

```kotlin
private fun playLinearTv() {
    // TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
    val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        "https://XXX",
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

// TODO GUIDE: Use getScreenCastingUrl when sending the stream to another screen (e.g., TV)
fun startCastingToTv() {
    // Must be called after changeChannelUrl().
    // Returns the original stream URL on error, so it is always safe to use.
    val castingUrl = flowerAdView.adsManager.getScreenCastingUrl()

    castSession.loadMedia(castingUrl)
}
```

## When to Use

| Scenario | URL to Use |
| ---| --- |
| Local in-app playback | URL returned by `changeChannelUrl()` |
| Casting to an external screen (Chromecast, AirPlay receiver, Smart TV, etc.) | URL returned by `getScreenCastingUrl()` |
