---
sidebar_position: 3
---

# Step 3: Ad Integration

This prompt guides LLM to implement ad listener registration and ad request API calls for iOS.

**Before using:** Fill in `{{AD_TYPE}}`, `{{APPROACH}}`, and `{{UI_FRAMEWORK}}`.

```plain
We are integrating the FLOWER SDK into our iOS project.
This step implements ad event listening and ad request/playback logic.

AD_TYPE: {{AD_TYPE}}
(linear-tv | vod | interstitial)

APPROACH: {{APPROACH}}
(flower-player | media-player-hook)
Note: For interstitial AD_TYPE, no APPROACH selection is needed.

UI_FRAMEWORK: {{UI_FRAMEWORK}}
(swiftui | uikit)

========================================
IMPORTS
========================================

All Flower SDK types are accessed via a single module import:

  import FlowerSdk

This gives access to: FlowerAVPlayer, FlowerAVPlayerViewController, FlowerVideoPlayer,
FlowerAdView, FlowerAdsManagerListener, FlowerError, FlowerLinearTvAdConfig,
FlowerVodAdConfig, FlowerSdk, MediaPlayerHook, MediaPlayerAdapter, etc.

========================================
PART 1 — Implement FlowerAdsManagerListener
========================================

IMPORTANT: The FlowerAdsManagerListener protocol requires ALL of these methods:
  - onPrepare(adDurationMs: Int32)
  - onPlay()
  - onCompleted()
  - onError(error: FlowerError?)
  - onAdSkipped(reason: Int32)
  - onAdBreakPrepare(adInfos: NSMutableArray)

You MUST implement all 6 methods even if some are empty. Missing methods cause compile errors.

Store the listener as a property (not a local variable) for later cleanup.

--------------------------------------------------
If AD_TYPE is "linear-tv":

For FlowerPlayer (FlowerAVPlayer):
  Listener is optional. Mainly for UI control (show/hide ad indicators).

  SwiftUI — implement as class holding view reference:
  class AdsManagerListenerImpl: FlowerAdsManagerListener {
      func onPrepare(adDurationMs: Int32) {}
      func onPlay() { /* hide player controls */ }
      func onCompleted() { /* show player controls */ }
      func onError(error: FlowerError?) { /* handle error */ }
      func onAdSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

  UIKit — conform on ViewController:
  extension PlaybackViewController: FlowerAdsManagerListener {
      func onPrepare(adDurationMs: Int32) {}
      func onPlay() {}
      func onCompleted() {}
      func onError(error: FlowerError?) {}
      func onAdSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

For MediaPlayerHook:
  Same listener but register on flowerAdView.adsManager:

  SwiftUI:
  flowerAdView.adsManager.addListener(adsManagerListener: listener)

  UIKit (ViewController conforms to protocol, so pass self):
  flowerAdView.adsManager.addListener(adsManagerListener: self)

--------------------------------------------------
If AD_TYPE is "vod":

For FlowerPlayer:
  Same as linear-tv — listener is optional for UI control only.

For MediaPlayerHook:
  VOD requires active content pause/resume.
  - onPrepare: Call flowerAdView.adsManager.play()
  - onPlay: Pause content (player.pause())
  - onCompleted: Resume content (player.play()) if not ended
  - onError: Resume content if not ended

  SwiftUI:
  class AdsManagerListenerImpl: FlowerAdsManagerListener {
      var view: PlaybackView
      init(_ view: PlaybackView) { self.view = view }

      func onPrepare(adDurationMs: Int32) {
          DispatchQueue.main.async {
              if self.view.player.rate != 0.0 {
                  Task {
                      try await Task.sleep(nanoseconds: 5_000_000_000)
                      self.view.flowerAdView.adsManager.play()
                  }
              } else {
                  self.view.flowerAdView.adsManager.play()
              }
          }
      }
      func onPlay() {
          DispatchQueue.main.async { self.view.player.pause() }
      }
      func onCompleted() {
          DispatchQueue.main.async {
              if !self.view.isContentEnd { self.view.player.play() }
          }
      }
      func onError(error: FlowerError?) {
          DispatchQueue.main.async {
              if !self.view.isContentEnd { self.view.player.play() }
          }
      }
      func onAdSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

  Detect content end (store the observer token as a property for cleanup):
  contentEndObserver = NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: playerItem, queue: .main) { _ in
      isContentEnd = true
      flowerAdView.adsManager.notifyContentEnded()
  }

--------------------------------------------------
If AD_TYPE is "interstitial":

  - onPrepare: Call flowerAdView.adsManager.play()
  - onCompleted/onError: Call stop() and removeListener()

  class AdsManagerListenerImpl: FlowerAdsManagerListener {
      var adView: FlowerAdView
      init(_ adView: FlowerAdView) { self.adView = adView }

      func onPrepare(adDurationMs: Int32) {
          DispatchQueue.main.async { self.adView.adsManager.play() }
      }
      func onPlay() {}
      func onCompleted() {
          DispatchQueue.main.async {
              self.adView.adsManager.stop()
              self.adView.adsManager.removeListener(adsManagerListener: self)
          }
      }
      func onError(error: FlowerError?) {
          DispatchQueue.main.async {
              self.adView.adsManager.stop()
              self.adView.adsManager.removeListener(adsManagerListener: self)
          }
      }
      func onAdSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

========================================
PART 2 — Request Ads / Start Playback
========================================

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "flower-player":

  Use values from your config data — do NOT hardcode URLs or parameters.
  Omit optional parameters if not available.

  let adConfig = FlowerLinearTvAdConfig(
      adTagUrl: config.adTagUrl,                           // Required
      prerollAdTagUrl: config.prerollAdTagUrl,             // Optional
      channelId: config.channelId,                         // Required
      extraParams: config.extraParams,                     // Required
      adTagHeaders: config.adTagHeaders ?? [:],            // Optional
      channelStreamHeaders: config.channelStreamHeaders ?? [:]  // Optional
  )
  player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: config.contentUrl)!), adConfig: adConfig)
  player.play()

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "media-player-hook":

  Use values from your config data — do NOT hardcode URLs or parameters.

  Create MediaPlayerHook:
  class MediaPlayerHookImpl: MediaPlayerHook {
      private let fn: () -> Any
      init(_ fn: @escaping () -> Any) { self.fn = fn }
      func getPlayer() -> Any? { fn() }
  }

  let hook = MediaPlayerHookImpl { self.player }
  let changedUrl = flowerAdView.adsManager.changeChannelUrl(
      videoUrl: config.contentUrl,                         // Required
      adTagUrl: config.adTagUrl,                           // Required
      channelId: config.channelId,                         // Required
      extraParams: config.extraParams,                     // Required
      mediaPlayerHook: hook,                               // Required
      adTagHeaders: config.adTagHeaders ?? [:],            // Optional
      channelStreamHeaders: config.channelStreamHeaders ?? [:],  // Optional
      prerollAdTagUrl: config.prerollAdTagUrl              // Optional
  )
  player.removeAllItems()
  player.insert(AVPlayerItem(url: URL(string: changedUrl)!), after: nil)
  player.play()

--------------------------------------------------
If AD_TYPE is "vod" AND APPROACH is "flower-player":

  Use values from your config data — do NOT hardcode URLs or parameters.

  let adConfig = FlowerVodAdConfig(
      adTagUrl: config.adTagUrl,                           // Required
      contentId: config.contentId,                         // Required
      contentDuration: config.contentDuration,             // Required (ms)
      extraParams: config.extraParams,                     // Required
      adTagHeaders: config.adTagHeaders ?? [:]             // Optional
  )
  player.replaceCurrentItem(with: AVPlayerItem(url: URL(string: config.contentUrl)!), adConfig: adConfig)
  player.play()

--------------------------------------------------
If AD_TYPE is "vod" AND APPROACH is "media-player-hook":

  Use values from your config data — do NOT hardcode URLs or parameters.

  Create MediaPlayerHook:
  class MediaPlayerHookImpl: MediaPlayerHook {
      private let fn: () -> Any
      init(_ fn: @escaping () -> Any) { self.fn = fn }
      func getPlayer() -> Any? { fn() }
  }

  let hook = MediaPlayerHookImpl { self.player }
  flowerAdView.adsManager.requestVodAd(
      adTagUrl: config.adTagUrl,                           // Required
      contentId: config.contentId,                         // Required
      durationMs: config.contentDuration,                  // Required (ms)
      extraParams: config.extraParams,                     // Required
      mediaPlayerHook: hook,                               // Required
      adTagHeaders: config.adTagHeaders ?? [:]             // Optional
  )
  let item = AVPlayerItem(url: URL(string: config.contentUrl)!)
  player.removeAllItems()
  player.insert(item, after: nil)
  player.play()

--------------------------------------------------
If AD_TYPE is "interstitial":

  Use values from your config data — do NOT hardcode URLs or parameters.

  flowerAdView.adsManager.requestAd(
      adTagUrl: config.adTagUrl,                           // Required
      extraParams: config.extraParams ?? [:],              // Optional
      adTagHeaders: config.adTagHeaders ?? [:]             // Optional
  )

========================================
CONSTRAINTS
========================================

- iOS uses removeListener(adsManagerListener:) with named parameter.
- FlowerAVPlayer uses replaceCurrentItem(with:adConfig:) — NOT setMediaItem().
- MediaPlayerHook for iOS: implement getPlayer() -> Any? returning the AVQueuePlayer.
- All listener callbacks must dispatch to main thread via DispatchQueue.main.async.
- MediaPlayerAdapter is available for Linear TV only (changeChannelUrl overload).
- For VOD MediaPlayerHook, call notifyContentEnded() when AVPlayerItemDidPlayToEndTime fires.
```
