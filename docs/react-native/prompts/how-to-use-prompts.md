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

Fill in the parameters at the top, paste your existing component code, and the LLM generates the complete integration.

### Step-by-Step Prompts (Recommended for existing projects)

Use individual step prompts when:
- Adding Flower SDK to an existing React Native app incrementally
- You want to review each change before moving to the next
- A specific step failed and you need to retry just that part
- You're debugging an issue in a specific integration phase

## Step Overview

| Step | File | What It Does | When to Use Alone |
|------|------|-------------|-------------------|
| **Step 1** | `step-1-project-setup.md` | Configure the registry, install the package, apply the Android/iOS native settings, initialize the SDK | Install or build failures, SDK init problems |
| **Step 2** | `step-2-ad-ui-and-player.md` | Mount the `<Video>` with a `nativeID` and wire the two-phase handover | Player not found, overlay not visible |
| **Step 3** | `step-3-ad-integration.md` | Subscribe to ad events and request ads by content type | Ad not showing, events not firing, wrong ad config |
| **Step 4** | `step-4-cleanup.md` | Release sessions and remove subscriptions on unmount | Memory leaks, overlay outliving the player |

**Steps are incremental** — each step assumes the previous step is complete. Step 3's input should be the output of Step 2.

## Parameters to Fill In

Before using any prompt, replace the `{{...}}` placeholders:

| Parameter | Values | Description |
|-----------|--------|-------------|
| `AD_TYPE` | `linear-tv` \| `vod` \| `interstitial` | Type of ad content |
| `PLAYER_TYPE` | `react-native-video` \| `bitmovin` | Which player library owns the view |
| `SDK_VERSION` | e.g. `1.0.1` | Version of `@anypoint/flower-sdk-react-native` to install |

## Choosing AD_TYPE

| AD_TYPE | Description | Function | Who starts the break |
|---------|-------------|----------|----------------------|
| `linear-tv` | Live channel / FAST, with the stream URL rewritten to a local proxy | `changeChannelUrl()` | The SDK, scheduled by the cue in the stream |
| `vod` | Video-on-demand with pre/mid/post-roll. The content URL is never rewritten. | `requestVodAd()` | Your app, via `play()` |
| `interstitial` | Standalone inline break on the SDK's own ad player | `requestAd()` | Your app, via `play()` |

## Choosing PLAYER_TYPE

### react-native-video (Default)

Needs no extra package beyond `react-native-video` itself, and no `playerType` argument — it is the default. **Best for**: almost every app.

### bitmovin

Drives a `bitmovin-player-react-native` player instead. Requires a Bitmovin licence, an extra Gradle repository, a Podfile flag, and Expo modules wired up on **both** platforms — Gradle autolinking on Android, the Podfile and app delegate on iOS. **Best for**: apps that already ship the Bitmovin player.

## Tips

- **Always provide your existing code** along with the prompt. The LLM modifies your code rather than generating from scratch.
- **Don't hardcode URLs** — use your config objects. The prompts guide this.
- **The `nativeID` is the whole addressing model.** If the LLM tries to use a `ref` to identify the player, re-run with that section highlighted.
- **Test incrementally** — if using step-by-step, verify each step builds before moving on.
