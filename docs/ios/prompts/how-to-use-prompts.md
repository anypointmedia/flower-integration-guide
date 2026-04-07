---
sidebar_position: 0
---

# How to Use These Prompts

This section contains prompts designed for LLM-assisted SDK integration. Each prompt can be copied and pasted into an AI coding assistant (Claude, ChatGPT, Copilot, etc.) along with your existing code.

## Choose Your Approach

### Integrated Prompt (Recommended for new projects)

Use **integrated-prompt.md** when:
- Starting SDK integration from scratch
- You want the LLM to generate all files at once
- Your project doesn't have any Flower SDK code yet

Fill in the parameters at the top, paste your existing Activity/ViewController code, and the LLM generates the complete integration.

### Step-by-Step Prompts (Recommended for existing projects)

Use individual step prompts when:
- Adding Flower SDK to an existing project incrementally
- You want to review each change before moving to the next
- A specific step failed and you need to retry just that part
- You're debugging an issue in a specific integration phase

## Step Overview

| Step | File | What It Does | When to Use Alone |
|------|------|-------------|-------------------|
| **Step 1** | `step-1-project-setup.md` | Add SDK dependency, configure network, initialize SDK | Build setup issues, SDK init problems |
| **Step 2** | `step-2-ad-ui-and-player.md` | Set up ad display layer, create/wrap video player | Player wrapping issues, layout problems |
| **Step 3** | `step-3-ad-integration.md` | Implement ad listener, request ads, start playback | Ad not showing, listener not firing, wrong ad config |
| **Step 4** | `step-4-cleanup.md` | Resource cleanup, PiP support | Memory leaks, PiP not working |

**Steps are incremental** — each step assumes the previous step is complete. Step 3's input should be the output of Step 2.

## Parameters to Fill In

Before using any prompt, replace the `{{...}}` placeholders:

### OTT/FAST Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `AD_TYPE` | `linear-tv` \| `vod` \| `interstitial` | Type of ad content |
| `APPROACH` | `flower-player` \| `media-player-hook` | Integration approach (see below) |
| `UI_FRAMEWORK` | `swiftui` \| `uikit` | iOS UI framework |

## Choosing APPROACH

### flower-player (Simplest)

The SDK wraps your player and handles everything internally.

- **Android**: `FlowerMedia3ExoPlayer`, `FlowerExoPlayer2`, `FlowerBitmovinPlayer`
- **iOS**: `FlowerAVPlayer` + `FlowerAVPlayerViewController` (UIKit) / `FlowerVideoPlayer` (SwiftUI)
- **HTML5**: `FlowerHls` (Linear TV only — VOD not supported)

**Best for**: Quick integration, standard player setups, when you don't need fine-grained ad control.

### media-player-hook (More Control)

You keep your original player. The SDK inserts ads via URL manipulation or separate ad requests.

- **Linear TV**: `changeChannelUrl()` returns a proxy URL with ads injected
- **VOD**: `requestVodAd()` manages pre/mid/post-roll ads
- **Interstitial**: `requestAd()` for standalone fullscreen ads

**Best for**: Custom player configurations, when you need to control ad timing, dual-player setups.

### media-player-adapter (Advanced)

Same as media-player-hook but you implement the full `MediaPlayerAdapter` interface instead of the simple `MediaPlayerHook` lambda/protocol. Use this when the SDK can't auto-detect your player type.

## Choosing AD_TYPE

| AD_TYPE | Description | Available Approaches |
|---------|-------------|---------------------|
| `linear-tv` | Live streaming with mid-roll ads | flower-player, media-player-hook, media-player-adapter |
| `vod` | Video-on-demand with pre/mid/post-roll | flower-player, media-player-hook |
| `interstitial` | Standalone fullscreen ad (no video player) | dedicated (no player needed) |

## Tips

- **Always provide your existing code** along with the prompt. The LLM modifies your code rather than generating from scratch.
- **Don't hardcode URLs** — use your config/intent data objects. The prompts guide this.
- **Check imports** — the prompts specify exact package paths. If the LLM uses wrong imports, re-run with the import section highlighted.
- **Test incrementally** — if using step-by-step, verify each step compiles before moving on.
