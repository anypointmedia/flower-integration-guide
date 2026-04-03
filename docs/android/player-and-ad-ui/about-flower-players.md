---
sidebar_position: 2
---

# About Flower Players

Flower SDK provides various Flower Players that are extended from popular media players, **designed to simplify ad insertion for live/linear ad marker or VOD contents**. Both classes maintain compatibility with original player classes and enable ad implementation with minimal changes.

Using these Flower players is more convenient than manually controlling ad insertion, as they simplify the integration process. You can also subclass these players for further customization. However, when overriding methods, **it is essential to call the superclass implementation** to ensure proper behavior.

The following is a basic usage of Flower Player.
1. Replace your existing player with the Flower Player.
    *   e.g., ExoPlayer2 → FlowerExoPlayer2
2. Create an ad configuration object with appropriate values including the pre-issued Tag URL. The class to use is:
    *   For Linear Channels / FAST: FlowerLinearTvAdConfig
    *   For VOD Contents: FlowerVodAdConfig
3. When loading the main content, pass the ad configuration object to the player at the last parameter.
    *   e.g., player.setMediaItem(mediaItem, flowerAdConfig) intead of player.setMediaItem(mediaItem)

    Note: This step is mandatory to enable ads.

4. If necessary, register an ad event listener with the player. The ad event listener can be created by implementing the FlowerAdsManagerListener interface.
5. Start playback.

## Supported players

*   [ExoPlayer(FlowerExoPlayer2)](../api/flower-exo-player2)
*   [Media3 ExoPlayer(FlowerMedia3ExoPlayer)](../api/flower-media3-exo-player)
*   [Bitmovin Player(FlowerBitmovinPlayer)](../api/flower-bitmovin-player)

## Example

The following is an example of setting up a Linear TV Ad configuration and playing content based on ExoPlayer.

```kotlin
val exoPlayer = ExoPlayer.Builder(context).build()
val player = FlowerExoPlayer2(exoPlayer, context)

val mediaItem = MediaItem.fromUri("https://video_url")
val adConfig = FlowerLinearTvAdConfig(
    adTagUrl = "https://ad_request",
    prerollAdTagUrl = "https://preroll_ad_request",
    channelId = "1",
    extraParams = mapOf(
        "title" to "My Summer Vacation",
        "genre" to "horror",
        "contentRating" to "PG-13"
    ),
    adTagHeaders = mapOf(
        "custom-ad-header" to "custom-ad-header-value"
    ),
    channelStreamHeaders = mapOf(
        "custom-stream-header" to "custom-stream-header-value"
    ),
)

player.setMediaItem(mediaItem, adConfig) // Overloaded method
player.prepare()
player.play()
```

## Related APIs

*   [FlowerAdConfig](../api/flower-ad-config)
*   [FlowerExoPlayer2](../api/flower-exo-player2)
*   [FlowerMedia3ExoPlayer](../api/flower-media3-exo-player)
*   [FlowerBitmovinPlayer](../api/flower-bitmovin-player)
*   [FlowerAdsManagerListener](../api/flower-ads-manager-listener)
