---
sidebar_position: 1
sidebar_label: PIP 모드 지원
---

# PIP 모드 지원

앱이 PIP(Picture-in-Picture)를 지원하고 이미 Flower SDK 연동(VOD, Linear TV, 인라인)이 되어 있을 때 이 프롬프트를 사용하세요. SDK에 필요한 PIP 알림을 추가하고, 기본 모드에서는 광고 재생 중 본편 플레이어가 PIP로 전환되지 않도록 막아 PIP로 광고를 건너뛸 수 없게 합니다. 반대로 PIP에서도 VOD 광고가 계속 재생되도록 하려면 [PIP 모드에서의 VOD 광고](../vod/ads-in-pip-mode)를 사용하세요. [PIP 모드 지원](../../../getting-started/pip-mode-support)과 [VOD PIP 모드 지원](../../../ad-insertion/vod/pip-mode-support) 페이지를 참고하세요.

| 매개변수 | 값 | 설명 |
|----------|----|------|
| `PIP_SOURCE` | `avplayerviewcontroller` \| `avpictureinpicturecontroller` | PIP를 제공하는 주체: `AVPlayerViewController`(`FlowerAVPlayerViewController` 포함)의 기본 PIP, 또는 `AVPlayerLayer`에 연결한 앱의 `AVPictureInPictureController` |

```plain
Our iOS app has a FLOWER SDK integration and supports Picture-in-Picture. Add the PIP handling
the SDK needs. Modify the code I paste below.

========================================
GOAL
========================================

- The SDK always knows whether the app is in PIP.
- While an ad is playing, the content player cannot go into PIP (default mode).

========================================
PARAMETERS
========================================

PIP_SOURCE: {{PIP_SOURCE}}   (avplayerviewcontroller | avpictureinpicturecontroller)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- The SDK does not detect PIP by itself. The app must call
  FlowerSdk.notifyPictureInPictureModeChanged(true) when PIP starts and (false) when it stops.
- Default FlowerSdk.setIgnoreAdBreakInPIPMode(true):
  - A VOD ad, an inline ad or a linear channel pre-roll that is playing when PIP starts is paused
    and its UI hidden; it resumes from the same point when PIP stops. Its progress and quartile
    tracking do not advance meanwhile.
  - VOD mid-roll and post-roll breaks are not requested while in PIP.
  - Ads inserted into a linear stream keep playing in PIP; only the ad UI is hidden.
  - CTA ("more info") is restricted in PIP.
- Which video goes into PIP is decided by the app: the AVPlayerViewController or the
  AVPlayerLayer of the content player. The SDK cannot stop it, so the app must.
- canStartPictureInPictureAutomaticallyFromInline (iOS 14.2+) only controls automatic PIP.
  The built-in PIP button of AVPlayerViewController is controlled by
  allowsPictureInPicturePlayback.

========================================
IMPLEMENTATION
========================================

1. Notify PIP transitions.
   PIP_SOURCE avplayerviewcontroller:
     playerViewController.delegate = self
     extension PlaybackViewController: AVPlayerViewControllerDelegate {
         func playerViewControllerWillStartPictureInPicture(_ playerViewController: AVPlayerViewController) {
             FlowerSdk.notifyPictureInPictureModeChanged(true)
         }
         func playerViewControllerDidStopPictureInPicture(_ playerViewController: AVPlayerViewController) {
             FlowerSdk.notifyPictureInPictureModeChanged(false)
         }
     }
   PIP_SOURCE avpictureinpicturecontroller:
     pipController.delegate = self
     extension PlaybackViewController: AVPictureInPictureControllerDelegate {
         func pictureInPictureControllerWillStartPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
             FlowerSdk.notifyPictureInPictureModeChanged(true)
         }
         func pictureInPictureControllerDidStopPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
             FlowerSdk.notifyPictureInPictureModeChanged(false)
         }
     }
   SwiftUI: SwiftUI VideoPlayer / FlowerVideoPlayer give no PIP callbacks. If the app needs PIP,
   host an AVPlayerViewController with UIViewControllerRepresentable and use its delegate.

2. Block PIP while an ad plays (VOD, inline, linear pre-roll). In the existing
   FlowerAdsManagerListener (or a UI listener added with player.addAdListener for FlowerAVPlayer):
   var isAdPlaying = false
   func onPlay() { DispatchQueue.main.async { self.setAdPlaying(true) } }
   func onCompleted() { DispatchQueue.main.async { self.setAdPlaying(false) } }
   func onError(error: FlowerError?) { DispatchQueue.main.async { self.setAdPlaying(false) } }
   Keep the other listener code (play() in onPrepare, content start logic, and the rest of
   onError: starting the content after a pre-roll error, player.play() after a VOD mid-roll
   error, or the linear channel restart) unchanged.

   func setAdPlaying(_ playing: Bool) {
       isAdPlaying = playing
       // PIP_SOURCE avplayerviewcontroller:
       playerViewController.allowsPictureInPicturePlayback = !playing
       if #available(iOS 14.2, *) {
           playerViewController.canStartPictureInPictureAutomaticallyFromInline = !playing
       }
       // PIP_SOURCE avpictureinpicturecontroller:
       if #available(iOS 14.2, *) {
           pipController?.canStartPictureInPictureAutomaticallyFromInline = !playing
       }
   }
   PIP_SOURCE avpictureinpicturecontroller: in your own PIP button action,
   guard !isAdPlaying else { return } before pipController?.startPictureInPicture().

3. Linear stream ads (changeChannelUrl / FlowerLinearTvAdConfig) need only step 1; do not block
   PIP for them unless the product requires it.

========================================
RULES
========================================

DO:
- Notify both entering and leaving PIP, on every screen that can go into PIP.
- Restore PIP permission in onCompleted and onError.

DO NOT:
- Do NOT pause, stop or seek the ad or the content when PIP starts or stops; the SDK pauses and
  resumes the ad itself.
- Do NOT call FlowerSdk.setIgnoreAdBreakInPIPMode(false) here (that is the "VOD ads in PIP
  mode" case).
- Do NOT change any other part of the ad integration.

========================================
VERIFY
========================================

- During content: PIP works; after returning, the next mid-roll plays normally.
- During an ad: the PIP button is disabled / does nothing, and going home does not start PIP.
- If PIP still starts during an ad (e.g. on an older iOS): the ad pauses, and resumes from the
  same point when the app returns.
- In PIP, VOD content reaching a mid-roll position: no ad is requested.
- Linear stream ad in PIP: keeps playing; the ad UI comes back after PIP.

========================================
OUTPUT
========================================

- Modify the code I paste below; keep its structure and names.
- Generate only the code for the selected PIP_SOURCE.
- List every file you changed or added.
- Do not add code for other cases.

My code:
```
