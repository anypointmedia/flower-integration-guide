---
sidebar_position: 3
---

# Direct Ad Playback Control

Even when implementing channel replacement ads without utilizing the playlist manipulation features provided by the Flower SDK, you can still integrate ads by using the SDK's linear TV live channel ad request functionality. In this case, ad integration follows these steps:
1. **Inform Entering a Live Channel (`enterChannel`):** Pass information such as the ad tag URL and channel ID when starting stream playback.
2. **Request a Live Channel Ad (`requestChannelAd`):** Request information about ads that can be played in the current channel.
3. **Play the Ad:** When the SDK returns an ad list, play the ads according to the host application's logic.

## Step-by-Step Details

### 1. Inform Entering a Live Channel – `enterChannel`

#### FlowerAdsManager.enterChannel()

Notifies the SDK of live broadcast entry. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | Ad tag URL issued by the Flower backend system<br/>You must file a request to Anypoint Media to receive an adTagUrl. |
| contentId | string | Unique channel ID<br/>Must be registered in the Flower backend system |
| extraParams | map | (Optional) Additional pre-agreed information for targeting |
| mediaPlayerAdapter | MediaPlayerAdapter | MediaPlayerAdapter interface implementation object<br/>For more details, refer to the [Direct Player Control](../implement-interface-video-player/direct-player-control) documentation. |
| adTagHeaders | map | (Optional) HTTP header information to add when requesting ads |

#### Example

```kotlin
private fun playLinearTv() {
    // TODO GUIDE: Inform channel enter
    // arg0: adTagUrl, url from flower system
    //       You must file a request to Anypoint Media to receive an adTagUrl.
    // arg1: channelId, unique channel id in your service
    // arg2: extraParams, values you can provide for targeting
    // arg3: mediaPlayerAdapter, interface that provides methods to control playback,
    //       manage media items, and retrieve player state
    // arg4: adTagHeaders, (Optional) values included in headers for ad request
    flowerAdView.adsManager.enterChannel(
        "https://ad_request",
        "100",
        mapOf("custom-param" to "custom-param-value"),
        mediaPlayerAdapter,
        mapOf("custom-ad-header" to "custom-ad-header-value"),
    )
}
```

### 2. Request a Live Channel Ad – `requestChannelAd`

#### FlowerAdsManager.requestChannelAd()

Requests ads for the current live channel. This method returns a coroutine `Flow<FlowerAd>` that emits each ad sequentially as it becomes available. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| transactionId | Long | Unique cue event ID<br/>Must be different for each ad request |
| adDuration | Long | Requested ad duration in milliseconds |
| uniqueProgramId | Int | Unique program ID for the ad request<br/>Must be registered in the Flower backend system |
| timeout | Long | Ad request timeout in milliseconds<br/>**Important:** Must be set to the time difference between the current playback position and the point at which the ad marker occurs. |

**Return value:** `Flow<FlowerAd>` — a coroutine Flow that emits playable `FlowerAd` objects.

:::note Behavior
- If a request is made with the same `transactionId` as a previous request, the method returns `emptyFlow()`.
- If no ads are available or a timeout occurs, the Flow throws `FlowerError(message)`.
:::

#### FlowerAd

Represents an ad returned by the Flower SDK:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| id | String | Ad ID |
| duration | Long | Duration of the ad (ms) |
| creatives | List\<FlowerCreative\> | List of playable creative media |

#### FlowerCreative

Represents ad creative assets returned by the SDK:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| type | String | Media MIME type |
| width | Int | Media width (px) |
| height | Int | Media height (px) |
| url | String | Media URL |

#### Example

```kotlin
val transactionId = parseScte35EventId()
val cueDuration = 30000L // 30 seconds
val uniqueProgramId = 1 // Unique program ID for the cue
val timeout = 5000L // 5 seconds timeout for ad request

// TODO GUIDE: Request linear tv ad using Flow
// Returns Flow<FlowerAd> that emits each ad as it becomes available.
// Throws FlowerError if no ads are available or a timeout occurs.
// Returns emptyFlow() if a duplicate transactionId is used.
lifecycleScope.launch {
    try {
        flowerAdView.adsManager.requestChannelAd(
            transactionId,
            cueDuration,
            uniqueProgramId,
            timeout,
        ).collect { flowerAd ->
            Log.i("FlowerSDK Example", "Received ad: ${flowerAd.id}")
            playFlowerAd(flowerAd)
        }
    } catch (e: FlowerError) {
        Log.e("FlowerSDK Example", "Ad request failed: ${e.message}")
    }
}
```

### 3. Play the Ad

The returned ad list should be played replacing the original stream according to the ad marker (such as SCTE-35). When each `FlowerAd` is playing, the host application must call `FlowerAd.start()` with the `FlowerAdTracker` implementation to report to the ad server.

If the returned ad list is empty, it should be treated as a no-ad scenario due to reasons such as a timeout, and the original stream should continue playing during the ad marker.

If the ad list is not empty, the ad creatives should be played sequentially at the start of the ad marker in the original stream. The method of playing the ads may vary depending on the host application's logic.

## Ad Playback Time Detection – `MediaPlayerAdapter`

The SDK uses the `MediaPlayerAdapter` to detect ad playback time and handle ad interactions such as "more info", skip, and event tracking. Therefore, the implementation of the `MediaPlayerAdapter` passed to `enterChannel()` is critical for accurate ad behavior.

The following describes the implementation guidelines for each method:

| **Method** | **Return Type** | **Description** |
| ---| ---| --- |
| getCurrentMedia() | Media | Returns the URL, duration, and current playback position of the currently playing ad creative. **This is the most important method** — accurate values are required for ad tracking to work correctly. |
| getVolume() | KotlinWrapped\<Float\> | Returns the audio volume level (0.0–1.0) |
| isPlaying() | KotlinWrapped\<Boolean\> | Returns whether the player is currently playing |
| getHeight() | KotlinWrapped\<Int\> | Returns the video height in pixels (0 if unknown) |
| pause() | Unit | Pauses the playback |
| stop() | Unit | Stops the player and releases resources |
| resume() | Unit | Resumes the playback |
| enqueuePlayItem(playItem) | Unit | Queues the next play item |
| removePlayItem(playItem) | Unit | Removes a matching play item from the queue |
| playNextItem() | Unit | Plays the next item in the queue |
| seekToPosition(...) | Unit | Seeks to the specified position. No implementation is required for this approach. |
| getCurrentAbsoluteTime(isPrintDetails) | KotlinWrapped\<Double\> | Returns the current absolute playback time in ms. No implementation is required for this approach. |
| getPlayerType() | String? | Returns the player type identifier (for Google PAL SDK) |
| getPlayerVersion() | String? | Returns the player version string (for Google PAL SDK) |

:::tip Importance of getCurrentMedia()
`getCurrentMedia()` is the core method the SDK uses to track ad playback progress. The `urlOrId`, `duration`, and `position` values in the returned `Media` object must be accurate for ad skip, "more info", and event tracking to function correctly.
:::
