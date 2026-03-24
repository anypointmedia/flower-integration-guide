---
sidebar_position: 2
---

# Step 2: Ad Layer & Player Setup

This prompt guides LLM to set up the ad display layer and ad player for Linear TV.

**Before using:** Fill in `{{PLAYER_TYPE}}`.

```plain
We are integrating the FLOWER Linear TV SDK into our Android STB project.
This step sets up the ad display layer and ad player.

PLAYER_TYPE: {{PLAYER_TYPE}}
(built-in | custom)

========================================
PART 1 — Add Ad Layer (AnypointAdView)
========================================

The AnypointAdView sits between the video playback layer and the TV UI layer.

XML approach:
<RelativeLayout
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <!-- Your channel player view (bottom layer) -->
    <YourPlayerView
        android:id="@+id/channelPlayerView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <!-- Ad layer (middle layer) -->
    <tv.anypoint.api.ads.AnypointAdView
        android:id="@+id/linearTvAdView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <!-- Your TV UI layer (top layer) -->
</RelativeLayout>

Programmatic approach:
AnypointAdView adView = new AnypointAdView(context);
adView.setLayoutParams(new RelativeLayout.LayoutParams(
    RelativeLayout.LayoutParams.MATCH_PARENT,
    RelativeLayout.LayoutParams.MATCH_PARENT
));
rootLayout.addView(adView);

========================================
PART 2 — Ad Player Setup
========================================

If PLAYER_TYPE is "built-in":
  No setup needed. The SDK uses ExoPlayer internally.
  Make sure you have the sdk-multicast-exoplayer dependency.
  The SDK handles all ad playback automatically.

If PLAYER_TYPE is "custom":
  Implement the AnypointAdPlayer interface and register it:

  Java:
  CustomAdPlayer player = new CustomAdPlayer();
  AnypointAdView adView = findViewById(R.id.linearTvAdView);
  adView.setAdPlayer(player);

  AnypointAdPlayer interface requires these methods:
  - addCallback(AnypointAdPlayerCallback) / removeCallback(AnypointAdPlayerCallback)
  - load(PlaySet playSet) — Prepare playlist, call callback.onLoaded(firstUrl)
  - append(PlaySet playSet) — Add to queue
  - play() — Start, call callback.onPlay(url) on first play
  - pause() / resume() — call callback.onPause(url) / callback.onResume(url)
  - stop() — Stop, call callback.onStopped()
  - skipAd(long skipDurationMs) — Skip current by duration, return boolean
  - isAdPlaying() — Boolean
  - currentMediaUrl() — Current URL
  - getCurrentMediaUnitIndex() — Current ad index
  - getVolume() — Float 0.0-1.0
  - getProgress() — AdProgress(currentPlaytime, duration, currentAdPlaytime) or AdProgress.NOT_READY
  - mute() / unmute() — Mute/unmute ad audio
  - setVolume(float volume) — Set ad volume (0.0-1.0)
  - release() — Free resources

  AnypointAdPlayerCallback interface (passed via addCallback):
  - onLoaded(String mediaUrl) — Call when first media is prepared in load()
  - onPlay(String mediaUrl) — Call when first media starts playing in play()
  - onPause(String mediaUrl) — Call when ad is paused
  - onResume(String mediaUrl) — Call when ad is resumed
  - onStopped() — Call when ad is stopped
  - onError(String mediaUrl, Throwable t) — Call on playback error

========================================
CONSTRAINTS
========================================

- AnypointAdView must be positioned between the channel player and TV UI layers.
- For built-in player, no additional code is needed beyond the dependency.
- For custom player, you MUST call the appropriate callbacks (onLoaded, onPlay, onPause, onResume, onStopped) at the correct lifecycle points.
- The ad layer handles its own visibility — no need to toggle visibility manually.
```
