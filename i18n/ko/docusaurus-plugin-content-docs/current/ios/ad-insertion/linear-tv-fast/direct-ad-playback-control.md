---
sidebar_position: 3
---

# 광고 재생 직접 제어

Flower SDK가 제공하는 플레이리스트 매니퓰레이션 기능을 사용하지 않고 채널 대체 광고를 직접 구현하는 경우에도, SDK의 실시간 TV 라이브 채널 광고 요청 기능을 활용하여 광고를 연동할 수 있습니다. 이 경우 광고 연동은 다음 단계를 따릅니다:
1. **라이브 채널 진입 알림 (`enterChannel`):** 스트림 재생을 시작할 때 광고 태그 URL, 채널 ID 등의 정보와 함께 광고를 재생할 플레이어의 어댑터를 전달합니다.
2. **라이브 채널 광고 요청 (`requestChannelAd`):** 현재 채널에서 재생할 수 있는 광고 정보를 요청합니다.
3. **광고 재생:** SDK가 광고를 반환하면 호스트 앱의 로직에 따라 앱이 소유한 플레이어로 광고를 재생하고, 광고 브레이크가 시작되었음을 SDK에 알립니다.

이 방식에서 호스트 앱은 **두 개의 플레이어**를 소유합니다. 하나는 채널 콘텐츠용이고, 다른 하나는 광고 소재용입니다. SDK는 광고 플레이어를 직접 제어하지 않으며, 앱이 전달한 `MediaPlayerAdapter`를 통해 플레이어 상태만 관찰합니다. 즉 재생 제어는 앱이 담당하고, SDK는 광고 진행 상태를 파악하여 트래킹 비콘을 전송합니다.

:::note
이 방식은 SDK 스트림 프록시를 경유하지 않으므로 `changeChannelUrl()`을 사용하지 않습니다. 앱이 원본 채널 URL을 직접 재생하기 때문에, 스트림에 필요한 HTTP 헤더는 앱이 생성하는 `AVURLAsset` 요청에 직접 추가해야 합니다.
:::

## 단계별 상세 설명

### 1. 라이브 채널 진입 알림 -- `enterChannel`

#### FlowerAdsManager.enterChannel()

SDK에 실시간 방송 진입을 알리는 함수입니다. 다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | String | Flower 백엔드 시스템에서 발급된 광고 태그 URL<br/>Anypoint Media에 요청하여 adTagUrl을 발급받아야 합니다. |
| channelId | String | 고유 채널 ID<br/>Flower 백엔드 시스템에 등록되어야 함 |
| extraParams | \[String: String\] | (Optional) 타겟팅을 위해 사전 협의된 추가 정보 |
| platformMediaPlayerAdapter | MediaPlayerAdapter | **광고 플레이어**의 `MediaPlayerAdapter` 프로토콜 구현 객체<br/>자세한 내용은 아래 [광고 재생 시간 감지](#광고-재생-시간-감지----mediaplayeradapter) 항목을 참고하세요. |
| adTagHeaders | \[String: String\] | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |

#### 예시

```swift
private func playLinearTv() {
    flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)

    // TODO GUIDE: Inform channel enter
    // 이 오버로드는 실제로 광고를 재생할 플레이어의 platform MediaPlayerAdapter를 전달받습니다.
    // 이를 통해 앱이 재생을 제어하는 동안에도 SDK가 광고 진행 상태를 파악하여 트래킹 비콘을
    // 전송할 수 있습니다.
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

    // 채널 스트림은 그대로 재생됩니다. 이 방식은 SDK 프록시를 경유하지 않기 때문에,
    // 스트림에 필요한 헤더는 여기에서 직접 추가해야 합니다.
    let streamHeaders = ["custom-stream-header": "custom-stream-header-value"]
    let asset = AVURLAsset(
        url: URL(string: "https://XXX")!,
        options: ["AVURLAssetHTTPHeaderFieldsKey": streamHeaders]
    )
    contentPlayer.replaceCurrentItem(with: AVPlayerItem(asset: asset))
    contentPlayer.play()
}
```

### 2. 라이브 채널 광고 요청 -- `requestChannelAd`

#### FlowerAdsManager.requestChannelAd()

현재 라이브 채널에 대한 광고를 요청하는 함수입니다. iOS에서는 `onAd` / `onCompleted` 클로저를 통해 광고가 전달됩니다. `onAd`는 응답된 광고마다 한 번씩 호출되고, `onCompleted`는 요청이 종료될 때 정확히 한 번 호출됩니다. 다음은 매개변수에 대한 설명입니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| transactionId | Int64 | 고유 큐 이벤트 ID<br/>광고 요청마다 다른 값이어야 합니다. 동일한 광고 브레이크(큐)는 하나의 `transactionId`를 유지해야 하므로, SCTE-35 Splice Event ID를 사용하는 것을 권장합니다. |
| cueDuration | Int64 | 요청할 광고 길이 (밀리초) |
| uniqueProgramId | Int32 | 광고 요청에 사용할 고유 프로그램 ID<br/>Flower 백엔드 시스템에 등록되어야 함 |
| timeout | Int64 | 광고 요청 타임아웃 (밀리초)<br/>**중요:** 현재 재생 시점을 기준으로 광고 마커가 발생하는 시점까지의 시간 차이를 계산하여 설정해야 합니다. |
| onAd | (FlowerAd) -> Void | 응답된 광고마다 한 번씩 호출됩니다 |
| onCompleted | (String?) -> Void | 요청이 종료될 때 정확히 한 번 호출됩니다. 광고가 전달된 경우 `nil`, 그 외에는 에러 문자열이 전달됩니다 |

**반환값:** `ChannelAdRequest` — 해당 요청의 핸들입니다. 사용자가 채널 화면을 벗어나는 경우 등에는 `cancel()`을 호출하여 이후의 `onAd` / `onCompleted` 콜백을 중단할 수 있습니다.

#### `onCompleted`로 전달되는 에러 값

| **값** | **설명** |
| ---| --- |
| nil | 광고가 전달되고 요청이 정상적으로 종료됨 |
| "NO_AD" | 요청한 브레이크에 응답된 광고가 없음 |
| "TIMEOUT" | 요청한 타임아웃 내에 광고 요청이 완료되지 않음 |
| "INTERNAL_ERROR" | 광고 요청이 실패했거나, 채널 광고를 요청할 수 없는 SDK 상태임 |

:::warning 콜백 스레드
콜백은 메인 스레드가 아닌 **SDK 워커 스레드**에서 호출됩니다. 플레이어나 UI를 다루기 전에 직접 main actor로 전환해야 합니다. 또한 클로저에 `@Sendable`을 명시하여 뷰 컨트롤러의 main actor isolation을 상속하지 않도록 해야 합니다. 그렇지 않으면 SDK가 메인 스레드가 아닌 곳에서 광고를 전달하는 순간 Swift 6에서 크래시가 발생합니다.
:::

:::note 동작 방식
- 이전 요청과 동일한 `transactionId`로 요청하면 광고를 요청하지 않고 즉시 `onCompleted(nil)`이 호출됩니다.
- 응답된 광고가 없거나 타임아웃이 발생하면 `onCompleted`에 `"NO_AD"` 또는 `"TIMEOUT"`이 전달되며, 이 경우 광고 브레이크를 건너뛰고 콘텐츠를 계속 재생해야 합니다.
:::

#### FlowerAd

Flower SDK가 반환하는 광고 객체입니다:

| **속성** | **유형** | **설명** |
| ---| ---| --- |
| id | String | 광고 ID |
| duration | Int64 | 광고 길이 (ms) |
| creatives | \[FlowerCreative\] | 재생 가능한 광고 소재 목록 |

#### FlowerCreative

SDK가 반환하는 광고 소재 객체입니다:

| **속성** | **유형** | **설명** |
| ---| ---| --- |
| type | String | 미디어 MIME 타입 |
| width | Int32 | 미디어 너비 (px) |
| height | Int32 | 미디어 높이 (px) |
| url | String | 미디어 URL |

#### 예시

```swift
private var channelAdRequest: ChannelAdRequest?

private func requestAd() {
    let transactionId = parseScte35EventId()
    let cueDuration: Int64 = 30_000 // 30 seconds
    let uniqueProgramId: Int32 = 1 // Unique program ID for the cue
    let timeout: Int64 = 5_000 // 5 seconds timeout for ad request

    // main actor에서 값을 미리 확보합니다. 아래 광고 콜백은 main actor 밖에서 실행되므로
    // 뷰에 접근할 수 없습니다.
    let preferredHeight = Int32(adContainerView.bounds.height)

    // TODO GUIDE: Request linear tv ad.
    // 콜백은 SDK 워커 스레드에서 호출되므로, 이 뷰 컨트롤러의 main actor isolation을 상속해서는
    // 안 됩니다. `@Sendable`을 붙여 nonisolated로 유지하고, 콜백 내부에서 소재를 선택한 뒤
    // Sendable한 값만 main actor로 전달합니다.
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

/// 광고 플레이어 높이에 가장 적합한 소재를 선택합니다.
///
/// AVPlayer가 재생할 수 있는 포맷만 후보로 사용하며, URL은 전달받은 그대로 반환합니다.
/// URL의 트래킹 id 쿼리 파라미터가 SDK가 재생 중인 광고를 식별하는 수단이기 때문입니다.
///
/// 광고를 전달한 SDK 워커 스레드에서 실행되므로 `nonisolated`로 선언합니다.
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

### 3. 광고 재생

반환된 광고는 광고 마커(예: SCTE-35)에 따라 원본 스트림을 대체하여 재생해야 합니다. 광고 재생 방식은 호스트 앱의 로직에 따라 달라질 수 있지만, 다음 규칙은 반드시 지켜야 합니다:

- **소재 URL은 전달받은 그대로 사용해야 합니다.** URL의 트래킹 id 쿼리 파라미터가 SDK가 재생 중인 광고를 식별하는 수단입니다. URL을 정규화하거나 재서명하거나 쿼리 파라미터를 제거하지 마세요.
- **광고 브레이크 재생이 시작되면 `adsManager.play()`를 호출**하여 브레이크가 시작되었음을 SDK에 알려야 합니다. 그래야 SDK가 리포팅을 시작할 수 있습니다.
- **브레이크 재생 중에는 `FlowerAdView`를 노출**(`adView.show()`)하여 광고 더보기, 스킵 등의 인터랙션이 표시되도록 하고, 브레이크가 종료되면 숨깁니다(`adView.hide()`).
- **동일한 브레이크의 광고는 브레이크가 이미 재생되는 중에도 계속 도착할 수 있습니다.** 첫 광고가 준비되면 브레이크를 시작하고, 이후 도착하는 광고는 플레이어 큐에 계속 추가하세요.
- **응답된 광고가 없는 경우**(`"NO_AD"` / `"TIMEOUT"` / `"INTERNAL_ERROR"`) 광고가 없는 것으로 처리하고, 광고 마커 구간에서 원본 스트림을 계속 재생해야 합니다.

#### 예시

```swift
private func enqueue(adId: String, creativeUrl: String?) {
    guard let creativeUrl = creativeUrl, let url = URL(string: creativeUrl) else { return }

    receivedCreativeUrls.append(creativeUrl)
    let item = AVPlayerItem(url: url)
    // 어댑터는 이 URL을 재생 중인 미디어로 SDK에 보고합니다.
    adPlayerAdapter.register(item: item, url: creativeUrl)
    adPlayer.insert(item, after: nil)

    // TODO GUIDE: 첫 광고가 도착한 직후 브레이크를 시작합니다. 동일한 브레이크의 이후 광고는
    // 브레이크가 재생되는 동안에도 큐를 계속 채웁니다.
    guard !isAdBreakScheduled else { return }
    isAdBreakScheduled = true
    DispatchQueue.main.asyncAfter(deadline: .now() + adPlaybackDelay) { [weak self] in
        self?.startAdBreak()
    }
}

private func handleRequestCompleted(error: String?) {
    channelAdRequest = nil

    guard let error = error else { return }

    // NO_AD / TIMEOUT / INTERNAL_ERROR - 브레이크를 건너뛰고 콘텐츠를 계속 재생합니다.
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

    // TODO GUIDE: 광고 브레이크 재생이 시작되었음을 SDK에 알립니다.
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

광고 브레이크의 종료는 앱의 플레이어에서 직접 감지할 수도 있고(마지막 광고가 끝나면 `AVQueuePlayer`의 큐가 비어 `nil`이 됩니다), `FlowerAdsManagerListener`를 통해 SDK로부터 전달받을 수도 있습니다:

```swift
// TODO GUIDE: Implement FlowerAdsManagerListener
// 뷰 컨트롤러는 @MainActor(UIViewController)인 반면, SDK 프로토콜은 nonisolated이며 콜백을
// 백그라운드 디스패처에서 전달합니다. 따라서 각 메소드를 nonisolated로 선언하고, 뷰나 플레이어
// 상태에 접근하기 전에 main actor로 전환합니다.
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

### 4. 채널 이탈 처리

채널 화면을 벗어날 때는 진행 중인 광고 요청을 취소하고 SDK를 종료해야 합니다:

```swift
override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)

    // TODO GUIDE: 핸들을 취소하면 아직 열려 있는 요청의 광고 콜백이 중단됩니다.
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

## 광고 재생 시간 감지 -- `MediaPlayerAdapter`

SDK는 `MediaPlayerAdapter`를 통해 광고의 재생 시간을 파악하여 광고 더보기, 스킵, 이벤트 트래킹 등을 처리합니다. 따라서 `enterChannel()`에 전달하는 `MediaPlayerAdapter`의 구현은 정확한 광고 동작을 위해 매우 중요합니다.

이 방식에서 SDK는 광고 플레이어를 직접 제어하지 않으며, `isPlaying()`과 `getCurrentMedia()`만 폴링하여 광고 진행 상태를 파악합니다. 아래는 각 메소드별 구현 지침입니다:

| **메소드** | **반환 유형** | **설명** |
| ---| ---| --- |
| getCurrentMedia() | Media | 현재 재생 중인 광고 소재의 URL, duration(ms), 현재 재생 시점(ms)을 반환합니다. `position`은 **광고 단위**로 계산해야 합니다. 각 광고 소재의 재생이 시작될 때 0부터 시작하여 해당 소재의 duration까지만 증가해야 하며, 브레이크 내 광고들의 누적 시간이나 채널 전체의 재생 시간이어서는 안 됩니다. **가장 중요한 메소드**이며, 정확한 값을 반환해야 광고 트래킹이 올바르게 동작합니다. |
| getVolume() | Float | 오디오 볼륨 레벨을 0.0~1.0 사이로 반환합니다 |
| isPlaying() | Bool | 플레이어가 현재 재생 중인지 여부를 반환합니다 |
| getHeight() | Int32 | 비디오 높이를 픽셀 단위로 반환합니다 (알 수 없으면 0) |
| pause() | Void | 재생을 일시정지합니다 |
| stop() | Void | 플레이어를 종료 처리합니다 |
| resume() | Void | 비디오 재생을 재개합니다 |
| enqueuePlayItem(playItem:) | Void | 다음 재생할 플레이 아이템을 큐에 추가합니다. 이 방식에서는 앱이 직접 소재를 큐에 추가하므로 구현할 필요가 없습니다. |
| removePlayItem(playItem:) | Void | 일치하는 플레이 아이템을 큐에서 제거합니다. 현재 방식에서는 구현할 필요가 없습니다. |
| playNextItem() | Void | 큐의 다음 플레이 아이템을 재생합니다 |
| seekToPosition(...) | Void | 특정 위치로 재생 시점을 이동합니다. 현재 방식에서는 구현할 필요가 없습니다. |
| getCurrentAbsoluteTime(isPrintDetails:) | Double | 현재 절대 재생 시간을 ms 단위로 반환합니다. 광고 소재에는 `EXT-X-PROGRAM-DATE-TIME`이 없으므로 이 방식에서는 `-1.0`을 반환합니다. |
| getPlayerType() | String? | 플레이어 구현을 식별하는 문자열을 반환합니다. SDK가 플레이어별 동작을 적용하고 광고 요청에 포함하는 데 사용합니다. |
| getPlayerVersion() | String? | 플레이어 버전 문자열을 반환합니다. SDK가 광고 요청에 포함합니다. |

:::tip getCurrentMedia()의 중요성
`getCurrentMedia()`는 SDK가 광고 재생 진행 상태를 파악하는 핵심 메소드입니다. 반환하는 `Media` 객체의 `urlOrId`, `duration`, `position` 값이 정확해야 광고 스킵, 더보기, 이벤트 트래킹이 올바르게 동작합니다.

- `urlOrId`에는 `requestChannelAd`로 **전달받은 그대로의** 소재 URL을 반환해야 합니다.
- `duration`은 브레이크 전체 길이가 아니라 현재 재생 중인 광고 소재의 길이여야 합니다.
- `position`은 **현재 재생 중인 광고의 경과 시간이며, 반드시 0부터 시작**해야 합니다. 브레이크의 다음 광고가 시작되면 다시 0부터 계산됩니다. SDK는 이 값을 기준으로 광고 quartile 이벤트(start, 25%, 50%, 75%, complete)를 발생시키므로, 누적 시간을 반환하면 트래킹이 잘못된 시점에 전송됩니다.

`AVQueuePlayer.currentTime()`은 현재 아이템 내에서의 재생 시점을 반환하므로, 각 소재를 개별 `AVPlayerItem`으로 큐에 추가한다면 이 요건을 만족합니다.
:::

:::warning 폴링 스레드
이 폴링은 SDK 워커 스레드에서 호출되며, 해당 스레드에서는 `AVPlayerItem.asset`을 읽을 수 없습니다(main actor 전용). 따라서 큐에 추가하는 모든 아이템의 소재 URL을 별도로 기록해 두고, 아이템의 asset을 조회하는 대신 락으로 보호된 맵에서 재생 중인 광고를 판별해야 합니다.
:::

### 예시

```swift
// TODO GUIDE: 앱이 소유한 광고 플레이어를 위한 platform MediaPlayerAdapter 구현
class DirectAdPlayerAdapter: NSObject, MediaPlayerAdapter, @unchecked Sendable {
    private let player: AVQueuePlayer
    private let lock = NSLock()
    private var urlByItem: [ObjectIdentifier: String] = [:]

    init(player: AVQueuePlayer) {
        self.player = player
        super.init()
    }

    /// 큐에 추가한 아이템이 어떤 소재 URL로 생성되었는지 기록합니다.
    func register(item: AVPlayerItem, url: String) {
        lock.lock()
        urlByItem[ObjectIdentifier(item)] = url
        lock.unlock()
    }

    /// 기록된 아이템을 정리합니다. 예를 들어 광고 브레이크가 종료된 시점에 호출합니다.
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

    // requestChannelAd가 반환한 소재는 앱이 직접 큐에 추가하므로, SDK 측의 큐 조작은
    // 이 방식에서 사용되지 않습니다.
    func enqueuePlayItem(playItem: PlayItem) throws {}

    func removePlayItem(playItem: PlayItem) throws {}

    func playNextItem() throws {
        player.advanceToNextItem()
    }

    func seekToPosition(absoluteStartTimeMs: Double?, relativeStartTimeMs: Double?, offsetMs: Double?, windowDurationMs: Double?, periodIndex: Int32?) throws {}

    // 광고 소재에는 EXT-X-PROGRAM-DATE-TIME이 없습니다. 직접 재생 방식에서는 getCurrentMedia()를
    // 기준으로 시간을 산출하므로 보고할 절대 시간이 없습니다.
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
