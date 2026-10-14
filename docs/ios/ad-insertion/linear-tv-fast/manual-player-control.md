---
sidebar_position: 2
---

# Manual Player Control

This guide walks you through the complete process of inserting ads into linear TV channels and FAST streams using the Flower SDK. Ad integration follows these steps:
1. **Declare the Ad UI:** Place `FlowerAdView` on the screen to display the ad.
2. **Implement Ad Event Reception:** Implement `FlowerAdsManagerListener` to handle logic at ad playback and completion points.
3. **Pass the Player:** Implement `MediaPlayerHook` to pass player information so the SDK can recognize content playback status.
4. **Configure Additional Parameters (`extraParams`):** Set up additional information required for ad targeting.
5. **Change Linear Channel URL (`changeChannelUrl`):** Change the stream URL by passing information such as ad tag URL and channel ID.
6. **Update Parameters During Playback:** Update targeting information through `changeChannelExtraParams()` during stream playback.

## Step-by-Step Details

### 1. Declare the Ad UI

> Please refer to the Ad Insertion menu > Declare the Ad UI section for ad UI declaration.

### 2. Receiving Ad Events – `FlowerAdsManagerListener`

> **When inserting ads into linear channels**, ads that replace the main stream are played through ad markers (e.g., SCTE-35). **UI control and other logic may be needed** at ad playback start/end points. For this purpose, the Flower SDK provides **a listener interface for receiving ad events**, which can be implemented as follows.

```swift
class FlowerAdsManagerListenerImpl: FlowerAdsManagerListener {
    func onPrepare(adDurationMs: Int32) {
        // TODO GUIDE: need nothing for linear tv
    }

    func onPlay() {
        // OPTIONAL GUIDE: enable additional actions for ad playback
        hidePlayerControls()
    }

    func onCompleted() {
        // OPTIONAL GUIDE: disable additional actions after ad complete
        showPlayerControls()
    }

    func onError(error: FlowerError?) {
        // TODO GUIDE: on an ad error, stop the ads manager and restart the channel
        //             (see restartLinearTvAfterError() below).
        //             The SDK calls this off the main thread, so hop to main first.
        DispatchQueue.main.async {
            restartLinearTvAfterError()
        }
    }

    func onAdBreakSkipped(reason: Int32) {
        os_log(OSLogType.info, log: .default, "onAdBreakSkipped: %d", reason)
    }
}
flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
```

:::note Restarting the channel on `onError`
When `onError` is called, stop the ads manager with `adsManager.stop()`, release the content player item, and start the channel again the same way it was first started: a new `changeChannelUrl(...)` with exactly the same parameters as the first start, including `prerollAdTagUrl`, and the returned URL handled the same way (held until `onCompleted` if a pre-roll URL was passed). The SDK skips the pre-roll of the channel entered last and reports `onCompleted` right after `changeChannelUrl()` returns, so the viewer does not see the pre-roll again and the held URL starts playing right away. The URL returned by `changeChannelUrl()` goes through the SDK stream proxy, which `stop()` shuts down, so do not reuse the old URL. The SDK calls the listener off the main thread, so hop to the main thread before touching the player. A break cut short by `stop()` may still report `onCompleted` afterwards, so keep `onCompleted` limited to UI work that is safe to run more than once. See `restartLinearTvAfterError()` in the [example below](#linear-channel-ad-request-example).

`onError` is also called once per incident when the channel stream stops and the SDK gives up after 3 recovery attempts, with the message `playback unrecoverable after 3 recovery attempts (<trigger>) - url: <url>`. Restart the channel in the same way, ideally with a fresh channel URL.
:::

### 3. Passing the Player – `MediaPlayerHook`

> For linear channels, you must pass the player that plays the main content to the SDK.

#### Supported Players

*   AVPlayer
*   AVQueuePlayer

These players pass the current player to the SDK by implementing the `MediaPlayerHook` interface.

#### When Using Unsupported Players

If you are using an unsupported player, please contact [Helpdesk](mailto:dev-support@anypointmedia.com).

### 4. Additional Parameters for Ad Requests – `extraParams`

> When requesting ads using the Flower SDK, passing additional parameters helps the SDK provide the most suitable ads. For mobile apps, since the SDK cannot determine the ad serving context on its own, these parameters must be passed to the SDK when requesting ads.

#### Parameter List

| Key<br/>(\* indicates mobile app required) | Value | Example |
| ---| ---| --- |
| serviceId\* | App bundle identifier | "tv.anypoint.service" |
| os\* | OS of the device running the app | "iOS" |
| adId\* | Ad identifier of the device running the app | iOS: Apple's IDFA value |

### 5. Linear Channel Ad API Call – `changeChannelUrl(...)`

#### FlowerAdsManager.changeChannelUrl()

Function used to change the stream URL for live broadcasts. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | String | Original playback URL |
| adTagUrl | String | Ad tag URL issued by the ad server |
| channelId | String | Unique channel ID<br/>Must be registered in the Flower backend system |
| extraParams | \[String: String\] | Additional pre-agreed information for targeting (_nil_ if none) |
| mediaPlayerHook | MediaPlayerHook | Interface implementation object that returns the video player |
| adTagHeaders | \[String: String\] | (Optional) HTTP header information to add when requesting ads |
| channelStreamHeaders | \[String: String\] | (Optional) HTTP header information to add when requesting the original stream |
| prerollAdTagUrl | String | (Optional) Ad tag URL issued by the ad server for pre-roll. See [Pre-roll Ads](#pre-roll-ads). |

#### FlowerAdsManager.changeChannelExtraParams()

Function used to change extraParams, the additional targeting information, during live broadcasts. The following describes the parameter:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| extraParams | \[String: String\] | Additional pre-agreed information for targeting |

#### FlowerAdsManager.stop()

API used to stop live broadcasts. No parameters.

## Pre-roll Ads

A channel pre-roll is an ad that plays once when the viewer enters a channel, before the live stream starts. Unlike the ad breaks marked in the stream, it is requested from its own ad tag and played by the SDK in its own ad player, shown in `FlowerAdView` over the player.

### Enabling the Pre-roll

Pass the pre-roll ad tag URL as `prerollAdTagUrl` of `changeChannelUrl(...)`. To start a channel without a pre-roll, pass `nil`. When you use `FlowerAVPlayer`, set `FlowerLinearTvAdConfig.prerollAdTagUrl` instead; the player then handles the whole flow below by itself (see [Using Extended AVPlayer](./using-extended-avplayer#pre-roll-ads)).

### Playback Flow

`changeChannelUrl()` returns the stream URL right away and requests the pre-roll in the background. The playback start depends on whether `prerollAdTagUrl` is set.

- **If `prerollAdTagUrl` is not set:** Set the returned URL on the player and call `player.play()` directly to start content playback.
- **If `prerollAdTagUrl` is set:** Hold the stream. Keep the returned URL, but do not set it on the player yet.
  1. Remove the existing `FlowerAdsManagerListener` and register a temporary pre-roll listener.
  2. When the pre-roll is ready, the SDK plays it and calls `onPrepare` and `onPlay` on the registered listeners.
  3. When the pre-roll ends, the SDK calls `onCompleted`. On the first `onCompleted` (or `onError`) of the temporary listener, hop to the main thread, set the stored URL on the player and start playback, then remove the temporary listener and re-register the original listener.

Holding the stream prevents the main content from briefly flashing on screen before the pre-roll starts, and avoids loading the ad and the main content at the same time.

### When There Is No Pre-roll or It Fails

If the response has no pre-roll ad, the ad request fails, or the pre-roll cannot be played, the SDK ends the pre-roll and calls `onCompleted`, so the channel still starts. Handle `onError` of the temporary listener in the same way: load the stored URL and swap the listeners back. Do not restart the channel there, because the channel stream has not started yet.

### Channel Switch, Restart and PIP

- **Channel switch:** The pre-roll applies whenever a channel starts, including when the user switches to another channel. Each `changeChannelUrl(...)` call first stops the previous session, including a pre-roll that is still playing, and requests the new channel's pre-roll. A pre-roll stopped this way, or by `stop()`, does not call the temporary listener, so the listener would stay registered and load the previous channel's URL when the next pre-roll ends. Before the next `changeChannelUrl(...)` and before `stop()`, remove a pending temporary listener and restore the original listener (`cancelPendingPreroll()` in the example below).
- **Restart after `onError`:** Call `changeChannelUrl(...)` again with exactly the same parameters as the first start, including `prerollAdTagUrl`, and handle the returned URL the same way. The SDK remembers the channel (`channelId`) entered last by `changeChannelUrl(...)` or `enterChannel(...)`. When `changeChannelUrl(...)` is called with that same `channelId`, the SDK skips the pre-roll even though `prerollAdTagUrl` is passed, and calls `onCompleted` right after `changeChannelUrl()` returns, in the same way as a pre-roll with no ad. The temporary listener then loads the held URL as on the first start, and the viewer does not see the pre-roll again. In the example below, `restartLinearTvAfterError()` simply calls `playLinearTv()` again.
- **Which entries skip the pre-roll:** `stop()` does not clear the remembered channel; `requestVodAd(...)` and `requestAd(...)` do. So A → B → A plays A's pre-roll again, A → (`onError`) `stop()` → A skips it, and going to VOD or inline ads and back to A plays it again. The remembered channel is shared by the whole SDK, so leaving the player screen and returning to the same channel with no other channel or ad request in between also skips the pre-roll.
- **User leaving the app:** In the default mode (`FlowerSdk.setIgnoreAdBreakInPIPMode(true)`), a pre-roll that is playing when the user leaves the app (`FlowerSdk.notifyUserLeftApp(true)`) is paused and resumes when the user comes back, in the same way as VOD ads. See [PIP Mode Support](../../getting-started/pip-mode-support).

## Linear Channel Ad Request Example

```swift
private func playLinearTv() {
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
    // (Optional) Set to nil if pre-roll ads are not needed
    // Pass it on a restart too: the SDK skips the pre-roll of the channel entered last.
    let prerollAdTagUrl: String? = "https://ad_request?target=preroll"

    // A channel switch during a pre-roll: drop the previous channel's temporary listener first.
    // changeChannelUrl() stops that pre-roll without calling it, so it would otherwise stay
    // registered and load the previous channel's URL when the next pre-roll ends.
    cancelPendingPreroll()

    let changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
        videoUrl: "https://XXX",
        adTagUrl: "https://ad_request",
        channelId: "100",
        extraParams: ["custom-param": "custom-param-value"],
        mediaPlayerHook: mediaPlayerHook,
        adTagHeaders: ["custom-ad-header": "custom-ad-header-value"],
        channelStreamHeaders: ["custom-stream-header": "custom-stream-header-value"],
        prerollAdTagUrl: prerollAdTagUrl
    )
    if prerollAdTagUrl == nil {
        // If prerollAdTagUrl is not set, set the returned URL directly and start playback.
        player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: changedChannelUrl)!))
        player.play()
    } else {
        // If prerollAdTagUrl is set, remove the existing listener and register a temporary one.
        // Set the stream URL and start playback after the pre-roll ad completes (onCompleted).
        flowerAdView.adsManager.removeListener(adsManagerListener: adsManagerListener)

        let listener = PrerollAdsManagerListener(
            onCompletedHandler: { [weak self] listener in
                guard let self = self, prerollListener === listener else { return }
                prerollListener = nil
                // Set stream URL and start playback after pre-roll ad completes
                player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: changedChannelUrl)!))
                player.play()

                // Remove temporary listener and restore the original listener
                flowerAdView.adsManager.removeListener(adsManagerListener: listener)
                flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
            },
            onErrorHandler: { [weak self] listener, _ in
                guard let self = self, prerollListener === listener else { return }
                prerollListener = nil
                // Start stream playback and restore listener even on pre-roll ad error.
                // No stop() is needed here: the channel stream has not started yet.
                player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: changedChannelUrl)!))
                player.play()

                flowerAdView.adsManager.removeListener(adsManagerListener: listener)
                flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
            }
        )
        prerollListener = listener
        flowerAdView.adsManager.addListener(adsManagerListener: listener)
    }
}

// The temporary pre-roll listener of the current channel, while its pre-roll has not ended.
private var prerollListener: PrerollAdsManagerListener?

// TODO GUIDE: call before the next changeChannelUrl() and before adsManager.stop()
private func cancelPendingPreroll() {
    guard let listener = prerollListener else { return }
    prerollListener = nil
    // Remove the temporary listener and restore the original listener.
    flowerAdView.adsManager.removeListener(adsManagerListener: listener)
    flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
}

// TODO GUIDE: restart the channel after an ad error (called on the main thread from onError)
private var errorRestartCount = 0

private func restartLinearTvAfterError() {
    // Simple retry limit so that a channel that keeps failing is not restarted forever.
    // Reset errorRestartCount when the user changes the channel.
    guard errorRestartCount < 3 else { return }
    errorRestartCount += 1

    // 1. Stop the ads manager first. This also shuts down the SDK stream proxy that
    //    the current stream URL points at.
    cancelPendingPreroll()
    flowerAdView.adsManager.stop()

    // 2. Release the content item that was playing the URL returned by changeChannelUrl().
    player.pause()
    player.replaceCurrentItem(with: nil)

    // 3. Start the channel again the same way it was first started:
    //    a new changeChannelUrl(...) with the same parameters, including prerollAdTagUrl.
    //    The SDK skips the pre-roll of the channel entered last and calls onCompleted,
    //    so the temporary listener loads the new URL right away.
    playLinearTv()
}

// TODO GUIDE: change extraParams during stream playback
func onStreamProgramChanged(targetingInfo: String) {
    flowerAdView.adsManager.changeChannelExtraParams(extraParams: ["myTargetingKey": targetingInfo])
}

// Temporary listener for pre-roll ad completion.
// The SDK calls it off the main thread, so it hops to the main thread
// and acts only on the first onCompleted/onError.
class PrerollAdsManagerListener: FlowerAdsManagerListener {
    private let onCompletedHandler: (PrerollAdsManagerListener) -> Void
    private let onErrorHandler: (PrerollAdsManagerListener, FlowerError?) -> Void
    private var isFinished = false

    init(
        onCompletedHandler: @escaping (PrerollAdsManagerListener) -> Void,
        onErrorHandler: @escaping (PrerollAdsManagerListener, FlowerError?) -> Void
    ) {
        self.onCompletedHandler = onCompletedHandler
        self.onErrorHandler = onErrorHandler
    }

    func onPrepare(adDurationMs: Int32) {}
    func onPlay() {}
    func onCompleted() {
        DispatchQueue.main.async {
            guard !self.isFinished else { return }
            self.isFinished = true
            self.onCompletedHandler(self)
        }
    }
    func onError(error: FlowerError?) {
        DispatchQueue.main.async {
            guard !self.isFinished else { return }
            self.isFinished = true
            self.onErrorHandler(self, error)
        }
    }
    func onAdBreakSkipped(reason: Int32) {}
    func onAdBreakPrepare(adInfos: NSMutableArray) {}
    func onAdPlay(adInfo: AdInfo) {}
    func onAdUserAction(action: String, adInfo: AdInfo) {}
}
```

## Using MediaPlayerAdapter

If you are using a player that is not officially supported by the SDK, you can implement the `MediaPlayerAdapter` protocol to directly control the player.

Instead of passing a `MediaPlayerHook`, you pass a `MediaPlayerAdapter` implementation to the `changeChannelUrl()` overload.

### FlowerAdsManager.changeChannelUrl(...) with MediaPlayerAdapter

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| videoUrl | String | Original playback URL |
| adTagUrl | String | Ad tag URL issued by the ad server |
| channelId | String | Unique channel ID<br/>Must be registered in the Flower backend system |
| extraParams | \[String: String\] | Additional pre-agreed information for targeting (_nil_ if none) |
| mediaPlayerAdapter | MediaPlayerAdapter | MediaPlayerAdapter protocol implementation object |
| adTagHeaders | \[String: String\] | (Optional) HTTP header information to add when requesting ads |
| channelStreamHeaders | \[String: String\] | (Optional) HTTP header information to add when requesting the original stream |
| prerollAdTagUrl | String | (Optional) Ad tag URL issued by the ad server for pre-roll |

:::note Pre-roll with a MediaPlayerAdapter
The pre-roll works the same way as with `MediaPlayerHook`: hold the returned URL and load it when the pre-roll ends (see [Pre-roll Ads](#pre-roll-ads)). The SDK calls the adapter's `pause()` when the pre-roll is ready and `resume()` when it ends, so both must be safe to call while the channel URL is not loaded yet.
:::

### MediaPlayerAdapter Protocol

The `MediaPlayerAdapter` protocol requires the following methods:

| **Method** | **Return Type** | **Description** |
| ---| ---| --- |
| getCurrentMedia() | Media | Returns the currently playing media (URL, duration, position) |
| getVolume() | Float | Returns the audio volume level (0.0–1.0) |
| isPlaying() | Bool | Returns whether the player is currently playing |
| getHeight() | Int32 | Returns the video height in pixels (0 if unknown) |
| pause() | Void | Pauses the playback |
| stop() | Void | Stops the playback and releases resources |
| resume() | Void | Resumes the playback |
| enqueuePlayItem(playItem:) | Void | Queues a new play item |
| removePlayItem(playItem:) | Void | Removes a queued play item |
| playNextItem() | Void | Seeks to the next media item in the queue |
| seekToPosition(...) | Void | Seeks to the specified position |
| getCurrentAbsoluteTime(isPrintDetails:) | Double | Returns the current absolute playback time in ms |

### Example

```swift
class MyPlayerAdapter: MediaPlayerAdapter {
    private let player: MyCustomPlayer

    init(player: MyCustomPlayer) {
        self.player = player
    }

    func getCurrentMedia() throws -> Media {
        return Media(
            urlOrId: player.currentUrl ?? "",
            duration: Int32(player.duration * 1000),
            position: Int32(player.currentTime * 1000)
        )
    }

    func getVolume() throws -> Float {
        return player.volume
    }

    func isPlaying() throws -> Bool {
        return player.isPlaying
    }

    func getHeight() throws -> Int32 {
        return Int32(player.videoHeight)
    }

    func pause() throws {
        player.pause()
    }

    func stop() throws {
        player.stop()
    }

    func resume() throws {
        player.play()
    }

    func enqueuePlayItem(playItem: PlayItem) throws {
        player.enqueue(url: playItem.url)
    }

    func removePlayItem(playItem: PlayItem) throws {
        player.removeFromQueue(url: playItem.url)
    }

    func playNextItem() throws {
        player.skipToNext()
    }

    func seekToPosition(absoluteStartTimeMs: Double?, relativeStartTimeMs: Double?, offsetMs: Double?, windowDurationMs: Double?, periodIndex: Int32?) throws {
        if let offset = offsetMs {
            player.seek(to: offset / 1000.0)
        }
    }

    func getCurrentAbsoluteTime(isPrintDetails: Bool) throws -> Double {
        return player.currentTime * 1000.0
    }
}

// Usage
let adapter = MyPlayerAdapter(player: myCustomPlayer)
let changedChannelUrl = flowerAdView.adsManager.changeChannelUrl(
    videoUrl: "https://XXX",
    adTagUrl: "https://ad_request",
    channelId: "100",
    extraParams: nil,
    mediaPlayerAdapter: adapter,
    adTagHeaders: nil,
    channelStreamHeaders: nil,
    prerollAdTagUrl: nil
)
```
