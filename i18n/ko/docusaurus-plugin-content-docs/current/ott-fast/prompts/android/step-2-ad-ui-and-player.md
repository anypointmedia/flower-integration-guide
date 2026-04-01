---
sidebar_position: 2
---

# Step 2: 광고 UI 선언 및 플레이어 생성

이 프롬프트는 LLM이 광고 표시 뷰를 설정하고 비디오 플레이어를 생성하도록 안내합니다.

**사용 전:** `{{AD_TYPE}}`과 `{{APPROACH}}`를 입력하세요.

```plain
We are integrating the FLOWER SDK into our Android project.
This step sets up the ad display UI and creates the video player.

AD_TYPE: {{AD_TYPE}}
(linear-tv | vod | interstitial)

APPROACH: {{APPROACH}}
(flower-player | media-player-hook)
Note: For interstitial AD_TYPE, no APPROACH selection is needed.

========================================
PART 1 — Declare the Ad UI in Layout XML
========================================

If APPROACH is "flower-player":
    Only a standard player view is needed. FlowerPlayer manages ads internally.
    No separate FlowerAdView required in layout.

    <YourPlayerView
        android:id="@+id/playerView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
    />

If APPROACH is "media-player-hook":
    Add FlowerAdView overlaid on top of the player view.
    FlowerAdView must be placed AFTER the player view so it renders on top.
    Set visibility to "gone" — the SDK controls visibility automatically.

    <FrameLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent">

        <YourPlayerView
            android:id="@+id/playerView"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
        />

        <tv.anypoint.flower.android.sdk.api.FlowerAdView
            android:id="@+id/flowerAdView"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:visibility="gone"
        />
    </FrameLayout>

If AD_TYPE is "interstitial":
    Only FlowerAdView is needed. No video player required.

    <FrameLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent">

        <!-- Your original content -->

        <tv.anypoint.flower.android.sdk.api.FlowerAdView
            android:id="@+id/flowerAdView"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
        />
    </FrameLayout>

========================================
IMPORTS — Required packages for FlowerPlayer wrappers
========================================

All FlowerPlayer wrappers are in the android-sdk package:

  import tv.anypoint.flower.android.sdk.api.FlowerExoPlayer2        // for legacy ExoPlayer
  import tv.anypoint.flower.android.sdk.api.FlowerMedia3ExoPlayer   // for Media3 ExoPlayer
  import tv.anypoint.flower.android.sdk.api.FlowerBitmovinPlayer    // for Bitmovin Player
  import tv.anypoint.flower.android.sdk.api.FlowerAdView            // for media-player-hook

Use only the import that matches your player. For example, if using Media3 ExoPlayer,
import FlowerMedia3ExoPlayer only.

========================================
PART 2 — Create Player Instance (in Activity/Fragment)
========================================

If APPROACH is "flower-player":
    Create a standard ExoPlayer, then wrap it with FlowerExoPlayer2 (or FlowerMedia3ExoPlayer, FlowerBitmovinPlayer).
    The wrapped player is what you assign to your player view.

    Kotlin:
    val exoPlayer = ExoPlayer.Builder(this)
        .setLoadControl(
            DefaultLoadControl.Builder()
                .setBufferDurationsMs(
                    DefaultLoadControl.DEFAULT_MIN_BUFFER_MS,
                    DefaultLoadControl.DEFAULT_MAX_BUFFER_MS,
                    DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_MS,
                    DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS
                )
                .build()
        )
        .build()

    // Wrap with FlowerExoPlayer2
    player = FlowerExoPlayer2(exoPlayer, this)
    playerView.player = player

If APPROACH is "media-player-hook":
    Create a standard ExoPlayer (NOT wrapped). Also get a reference to FlowerAdView.

    Kotlin:
    player = ExoPlayer.Builder(this)
        .setLoadControl(DefaultLoadControl.Builder().build())
        .build()

    playerView.player = player
    flowerAdView = findViewById(R.id.flowerAdView)

If AD_TYPE is "interstitial":
    No player creation needed. Just get a reference to FlowerAdView.

    Kotlin:
    flowerAdView = findViewById(R.id.flowerAdView)

========================================
CONSTRAINTS
========================================

- FlowerAdView must have android:visibility="gone" in XML when used with media-player-hook.
- For flower-player, always pass the Activity context as the second argument to FlowerExoPlayer2/FlowerMedia3ExoPlayer.
- Supported FlowerPlayer types: FlowerExoPlayer2, FlowerMedia3ExoPlayer, FlowerBitmovinPlayer.
```
