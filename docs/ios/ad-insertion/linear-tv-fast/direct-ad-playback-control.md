---
sidebar_position: 3
---

# Direct Ad Playback Control

Even when implementing channel replacement ads without utilizing the playlist manipulation features provided by the Flower SDK, you can still integrate ads by using the SDK's linear TV live channel ad request functionality. In this case, ad integration follows these steps:
1. **Inform Entering a Live Channel (`enterChannel`):** Pass information such as the ad tag URL and channel ID when starting stream playback, together with the adapter of the player that will play the ads.
2. **Request a Live Channel Ad (`requestChannelAd`):** Request information about ads that can be played in the current channel.
3. **Play the Ad:** When the SDK returns ads, play them on your own player according to the host application's logic and notify the SDK that the ad break started.

In this approach the host application owns **two players**: one for the channel content and one for the ad creatives. The SDK never drives the ad player — it only observes the player through the `MediaPlayerAdapter` you provide, so that it can follow ad progress and fire tracking beacons while your application controls playback.

:::note
Because this flow does not go through the SDK stream proxy, `changeChannelUrl()` is not used. The application plays the original channel URL directly, so any HTTP headers the stream requires must be attached to your own `AVURLAsset` request.
:::

## Step-by-Step Details

### 1. Inform Entering a Live Channel – `enterChannel`

#### FlowerAdsManager.enterChannel()

Notifies the SDK of live broadcast entry. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | String | Ad tag URL issued by the Flower backend system<br/>You must file a request to Anypoint Media to receive an adTagUrl. |
| channelId | String | Unique channel ID<br/>Must be registered in the Flower backend system |
| extraParams | \[String: String\] | (Optional) Additional pre-agreed information for targeting |
| platformMediaPlayerAdapter | MediaPlayerAdapter | `MediaPlayerAdapter` protocol implementation object for the **ad player**<br/>See [Ad Playback Time Detection](#ad-playback-time-detection--mediaplayeradapter) below. |
| adTagHeaders | \[String: String\] | (Optional) HTTP header information to add when requesting ads |

#### Example

```swift
private func playLinearTv() {
    flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)

    // TODO GUIDE: Inform channel enter
    // This overload takes the platform MediaPlayerAdapter of the player that will actually play
    // the ads, so the SDK can follow the ad progress and fire the tracking beacons while the
    // application drives playback.
    // arg0: adTagUrl, url from flower system
    //       You must file a request to Anypoint Media to receive an adTagUrl.
    // arg1: channelId, unique channel id in your service
    // arg2: extraParams, values you can provide for targeting
    // arg3: platformMediaPlayerAdapter, adapter of the ad player owned by the application
    // arg4: adTagHeaders, (Optional) values included in headers for ad request
    flowerAdView.adsManager.enterChannel(
        adTagUrl: "https://ad_request",
        channelId: "100",
        extraParams: ["custom-param": "custom-param-value"],
        platformMediaPlayerAdapter: adPlayerAdapter,
        adTagHeaders: ["custom-ad-header": "custom-ad-header-value"]
    )

    // The channel stream is played as it is: this flow does not go through the SDK proxy.
    // Because there is no proxy in between, headers the stream requires must be attached here.
    let streamHeaders = ["custom-stream-header": "custom-stream-header-value"]
    let asset = AVURLAsset(
        url: URL(string: "https://XXX")!,
        options: ["AVURLAssetHTTPHeaderFieldsKey": streamHeaders]
    )
    contentPlayer.replaceCurrentItem(with: AVPlayerItem(asset: asset))
    contentPlayer.play()
}
```

### 2. Request a Live Channel Ad – `requestChannelAd`

#### FlowerAdsManager.requestChannelAd()

Requests ads for the current live channel. On iOS, ads are delivered through the `onAd` / `onCompleted` closures — `onAd` is called once per responded ad, and `onCompleted` exactly once when the request finishes. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| transactionId | Int64 | Unique cue event ID<br/>Must be different for each ad request. The same ad break (cue) must keep one `transactionId`, so the SCTE-35 Splice Event ID is the recommended source. |
| cueDuration | Int64 | Requested ad duration in milliseconds |
| uniqueProgramId | Int32 | Unique program ID for the ad request<br/>Must be registered in the Flower backend system |
| timeout | Int64 | Ad request timeout in milliseconds<br/>**Important:** Must be set to the time difference between the current playback position and the point at which the ad marker occurs. |
| onAd | (FlowerAd) -> Void | Called once per responded ad |
| onCompleted | (String?) -> Void | Called exactly once when the request finishes: `nil` when ads were delivered, otherwise an error string |

**Return value:** `ChannelAdRequest` — a handle for the request. Call `cancel()` on it to stop further `onAd` / `onCompleted` callbacks, for example when the user leaves the channel view.

#### Error values passed to `onCompleted`

| **Value** | **Description** |
| ---| --- |
| nil | The request finished normally after delivering ads |
| "NO_AD" | No ad was returned for the requested break |
| "TIMEOUT" | The ad request did not complete within the requested timeout |
| "INTERNAL_ERROR" | The ad request failed, or the SDK was not in a state that allows requesting channel ads |

:::warning Callback thread
The callbacks are invoked on an **SDK worker thread**, not on the main thread. Hop to the main actor yourself before touching the player or any UI. Mark the closures `@Sendable` so that they do not inherit the main actor isolation of the enclosing view controller — otherwise Swift 6 traps the moment the SDK delivers an ad off the main thread.
:::

:::note Behavior
- If a request is made with the same `transactionId` as a previous request, no ad is requested and `onCompleted(nil)` is called immediately.
- If no ads are available or a timeout occurs, `onCompleted` is called with `"NO_AD"` or `"TIMEOUT"`, and the ad break must be skipped so that the content keeps playing.
:::

#### FlowerAd

Represents an ad returned by the Flower SDK:

| **Property** | **Type** | **Description** |
| ---| ---| --- |
| id | String | Ad ID |
| duration | Int64 | Duration of the ad (ms) |
| creatives | \[FlowerCreative\] | List of playable creative media |

#### FlowerCreative

Represents ad creative assets returned by the SDK:

| **Property** | **Type** | **Description** |
| ---| ---| --- |
| type | String | Media MIME type |
| width | Int32 | Media width (px) |
| height | Int32 | Media height (px) |
| url | String | Media URL |

#### Example

```swift
private var channelAdRequest: ChannelAdRequest?

private func requestAd() {
    let transactionId = parseScte35EventId()
    let cueDuration: Int64 = 30_000 // 30 seconds
    let uniqueProgramId: Int32 = 1 // Unique program ID for the cue
    let timeout: Int64 = 5_000 // 5 seconds timeout for ad request

    // Sampled on the main actor; the ad callback below runs off it and must not touch the views.
    let preferredHeight = Int32(adContainerView.bounds.height)

    // TODO GUIDE: Request linear tv ad.
    // The callbacks are invoked on an SDK worker thread, so they must NOT inherit the main actor
    // isolation of this view controller - `@Sendable` keeps them nonisolated. They pick the
    // creative right where they are and hand only Sendable values over to the main actor.
    channelAdRequest = flowerAdView.adsManager.requestChannelAd(
        transactionId: transactionId,
        cueDuration: cueDuration,
        uniqueProgramId: uniqueProgramId,
        timeout: timeout
    ) { @Sendable [weak self] ad in
        let adId = ad.id
        let creativeUrl = Self.bestFitCreativeUrl(of: ad, preferredHeight: preferredHeight)

        Task { @MainActor in
            self?.enqueue(adId: adId, creativeUrl: creativeUrl)
        }
    } onCompleted: { @Sendable [weak self] error in
        Task { @MainActor in
            self?.handleRequestCompleted(error: error)
        }
    }
}

/// Selects the best fit creative for the ad player height.
///
/// Only formats AVPlayer can play are considered, and the URL is returned exactly as it was
/// received: its tracking id query parameter is how the SDK recognizes the playing ad.
///
/// Runs on the SDK worker thread that delivered the ad, hence `nonisolated`.
private nonisolated static func bestFitCreativeUrl(of ad: FlowerAd, preferredHeight: Int32) -> String? {
    let playable = ad.creatives.filter {
        $0.url.contains(".m3u8") || $0.url.contains(".mp4")
    }
    let candidates = playable.isEmpty ? ad.creatives : playable
    return candidates
        .min { abs($0.height - preferredHeight) < abs($1.height - preferredHeight) }?
        .url
}
```

### 3. Play the Ad

The returned ads should be played replacing the original stream according to the ad marker (such as SCTE-35). The method of playing the ads may vary depending on the host application's logic, but the following rules must be observed:

- **Use the creative URL exactly as it was received.** Its tracking id query parameter is how the SDK recognizes the playing ad. Do not normalize, re-sign, or strip query parameters from it.
- **Call `adsManager.play()` when the ad break playback starts** so that the SDK knows the break began and can start reporting.
- **Show `FlowerAdView` while the break is playing** (`adView.show()`) so that ad interactions such as "more info" and skip can be rendered, and hide it when the break is over (`adView.hide()`).
- **Ads of the same break may keep arriving while the break is already playing.** Start the break once the first ad is available and keep appending later ads to the player queue.
- **If no ad is returned** (`"NO_AD"` / `"TIMEOUT"` / `"INTERNAL_ERROR"`), treat it as a no-ad scenario and keep playing the original stream during the ad marker.

#### Example

```swift
private func enqueue(adId: String, creativeUrl: String?) {
    guard let creativeUrl = creativeUrl, let url = URL(string: creativeUrl) else { return }

    receivedCreativeUrls.append(creativeUrl)
    let item = AVPlayerItem(url: url)
    // The adapter reports this URL back to the SDK as the playing media.
    adPlayerAdapter.register(item: item, url: creativeUrl)
    adPlayer.insert(item, after: nil)

    // TODO GUIDE: Start the break a moment after the first ad arrived. Later ads of the same
    // break keep filling the queue while it is already playing.
    guard !isAdBreakScheduled else { return }
    isAdBreakScheduled = true
    DispatchQueue.main.asyncAfter(deadline: .now() + adPlaybackDelay) { [weak self] in
        self?.startAdBreak()
    }
}

private func handleRequestCompleted(error: String?) {
    channelAdRequest = nil

    guard let error = error else { return }

    // NO_AD / TIMEOUT / INTERNAL_ERROR - the break is skipped and the content keeps playing.
    os_log(OSLogType.info, log: .default, "ad request failed: %@", error)
    finishAdBreak()
}

private func startAdBreak() {
    guard !receivedCreativeUrls.isEmpty else { return }

    isAdBreakPlaying = true
    adContainerView.isHidden = false
    flowerAdView.show()
    contentPlayer.volume = 0.0
    adPlayer.play()

    // TODO GUIDE: Notify the SDK that the ad break playback started.
    flowerAdView.adsManager.play()
}

private func finishAdBreak() {
    isAdBreakPlaying = false
    isAdBreakScheduled = false
    adPlayer.pause()
    adPlayer.removeAllItems()
    adPlayerAdapter.forgetItems()
    adContainerView.isHidden = true
    flowerAdView.hide()
    contentPlayer.volume = 1.0
    receivedCreativeUrls.removeAll()
}
```

The end of the ad break can be detected either from your own player — the `AVQueuePlayer` queue drains to `nil` when the last ad finished — or from the SDK through `FlowerAdsManagerListener`:

```swift
// TODO GUIDE: Implement FlowerAdsManagerListener
// The view controller is @MainActor (UIViewController), while the SDK protocol is nonisolated
// and delivers callbacks on a background dispatcher. Each method is declared nonisolated and
// hops to the main actor before touching any view or player state.
extension PlaybackViewController: FlowerAdsManagerListener {
    nonisolated func onPrepare(adDurationMs: Int32) {}

    nonisolated func onPlay() {}

    nonisolated func onCompleted() {
        Task { @MainActor in
            self.finishAdBreak()
        }
    }

    nonisolated func onError(error: FlowerError?) {
        Task { @MainActor in
            self.finishAdBreak()
        }
    }

    nonisolated func onAdBreakSkipped(reason: Int32) {
        Task { @MainActor in
            self.finishAdBreak()
        }
    }
}
```

### 4. Leaving the Channel

When leaving the channel view, cancel any open ad request and stop the SDK:

```swift
override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)

    // TODO GUIDE: Cancelling the handle stops the ad callbacks for a request that is still open.
    channelAdRequest?.cancel()
    channelAdRequest = nil

    // TODO GUIDE: Stop Flower SDK
    flowerAdView.adsManager.removeListener(adsManagerListener: adsManagerListener)
    flowerAdView.adsManager.stop()

    adPlayer.pause()
    adPlayer.removeAllItems()
    contentPlayer.pause()
    contentPlayer.replaceCurrentItem(with: nil)
}
```

## Ad Playback Time Detection – `MediaPlayerAdapter`

The SDK uses the `MediaPlayerAdapter` to detect ad playback time and handle ad interactions such as "more info", skip, and event tracking. Therefore, the implementation of the `MediaPlayerAdapter` passed to `enterChannel()` is critical for accurate ad behavior.

In this flow the SDK never drives the ad player: it only polls `isPlaying()` and `getCurrentMedia()` to follow ad progress. The following describes the implementation guidelines for each method:

| **Method** | **Return Type** | **Description** |
| ---| ---| --- |
| getCurrentMedia() | Media | Returns the URL, duration (ms), and current playback position (ms) of the currently playing ad creative. The `position` is measured **per ad**: it must start at 0 when each ad creative begins and count up only to that creative's own duration. It must never be a cumulative time across the ads of the break or across the channel. **This is the most important method** — accurate values are required for ad tracking to work correctly. |
| getVolume() | Float | Returns the audio volume level (0.0–1.0) |
| isPlaying() | Bool | Returns whether the player is currently playing |
| getHeight() | Int32 | Returns the video height in pixels (0 if unknown) |
| pause() | Void | Pauses the playback |
| stop() | Void | Stops the player and releases resources |
| resume() | Void | Resumes the playback |
| enqueuePlayItem(playItem:) | Void | Queues the next play item. No implementation is required for this approach, because the application enqueues the creatives itself. |
| removePlayItem(playItem:) | Void | Removes a matching play item from the queue. No implementation is required for this approach. |
| playNextItem() | Void | Plays the next item in the queue |
| seekToPosition(...) | Void | Seeks to the specified position. No implementation is required for this approach. |
| getCurrentAbsoluteTime(isPrintDetails:) | Double | Returns the current absolute playback time in ms. Ad creatives carry no `EXT-X-PROGRAM-DATE-TIME`, so return `-1.0` for this approach. |
| getPlayerType() | String? | Returns an identifier for the player implementation. The SDK uses it to apply player specific behavior and includes it in ad requests. |
| getPlayerVersion() | String? | Returns the player version string. The SDK includes it in ad requests. |

:::tip Importance of getCurrentMedia()
`getCurrentMedia()` is the core method the SDK uses to track ad playback progress. The `urlOrId`, `duration`, and `position` values in the returned `Media` object must be accurate for ad skip, "more info", and event tracking to function correctly.

- `urlOrId` must be the creative URL **exactly as it was received** from `requestChannelAd`.
- `duration` must be the duration of the currently playing ad creative, not the total duration of the break.
- `position` must be the elapsed playback time **of the currently playing ad only, starting from 0**. When the next ad in the break starts, it goes back to 0. The SDK derives the ad quartile events (start, 25%, 50%, 75%, complete) from this value, so a cumulative position makes the tracking fire at the wrong times.

`AVQueuePlayer.currentTime()` already reports the position within the current item, so it satisfies this requirement as long as each creative is enqueued as its own `AVPlayerItem`.
:::

:::warning Polling thread
Those polls arrive on an SDK worker thread, where `AVPlayerItem.asset` must not be read (it is main actor only). Register the creative URL of every item you enqueue and resolve the playing ad from that lock protected map instead of asking the item for its asset.
:::

### Example

```swift
// TODO GUIDE: Platform MediaPlayerAdapter for the application owned ad player.
class DirectAdPlayerAdapter: NSObject, MediaPlayerAdapter, @unchecked Sendable {
    private let player: AVQueuePlayer
    private let lock = NSLock()
    private var urlByItem: [ObjectIdentifier: String] = [:]

    init(player: AVQueuePlayer) {
        self.player = player
        super.init()
    }

    /// Records which creative URL an enqueued item was built from.
    func register(item: AVPlayerItem, url: String) {
        lock.lock()
        urlByItem[ObjectIdentifier(item)] = url
        lock.unlock()
    }

    /// Drops the recorded items, e.g. once the ad break is over.
    func forgetItems() {
        lock.lock()
        urlByItem.removeAll()
        lock.unlock()
    }

    private func url(of item: AVPlayerItem) -> String {
        lock.lock()
        defer { lock.unlock() }
        return urlByItem[ObjectIdentifier(item)] ?? ""
    }

    func getCurrentMedia() throws -> Media {
        guard let item = player.currentItem else {
            return Media(urlOrId: "", duration: -1.0, position: -1.0)
        }

        let durationMs = CMTimeGetSeconds(item.duration) * 1000
        let positionMs = CMTimeGetSeconds(player.currentTime()) * 1000

        return Media(
            urlOrId: url(of: item),
            duration: durationMs.isFinite ? durationMs : -1.0,
            position: positionMs.isFinite ? positionMs : -1.0
        )
    }

    func getVolume() throws -> Float {
        player.volume
    }

    func isPlaying() throws -> Bool {
        player.rate != 0.0
    }

    func getHeight() throws -> Int32 {
        Int32(player.currentItem?.presentationSize.height ?? 0)
    }

    func pause() throws {
        player.pause()
    }

    func stop() throws {
        player.pause()
        player.removeAllItems()
    }

    func resume() throws {
        player.play()
    }

    // The application enqueues the creatives returned by requestChannelAd itself, so the SDK side
    // queue manipulation is not used in this flow.
    func enqueuePlayItem(playItem: PlayItem) throws {}

    func removePlayItem(playItem: PlayItem) throws {}

    func playNextItem() throws {
        player.advanceToNextItem()
    }

    func seekToPosition(absoluteStartTimeMs: Double?, relativeStartTimeMs: Double?, offsetMs: Double?, windowDurationMs: Double?, periodIndex: Int32?) throws {}

    // Ad creatives carry no EXT-X-PROGRAM-DATE-TIME. The direct play flow derives its clock from
    // getCurrentMedia() instead, so there is no absolute time to report.
    func getCurrentAbsoluteTime(isPrintDetails: Bool) throws -> Double {
        -1.0
    }

    func getPlayerType() -> String? {
        "AVQueuePlayer"
    }

    func getPlayerVersion() -> String? {
        nil
    }
}
```
