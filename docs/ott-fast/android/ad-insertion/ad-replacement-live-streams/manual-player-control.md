---
sidebar_position: 2
---

# Manual Player Control

This guide provides a streamlined 3-step process for inserting ads into Linear TV channels and FAST streams using the Flower SDK.

Ad integration is simple and follows just three essential steps:
1. **Declare Ad UI** - Place `FlowerAdView` on the screen to display the ad.
2. **Change Original Channel URL** - Use changeChannelUrl() to provide the stream and ad tag URLs along with player and targeting info.
3. **Play the Updated URL** - Start playback using the returned URL so the SDK can detect ad markers and replace content accordingly.

Additional steps:
1. **To receive ad events** - Implement and set up the AdEventListener to handle ad-related callbacks.
2. **To stop channel playback** - Call the appropriate method to stop the currently playing channel. _This must be done to release resources properly if the channel is no longer in use._

## Step-by-Step Details

## 1. Declare Ad UI

> Please refer to the Ad Insertion menu > Declare the Ad UI menu for ad UI declaration.

## 2. Change Original Channel URL - call the Channel Switch API

> Since you’re simply replacing the original channel URL, the player can continue using its existing playback logic without any changes. The parameters passed to the SDK include either the player itself or an interface that can communicate with the player for ad tracking purposes, as well as additional information that can be used for ad targeting.

The SDK supports three types of players for ad tracking purposes.

Therefore, if you’re using a supported player, you can simply share its instance using the function below, allowing for easy integration with the SDK.

### FlowerAdsManager.changeChannelUrl(...)
#### Supported Players

*   ExoPlayer2
*   Media3 ExoPlayer
*   Bitmovin Player
These players pass the current player to the SDK by implementing the `MediaPlayerHook` interface. If you are using a player that is not officially supported, you can either contact the [Helpdesk](mailto:dev-support@anypointmedia.com).

#### Parameter Details

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | string | Original linear TV stream url. |
| adTagUrl | string | Ad tag URL issued by Flower backend system.<br/>You must file a request to Anypoint Media to receive a adTagUrl. |
| channelId | string | Unique channel ID.<br/>Must be registered in Flower backend system. |
| extraParams | map | (Optional) Additional information pre-agreed for targeting. |
| mediaPlayerHook | MediaPlayerHook | Interface implementation object that returns video player. |
| adTagHeaders | map | (Optional) HTTP header information to add for ad requests. |
| channelStreamHeaders | map | (Optional) HTTP header information to add for original stream requests. |
| prerollAdTagUrl | string | (Optional) Pre-roll ad tag URL issued by Flower backend system.<br/>You must file a request to Anypoint Media to receive a prerollAdTagUrl. |

If you implement the MediaPlayerAdapter interface to directly control the player, you can use the following overloaded functions instead.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | string | Original linear TV stream url. |
| adTagUrl | string | Ad tag URL issued by Flower backend system.<br/>You must file a request to Anypoint Media to receive a adTagUrl. |
| channelId | string | Unique channel ID.<br/>Must be registered in Flower backend system. |
| extraParams | map | (Optional) Additional information pre-agreed for targeting. |
| mediaPlayerAdapter | MediaPlayerAdapter | MediaPlayerAdapter interface implementation object<br/>For more details, refer to the [In case of direct player control](../implement-interface-video-player/direct-player-control) documentation. |
| adTagHeaders | map | (Optional) HTTP header information to add for ad requests. |
| channelStreamHeaders | map | (Optional) HTTP header information to add for original stream requests. |
| prerollAdTagUrl | string | (Optional) Pre-roll ad tag URL issued by Flower backend system.<br/>You must file a request to Anypoint Media to receive a prerollAdTagUrl. |

### FlowerAdsManager.changeChannelExtraParams()
Function used to change extraParams, the additional targeting information, during live broadcasts. The following describes the parameter:

#### Parameter Details

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| extraParams | map | Additional information pre-agreed for targeting. |

## 3. Play with the new stream URL returned by changeChannelUrl()

> This is the final step! You must start playback using the new stream URL returned by changeChannelUrl(), so that the SDK can detect ad markers and perform ad replacement.  

> Please verify that the ads are being properly replaced.

## Example for Steps 2 and 3 (excluding the UI declaration)

```kotlin
private fun playLinearTv() {
    // TODO GUIDE: change original LinearTV stream url by adView.adsManager.changeChannelUrl
    // arg0: videoUrl, original LinearTV stream url
    // arg1: adTagUrl, url from flower system
    //       You must file a request to Anypoint Media to receive a adTagUrl.
    // arg2: channelId, unique channel id in your service
    // arg3: extraParams, values you can provide for targeting
    // arg4: mediaPlayerHook, interface that provides currently playing segment information for ad tracking
    // arg5: adTagHeaders, (Optional) values included in headers for ad request
    // arg6: channelStreamHeaders, (Optional) values included in headers for channel stream request
    // arg7: prerollAdTagUrl, (Optional) ad tag URL for pre-roll ads
    val changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        "https://XXX",
        "https://ad_request",
        "100",
        mapOf("custom-param" to "custom-param-value"),
        mediaPlayerHook,
        mapOf("custom-ad-header" to "custom-ad-header-value"),
        mapOf("custom-stream-header" to "custom-stream-header-value"),
        "https://ad_request?target=preroll"
    )
    player.setMediaItem(MediaItem.fromUri(changedChannelUrl))
}
```

## Additional Step Details

## 1. To receive ad events - implement Ad Event Listener

> **When inserting ads into linear channels**, ads that replace the main stream are played through ad markers (e.g., SCTE-35). **UI control logic may be needed** at ad playback start/end points. For this, Flower SDK provides **a listener interface for receiving ad events**, which can be implemented as follows:

```kotlin
val adsManagerListener = object : FlowerAdsManagerListener {
    override fun onPrepare(adDurationMs: Int) {
        // TODO GUIDE: need nothing for linear tv
    }

    override fun onPlay() {
        // OPTIONAL GUIDE: enable additional actions for ad playback
        hidePlayerControls()
    }

    override fun onCompleted() {
        // OPTIONAL GUIDE: disable additional actions after ad complete
        showPlayerControls()
    }

    override fun onError(error: FlowerError?) {
        // TODO GUIDE: restart to play Linear TV on ad error
        releasePlayer()
        playLinearTv()
    }

    override fun onAdSkipped(reason: Int) {
        logger.info { "onAdSkipped: $reason" }
    }
}
flowerAdView.adsManager.addListener(adsManagerListener)
```

## 2. To stop channel playback - call FlowerAdsManager.stop()

API used to stop live broadcast. No parameters.
