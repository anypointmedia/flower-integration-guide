---
sidebar_position: 4
---

# Step 4: 정리, 해제 및 기타

이 프롬프트는 LLM이 적절한 리소스 정리와 PiP 지원 등 선택적 기능을 구현하도록 안내합니다.

**사용 전:** `{{AD_TYPE}}`과 `{{APPROACH}}`를 입력하세요.

```plain
We are integrating the FLOWER SDK into our Android project.
This step implements proper cleanup on Activity lifecycle and optional PiP support.

AD_TYPE: {{AD_TYPE}}
(linear-tv | vod | interstitial)

APPROACH: {{APPROACH}}
(flower-player | media-player-hook)
Note: For interstitial AD_TYPE, no APPROACH selection is needed.

========================================
PART 1 — Cleanup on Activity Destroy
========================================

If APPROACH is "flower-player":

  override fun onDestroy() {
      super.onDestroy()
      player.stop()
      player.removeAdListener(flowerAdsManagerListener)
      player.release()
  }

If APPROACH is "media-player-hook":

  override fun onDestroy() {
      super.onDestroy()
      flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
      prerollListener?.let { flowerAdView.adsManager.removeListener(it) }   // linear-tv: pre-roll still pending (Step 3)
      flowerAdView.adsManager.stop()
      player.release()
  }

If AD_TYPE is "interstitial":

  override fun onDestroy() {
      super.onDestroy()
      flowerAdView.adsManager.removeListener(flowerAdsManagerListener)
      flowerAdView.adsManager.stop()
  }

========================================
PART 2 — Pause on Activity Pause (Optional)
========================================

For media playback Activities, stop or pause the player in onPause:

  override fun onPause() {
      super.onPause()
      player.stop()  // or player.pause() for VOD
  }

========================================
IMPORTS — Required packages for PiP support
========================================

  import android.app.PictureInPictureParams
  import android.content.res.Configuration
  import android.os.Build
  import android.util.Rational
  import tv.anypoint.flower.android.sdk.api.FlowerSdk

========================================
PART 3 — Picture-in-Picture Support (Optional)
========================================

Available in Flower Android SDK version 2.8.0+.

1. Notify the SDK when the user leaves the Activity, then enter PiP mode — but NOT while an ad
   is playing (PiP could otherwise be used to bypass the ad). Report the user leaving whether or
   not the app enters PiP: during an ad the app does not enter PiP, so a report sent only on PiP
   changes would never tell the SDK that the user left. Track the ad state in the
   FlowerAdsManagerListener registered in Step 3: set isAdPlaying = true in onPlay(),
   and isAdPlaying = false in onCompleted() and onError(). For linear-tv with media-player-hook
   and a pre-roll, set it in the temporary pre-roll listener of Step 3 as well.
   enterPictureInPictureMode(PictureInPictureParams) requires API 26 and the Flower SDK
   supports lower API levels, so check the API level.

  Kotlin:
  private var isAdPlaying = false   // set in onPlay, cleared in onCompleted / onError

  override fun onUserLeaveHint() {
      super.onUserLeaveHint()
      FlowerSdk.notifyUserLeftApp(true)   // always, before deciding on PiP
      if (isAdPlaying) return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          val params = PictureInPictureParams.Builder()
              .setAspectRatio(Rational(16, 9))
              .build()
          enterPictureInPictureMode(params)
      }
  }

  Do NOT enable PictureInPictureParams.Builder().setAutoEnterEnabled(true) (API 31) while an
  ad is playing, for the same reason.

2. Notify the SDK when the user comes back (the Activity resumes, including when the PiP window
   is expanded back to full screen), and toggle player controls on PiP changes.
   FlowerSdk.notifyPictureInPictureModeChanged() is deprecated: use notifyUserLeftApp() instead.

  Kotlin:
  override fun onResume() {
      super.onResume()
      FlowerSdk.notifyUserLeftApp(false)
  }

  override fun onPictureInPictureModeChanged(
      isInPictureInPictureMode: Boolean,
      newConfig: Configuration?
  ) {
      super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
      playerView.useController = !isInPictureInPictureMode
  }

  Java:
  @Override
  protected void onUserLeaveHint() {
      super.onUserLeaveHint();
      FlowerSdk.notifyUserLeftApp(true);   // always, before deciding on PiP
      // then enter PiP only if no ad is playing, as in 1.
  }

  @Override
  protected void onResume() {
      super.onResume();
      FlowerSdk.notifyUserLeftApp(false);
  }
3. AndroidManifest.xml — enable PiP for the Activity:

  <activity
      android:name=".PlaybackActivity"
      android:supportsPictureInPicture="true"
      android:configChanges="screenSize|smallestScreenSize|screenLayout|orientation"
  />

========================================
PART 4 — VOD Playback State Control (MediaPlayerHook only)
========================================

When using MediaPlayerHook for VOD, notify the SDK about playback state changes:

  // When user pauses content
  fun onUserPause() {
      player.playWhenReady = false
      flowerAdView.adsManager.pause()
  }

  // When user resumes content
  fun onUserResume() {
      player.playWhenReady = true
      flowerAdView.adsManager.resume()
  }

  // When exiting VOD content
  fun onVodExit() {
      flowerAdView.adsManager.stop()
  }

========================================
CONSTRAINTS
========================================

- Always remove the ad listener BEFORE releasing the player.
- For FlowerPlayer, use player.removeAdListener(). For others, use flowerAdView.adsManager.removeListener().
- FlowerSdk.destroy() should only be called in Application.onTerminate(), NOT in Activity.onDestroy().
- If the app supports PiP, call FlowerSdk.notifyUserLeftApp(true) when the user leaves the app and
  FlowerSdk.notifyUserLeftApp(false) when the user comes back, with every APPROACH and whether or
  not the app enters PiP — the SDK does not detect this by itself.
- Do NOT enter PiP while an ad is playing, and check Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
  before calling enterPictureInPictureMode(PictureInPictureParams).
```
