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
      flowerAdView.adsManager.removeListener(adsManagerListener)
      flowerAdView.adsManager.stop()
      player.release()
  }

If AD_TYPE is "interstitial":

  override fun onDestroy() {
      super.onDestroy()
      flowerAdView.adsManager.removeListener(adsManagerListener)
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
  import android.util.Rational
  import tv.anypoint.flower.android.sdk.api.FlowerSdk

========================================
PART 3 — Picture-in-Picture Support (Optional)
========================================

Available in Flower Android SDK version 2.8.0+.

1. Enter PiP mode when user leaves the Activity:

  Kotlin:
  override fun onUserLeaveHint() {
      super.onUserLeaveHint()
      val params = PictureInPictureParams.Builder()
          .setAspectRatio(Rational(16, 9))
          .build()
      enterPictureInPictureMode(params)
  }

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
- PiP notification is only needed for MediaPlayerHook approach with overlay ads.
```
