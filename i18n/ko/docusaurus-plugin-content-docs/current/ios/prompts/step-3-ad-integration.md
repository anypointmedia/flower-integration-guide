---
sidebar_position: 3
---

# Step 3: 광고 연동

이 프롬프트는 LLM이 iOS용 광고 리스너 등록 및 광고 요청 API 호출을 구현하도록 안내합니다.

**사용 전:** `{{AD_TYPE}}`, `{{APPROACH}}`, `{{UI_FRAMEWORK}}`를 입력하세요.

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
  - onAdBreakSkipped(reason: Int32)
  - onAdBreakPrepare(adInfos: NSMutableArray)
  - onAdPlay(adInfo: AdInfo)
  - onAdUserAction(action: String, adInfo: AdInfo)

You MUST implement all 8 methods even if some are empty. Missing methods cause compile errors.

Store the listener as a property (not a local variable) for later cleanup.

--------------------------------------------------
If AD_TYPE is "linear-tv":

For FlowerPlayer (FlowerAVPlayer):
  The listener is mainly for UI control (show/hide ad indicators), plus onError.
  onError (called off the main thread): hop to the main thread and restart the channel -
  player.flowerAdView.adsManager.stop(), player.replaceCurrentItem(with: nil) (this also
  clears the ad config), then start it again the same way: replaceCurrentItem(with:adConfig:)
  with a new AVPlayerItem of the original stream URL + play(). A restart leaves the channel
  pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it. So the restart's
  FlowerLinearTvAdConfig has no prerollAdTagUrl (withPreroll: false in PART 2) and the
  channel loads right away. If onError arrives before the
  channel item was loaded (player.currentItem == nil, i.e. a pre-roll playback error), restart
  in a NEW FlowerAVPlayer: FlowerAVPlayer does not load the channel after a pre-roll error and
  keeps its internal pre-roll listener registered. Keep a simple retry limit (e.g. at most 3
  restarts in a row).

  SwiftUI — implement as class holding view reference:
  class AdsManagerListenerImpl: FlowerAdsManagerListener {
      func onPrepare(adDurationMs: Int32) {}
      func onPlay() { /* hide player controls */ }
      func onCompleted() { /* show player controls */ }
      func onError(error: FlowerError?) { /* main thread: stop + restart the channel (above) */ }
      func onAdBreakSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

  UIKit — conform on ViewController:
  extension PlaybackViewController: FlowerAdsManagerListener {
      func onPrepare(adDurationMs: Int32) {}
      func onPlay() {}
      func onCompleted() {}
      func onError(error: FlowerError?) { /* main thread: stop + restart the channel (above) */ }
      func onAdBreakSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

For MediaPlayerHook:
  Same listener but register on flowerAdView.adsManager.
  onError (called off the main thread): hop to the main thread and restart the channel -
  flowerAdView.adsManager.stop() (this also ends the SDK proxy the current URL points at),
  release the content item (removeAllItems / replaceCurrentItem(with: nil)), then start it
  again the same way: a new changeChannelUrl(...) -> a new AVPlayerItem -> play(). A restart
  leaves the channel pre-roll out (prerollAdTagUrl omitted): the viewer has already seen it.
  So the restart passes prerollAdTagUrl: nil (withPreroll: false in PART 2), has no pre-roll
  wait (no temporary pre-roll listener), loads the new URL right away and keeps the main
  listener registered. Keep a simple retry limit (e.g. at most 3 restarts in a row).

  SwiftUI:
  flowerAdView.adsManager.addListener(adsManagerListener: listener)

  UIKit (ViewController conforms to protocol, so pass self):
  flowerAdView.adsManager.addListener(adsManagerListener: self)

--------------------------------------------------
If AD_TYPE is "vod":

For FlowerPlayer:
  The listener is for UI control, plus onCompleted / onError (hop to the main thread).
  The first onCompleted is where FlowerAVPlayer loads the content (keep isContentPrepared).
  - onError before that (pre-roll playback error): FlowerAVPlayer does NOT load the content
    after it, and replaceCurrentItem(with:) without an ad config loads nothing for VOD.
    Release the player and start the same content in a NEW FlowerAVPlayer with
    replaceCurrentItem(with:adConfig:) + play(), once per content.
  - onError after that, content not ended (mid-roll error): player.play() as a safety net -
    the SDK also rewinds and resumes the content. No seek, no reload.
  - onError after the content ended (post-roll error): do not resume.

For MediaPlayerHook:
  By default the SDK plays VOD ads in its own ad player over the content. For a mid-roll it
  pauses the content itself (at onPrepare) and, after the break, rewinds it by 5 seconds
  (rewindDuration; requestVodAd has no parameter for it - it is configurable only through
  FlowerVodAdConfig with FlowerAVPlayer) and resumes it. The content is not loaded during
  the pre-roll. Do NOT pause, seek or reload the content around a VOD ad break. The one
  exception: player.play() in onError after a mid-roll.
  - onPrepare: Call flowerAdView.adsManager.play() right away (a mid-roll's onPrepare
    arrives when the content reaches the mid-roll position). Do NOT delay it.
  - onPlay: Do NOT pause the content.
  - onCompleted: Only the FIRST onCompleted/onError starts the content. If the content
    has not been prepared yet (isContentPrepared == false), call prepareContentSource()
    (see PART 2) and set isContentPrepared = true. This is the end of the pre-roll, or the
    SDK found no pre-roll / no ad breaks / the ad request failed - it still calls
    onCompleted in those cases. After a mid-roll do nothing: the SDK has already resumed
    the content. After the post-roll (isContentEnd == true) only run post-playback actions.
  - onError: Same as onCompleted for the first call (start the content). After that, if the
    content has not ended (isContentEnd == false), it is a mid-roll error: call player.play()
    (no seek, no reload). The SDK also rewinds and resumes the content before it calls
    onError, so this is a safety net that keeps the content from staying paused. After the
    post-roll (isContentEnd == true) do not resume the content.

  SwiftUI (keep isContentPrepared / isContentEnd in a reference type, e.g. an
  ObservableObject, so that the listener and the view share the same state):
  class AdsManagerListenerImpl: FlowerAdsManagerListener {
      var view: PlaybackView
      init(_ view: PlaybackView) { self.view = view }

      func onPrepare(adDurationMs: Int32) {
          DispatchQueue.main.async {
              self.view.flowerAdView.adsManager.play()
          }
      }
      func onPlay() {
          // Do NOT pause the player here - the SDK pauses and resumes the content itself.
      }
      func onCompleted() {
          DispatchQueue.main.async {
              if !self.view.isContentPrepared {
                  // End of the pre-roll, or no pre-roll / no ads / request failure
                  self.view.prepareContentSource()
                  self.view.isContentPrepared = true
              } else if self.view.isContentEnd {
                  // The post-roll has finished - run post-playback actions here
              }
              // After a mid-roll: nothing to do - the SDK has already resumed the content.
          }
      }
      func onError(error: FlowerError?) {
          DispatchQueue.main.async {
              if !self.view.isContentPrepared {
                  // Pre-roll error: start the content
                  self.view.prepareContentSource()
                  self.view.isContentPrepared = true
              } else if !self.view.isContentEnd {
                  // Mid-roll error: resume the content (safety net). No seek, no reload.
                  self.view.player.play()
              }
              // Post-roll error: the content has ended - do not resume it.
          }
      }
      func onAdBreakSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
      func onAdPlay(adInfo: AdInfo) {}
      func onAdUserAction(action: String, adInfo: AdInfo) {}
  }

  UIKit: the same logic in `extension PlaybackViewController: FlowerAdsManagerListener`,
  using self.isContentPrepared, self.isContentEnd, self.prepareContentSource() and
  self.player.play().

  Detect content end: register the observer inside prepareContentSource() (see PART 2),
  on the item it creates.

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
      func onAdBreakSkipped(reason: Int32) {}
      func onAdBreakPrepare(adInfos: NSMutableArray) {}
  }

========================================
PART 2 — Request Ads / Start Playback
========================================

--------------------------------------------------
If AD_TYPE is "linear-tv" AND APPROACH is "flower-player":

  Use values from your config data — do NOT hardcode URLs or parameters.
  Omit optional parameters if not available.
  withPreroll: true when a channel starts (first start or channel change), false on a restart
  after onError.

  let adConfig = FlowerLinearTvAdConfig(
      adTagUrl: config.adTagUrl,                           // Required
      prerollAdTagUrl: withPreroll ? config.prerollAdTagUrl : nil,  // Optional; nil on a restart
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
  withPreroll: true when a channel starts (first start or channel change), false on a restart
  after onError.

  Create MediaPlayerHook:
  class MediaPlayerHookImpl: MediaPlayerHook {
      private let fn: () -> Any
      init(_ fn: @escaping () -> Any) { self.fn = fn }
      func getPlayer() -> Any? { fn() }
  }

  let hook = MediaPlayerHookImpl { self.player }
  let prerollAdTagUrl = withPreroll ? config.prerollAdTagUrl : nil  // nil on a restart
  let changedUrl = flowerAdView.adsManager.changeChannelUrl(
      videoUrl: config.contentUrl,                         // Required
      adTagUrl: config.adTagUrl,                           // Required
      channelId: config.channelId,                         // Required
      extraParams: config.extraParams,                     // Required
      mediaPlayerHook: hook,                               // Required
      adTagHeaders: config.adTagHeaders ?? [:],            // Optional
      channelStreamHeaders: config.channelStreamHeaders ?? [:],  // Optional
      prerollAdTagUrl: prerollAdTagUrl                     // Optional
  )
  if prerollAdTagUrl == nil {
      // No pre-roll (or a restart after onError): load the URL right away.
      loadChannel(changedUrl)
  } else {
      // Channel pre-roll: the SDK plays it once, before the channel, in its own ad player.
      // Hold the stream until it ends - do NOT load changedUrl yet.
      pendingChannelUrl = changedUrl
      flowerAdView.adsManager.removeListener(adsManagerListener: mainListener)
      let preroll = PrerollListener { done in
          DispatchQueue.main.async {
              guard prerollListener === done else { return }   // first call only
              prerollListener = nil
              flowerAdView.adsManager.removeListener(adsManagerListener: done)
              flowerAdView.adsManager.addListener(adsManagerListener: mainListener)
              if let url = pendingChannelUrl {
                  pendingChannelUrl = nil
                  loadChannel(url)
              }
          }
      }
      prerollListener = preroll
      flowerAdView.adsManager.addListener(adsManagerListener: preroll)
  }

  func loadChannel(_ url: String) {
      player.removeAllItems()
      player.insert(AVPlayerItem(url: URL(string: url)!), after: nil)
      player.play()
  }

  - mainListener is the listener registered in PART 1 (SwiftUI: listener, UIKit: self).
  - State: pendingChannelUrl: String?, prerollListener: PrerollListener? (SwiftUI: @State;
    UIKit: properties, and capture [weak self] in the closure).
  - PrerollListener is a FlowerAdsManagerListener (every protocol method, the others empty)
    that calls onDone(self) from onCompleted and onError. The SDK calls them off the main
    thread. The SDK ends the pre-roll with onCompleted, also when there is no pre-roll ad, the
    request failed or the pre-roll could not be played. Its onError does NOT restart the
    channel: the channel has not started yet.
  - A restart after onError (withPreroll: false) has no pre-roll wait: it loads right away and
    keeps the main listener registered.
  - Before the next changeChannelUrl(...) (channel change) and before every stop() (restart,
    cleanup), if prerollListener is still set, remove it from adsManager, set prerollListener
    and pendingChannelUrl to nil, and add mainListener back (cleanup removes it right after).
    Each changeChannelUrl(...) and stop() ends a pre-roll still playing WITHOUT calling the
    temporary listener, so a forgotten one would load the previous channel's URL when the next
    pre-roll ends. changeChannelUrl(...) then requests the new channel's pre-roll.

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
  // Do NOT load or play the content here - its first frame would show before the
  // pre-roll. The listener's first onCompleted/onError calls prepareContentSource().

  Load and start the content (called once, from the listener):
  func prepareContentSource() {
      let item = AVPlayerItem(url: URL(string: config.contentUrl)!)
      // Detect content end (store the observer token as a property for cleanup)
      contentEndObserver = NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main) { _ in
          self.isContentEnd = true
          self.flowerAdView.adsManager.notifyContentEnded()
      }
      player.removeAllItems()
      player.insert(item, after: nil)
      player.play()
  }

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
