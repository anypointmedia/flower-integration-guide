---
sidebar_position: 3
sidebar_label: Ads in PIP Mode
---

# VOD Ads That Keep Playing in PIP Mode

Use this prompt when VOD ads must keep playing while the app is in PIP (Picture-in-Picture) mode, which means switching to `setIgnoreAdBreakInPIPMode(false)` so breaks play inside the app's own player. Start from a working VOD integration ([react-native-video](./react-native-video.md) or [Bitmovin](./bitmovin.md)); the LLM adapts it to this mode and checks whether the app can use it at all. Background: [PIP Mode Support](../../../getting-started/pip-mode-support.md#supporting-ads-in-pip-mode).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `{{PLAYER_TYPE}}` | `react-native-video` \| `bitmovin` | Player library that plays the VOD content |

````plain
Our React Native app already plays VOD ads with the FLOWER SDK (requestVodAd). We want
VOD ads to keep playing in PIP mode. Adapt the code I provide to
setIgnoreAdBreakInPIPMode(false). Modify the existing code; do not rewrite the app.

========================================
GOAL
========================================

- setIgnoreAdBreakInPIPMode(false) once, before any ad request.
- The VOD component keeps the default-mode content rules (hold before the first start,
  never touch it after, except a plain resume on an 'error' while the content has not
  ended) and becomes robust to the content coming back as a new player item after each
  break.
- PIP entry/exit is still reported to the SDK.
- If the app cannot meet this mode's constraints, say so and keep the default mode.

========================================
PARAMETERS
========================================

PLAYER_TYPE: {{PLAYER_TYPE}} (react-native-video | bitmovin)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- setIgnoreAdBreakInPIPMode is app-wide and read when ads are requested, so it must be
  called before requestVodAd().
- With false, a VOD break plays INSIDE the app's player for:
    react-native-video on Android and iOS, and Bitmovin on Android.
  The SDK pauses that player, puts the ads in front of the content, plays them, and at
  the end of the break puts the content back at the interrupted position minus 5 seconds
  as a NEW player item:
    - react-native-video on iOS: a new AVPlayerItem built from the content url
    - react-native-video on Android: the original media item again, clipped to start at
      the resume point
    - Bitmovin on Android: the original source loaded again with a start offset
- Bitmovin on iOS ignores this setting: its VOD breaks always play on the SDK's own ad
  player, exactly as in the default mode.
- Inline breaks (requestAd) always play on the SDK's own ad player, in every mode.
- Mid-rolls and post-rolls are requested in PIP too, and ads keep playing there.
- The pre-roll is NOT held by the SDK in this mode either. The app holds the content
  paused until the first 'completed' or 'error', exactly as in the default mode.
- A pause, seek or source change made by the app while a break runs lands on the player
  the AD is now playing on: the ad freezes, 'completed' never arrives, the content is
  never handed back, and only stop()/release() recover.
- When a break FAILS, the SDK returns the player to the content (rewound, playing)
  natively BEFORE it emits 'error', and the event reaches JS asynchronously. So the
  app's resume on a mid-roll 'error' (videoRef.current?.resume() / Bitmovin
  player.play()) lands on the content, not on an ad, and is a safety net that normally
  changes nothing. It never pauses, seeks or re-sources.

Consequences for the app (react-native-video):
- iOS: onEnd does NOT fire after a break, because react-native-video's observers are
  bound to the item it loaded.
- Android: the ended state is also reported around breaks, so onEnd can fire when the
  content has not ended.
- Android: after a mid-roll, onProgress currentTime counts from the resume point, not
  from 0:00 of the content (Bitmovin on Android reloads at an offset and is not
  affected).
- iOS: settings applied to react-native-video's own item — source.headers, DRM, buffer
  and bitrate settings, selected audio and text tracks — are NOT carried over to the
  item the SDK puts back.

========================================
IMPLEMENTATION
========================================

Step 1 — Decide whether this mode fits. Inspect the code and answer first:
  a) Does the content need source.headers, DRM, buffer/bitrate settings or selected
     audio/text tracks on iOS?
  b) Does the app compute anything from onProgress position (resume points, progress
     bars, analytics) that must stay content-relative on Android?
  c) Does the app have a way to detect the end of the content other than
     react-native-video's onEnd?
  If (a) is yes, or (c) is no for react-native-video on iOS, STOP: report it and keep
  setIgnoreAdBreakInPIPMode(true). For (b), list each place that must be adapted.

Step 2 — Switch the mode once, at startup, before any ad request

  import {initialize, setIgnoreAdBreakInPIPMode} from '@anypoint/flower-sdk-react-native';

  useEffect(() => {
    initialize('Info').catch(e => console.error(`init failed: ${e.message}`));
    // Play VOD ads in the app's player so they keep playing in PIP mode.
    setIgnoreAdBreakInPIPMode(false).catch(e => console.error(e.message));
  }, []);

Step 3 — Keep the content rules of the existing VOD component unchanged
  - Content mounted held: react-native-video paused={!contentStarted}; Bitmovin calls
    player.play() only once contentStarted is true.
  - 'prepare' -> play(nativeId). 'completed' -> start the content (first one only).
  - 'error' -> content not started: start it; started and not ended (contentEnded from
    Step 5 is false): videoRef.current?.resume() / Bitmovin player.play(); ended: nothing.
  - Remove ANY other pause/seek/source change driven by ad events. This is the line that
    freezes ads in this mode.

Step 4 — Track whether a break is running

  const breakRunning = useRef(false);
  // in the ad event listener:
  //   'prepare'               -> breakRunning.current = true
  //   'completed' | 'error'   -> breakRunning.current = false

Step 5 — Notify the end of the content exactly once

  const contentEnded = useRef(false);
  const endContent = useCallback(() => {
    if (contentEnded.current || breakRunning.current || !contentStarted) return;
    contentEnded.current = true;
    notifyContentEnded(nativeId).catch(e => console.error(e.message));
  }, [nativeId, contentStarted]);

  react-native-video: onEnd={endContent}, and on iOS ALSO call endContent() from the
  app's own content-end signal found in Step 1 (c), because onEnd stops firing after the
  first break. Bitmovin (Android): onPlaybackFinished={endContent}.
  Do not compare positions against durationMs on Android after a mid-roll; they are
  relative to the resume point.
  contentEnded is also what keeps a post-roll 'error' from resuming the content (Step 3).

Step 6 — Keep reporting PIP. The SDK hides the ad UI while it is told the app is in PIP,
in every mode:

  react-native-video:
    onPictureInPictureStatusChanged={({isActive}) =>
      notifyPictureInPictureModeChanged(isActive).catch(() => {})}
  Ads keep playing in PIP in this mode, so the content player may enter PIP during a
  break (enterPictureInPictureOnLeave need not be turned off for ads).
  Bitmovin on Android: the SDK receives Bitmovin's own PIP events; no call is needed.
  Bitmovin on iOS: breaks still play on the SDK's ad player, so follow the default-mode
  PIP rules there (report PIP, keep the content out of PIP during an ad).

========================================
RULES
========================================

DO:
- Call setIgnoreAdBreakInPIPMode(false) before the first requestVodAd().
- Call notifyContentEnded() once per content, never during a break.
- Keep holding the content before its first start.

DO NOT:
- Do NOT pause, seek or change the source while a break runs, or from any ad event after
  the content has started. In this mode it freezes the ad. The plain resume on a mid-roll
  'error' is the one allowed action: by then the break is over and it never pauses.
- Do NOT resume the content after a post-roll 'error'.
- Do NOT rely on react-native-video's onEnd alone, or treat every onEnd as content end.
- Do NOT apply this mode if the iOS content depends on item-level settings (headers,
  DRM, tracks); keep the default mode instead.
- Do NOT expect inline breaks or Bitmovin on iOS to play in the app's player.

========================================
VERIFY
========================================

On Android and iOS, with {{PLAYER_TYPE}}:
1. Pre-roll: no content audio under it; content starts at 0:00 after 'completed'.
2. Mid-roll in the foreground: the ad plays in the content player; the content comes
   back about 5 s before where it stopped.
3. Enter PIP during a mid-roll: the ad keeps playing in PIP and completes; the content
   continues in PIP.
4. A mid-roll position reached while already in PIP: the break is requested and plays.
5. Post-roll: notifyContentEnded() is called exactly once (log it), after the real end of
   the content, and the post-roll plays — on iOS after at least one mid-roll too.
6. Android: no notifyContentEnded() call at the start or end of a break.
7. Ad error in a mid-roll: the content comes back and plays; nothing stays frozen; the
   app issued no seek. Ad error in a post-roll: the content stays ended.
8. Bitmovin on iOS only: breaks play on the SDK's overlay, as in the default mode.

========================================
OUTPUT
========================================

- The answers to Step 1, and a clear go / no-go for this mode.
- If go: the modified startup code and VOD component, as diffs.
- Every place that reads player position or item events and how it was adapted.
````
