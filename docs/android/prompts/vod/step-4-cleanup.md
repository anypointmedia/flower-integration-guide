---
sidebar_position: 4
---

# Step 4: Cleanup, Release & Extras

This prompt guides LLM to implement proper resource cleanup and optional features like PiP support.

**Before using:** Fill in `{{AD_TYPE}}` and `{{APPROACH}}`.

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

1. Enter PiP mode when user leaves the Activity — but NOT while an ad is playing
   (PiP could otherwise be used to bypass the ad). Track the ad state in the
   FlowerAdsManagerListener registered in Step 3: set isAdPlaying = true in onPlay(),
   and isAdPlaying = false in onCompleted() and onError(). For linear-tv with media-player-hook
   and a pre-roll, set it in the temporary pre-roll listener of Step 3 as well.
   enterPictureInPictureMode(PictureInPictureParams) requires API 26 and the Flower SDK
   supports lower API levels, so check the API level.

  Kotlin:
  private var isAdPlaying = false   // set in onPlay, cleared in onCompleted / onError

  override fun onUserLeaveHint() {
      super.onUserLeaveHint()
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

2. Notify the SDK about PiP state changes and toggle player controls:

  Kotlin:
  override fun onPictureInPictureModeChanged(
      isInPictureInPictureMode: Boolean,
      newConfig: Configuration?
  ) {
      super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
      playerView.useController = !isInPictureInPictureMode
      FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode)
  }

  Java:
  @Override
  public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, Configuration newConfig) {
      super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
      FlowerSdk.notifyPictureInPictureModeChanged(isInPictureInPictureMode);
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
- If the app supports PiP, call FlowerSdk.notifyPictureInPictureModeChanged() on both entering and
  exiting PiP with every APPROACH — the SDK does not detect PiP by itself.
- Do NOT enter PiP while an ad is playing, and check Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
  before calling enterPictureInPictureMode(PictureInPictureParams).
```
