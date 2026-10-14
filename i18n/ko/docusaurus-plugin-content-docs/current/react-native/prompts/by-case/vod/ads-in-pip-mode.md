---
sidebar_position: 3
sidebar_label: PIP 모드 광고
---

# PIP 모드에서도 재생되는 VOD 광고

앱이 PIP(Picture-in-Picture) 모드에 있는 동안에도 VOD 광고가 계속 재생되어야 할 때 이 프롬프트를 사용하세요. 이를 위해 `setIgnoreAdBreakInPIPMode(false)`로 전환하여 브레이크를 앱의 플레이어 안에서 재생합니다. 동작하는 VOD 연동([react-native-video](./react-native-video.md) 또는 [Bitmovin](./bitmovin.md))에서 시작하세요. LLM은 앱이 이 모드를 사용할 수 있는지 먼저 확인한 뒤 기존 연동을 이 모드에 맞게 수정합니다. 배경 설명: [PIP 모드 지원](../../../getting-started/pip-mode-support.md#pip-모드에서-광고-지원하기).

| 파라미터 | 값 | 설명 |
|-----------|--------|-------------|
| `{{PLAYER_TYPE}}` | `react-native-video` \| `bitmovin` | VOD 콘텐츠를 재생하는 플레이어 라이브러리 |

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
- The user leaving the app and coming back is still reported to the SDK with
  notifyUserLeftApp().
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
  as a NEW player item.
- Bitmovin on iOS ignores this setting: its VOD breaks always play on the SDK's own ad
  player, exactly as in the default mode.
- Inline breaks (requestAd) always play on the SDK's own ad player, in every mode.
- Mid-rolls and post-rolls are requested in PIP too, and ads keep playing there.
- The pre-roll is NOT held by the SDK in this mode either. The app holds the content
  paused until the first 'completed' or 'error', exactly as in the default mode.
- A pause, seek or source change made by the app while a break runs lands on the player
  the AD is now playing on: the ad freezes, 'completed' never arrives, the content is
  never handed back, and only stop()/release() recover.
- When a break FAILS, the content is already back and playing when 'error' arrives. So
  the app's resume on a mid-roll 'error' (videoRef.current?.resume() / Bitmovin
  player.play()) lands on the content, not on an ad, and is a harmless safety net. It
  never pauses, seeks or re-sources.

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

Step 6 — Keep reporting the user leaving and coming back. The SDK hides the ad UI while
it is told the user is away, in every mode. Report it once for the whole app, whether or
not the app enters PIP:

  import {AppState} from 'react-native';
  import {notifyUserLeftApp} from '@anypoint/flower-sdk-react-native';

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') {
        notifyUserLeftApp(true).catch(() => {});
      } else if (state === 'active') {
        notifyUserLeftApp(false).catch(() => {});
      }
      // 'inactive' is transient: ignore it.
    });
    return () => subscription.remove();
  }, []);

  notifyPictureInPictureModeChanged is deprecated and replaced by notifyUserLeftApp.
  Existing calls keep working. If the app already reports PIP with
  notifyPictureInPictureModeChanged, replace those calls with this subscription. Same
  for every player, Bitmovin on Android included.
  Ads keep playing in PIP in this mode, so the content player may enter PIP during a
  break (enterPictureInPictureOnLeave need not be turned off for ads).
  Bitmovin on iOS: breaks still play on the SDK's ad player, so follow the default-mode
  PIP rules there (keep the content out of PIP during an ad).

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
