---
sidebar_position: 1
sidebar_label: PIP 모드 지원
---

# PIP 모드 지원 (기본 모드)

이미 Flower 광고를 재생하는 앱이 PIP(Picture-in-Picture)도 지원한다면 이 프롬프트를 사용하세요. 기본 모드에서는 PIP 모드에서 광고가 재생되지 않으므로, 앱이 PIP 상태 변경을 SDK에 알리고 광고 재생 중에는 콘텐츠가 PIP로 전환되지 않도록 합니다. 위의 모든 케이스에 적용됩니다. PIP 모드에서도 VOD 광고가 계속 재생되게 하려면 [PIP 모드에서도 재생되는 VOD 광고](../vod/ads-in-pip-mode.md)를 사용하세요. 배경 설명: [PIP 모드 지원](../../../getting-started/pip-mode-support.md).

| 파라미터 | 값 | 설명 |
|-----------|--------|-------------|
| `{{PLAYER_TYPE}}` | `react-native-video` \| `bitmovin` | 콘텐츠를 재생하는 플레이어 라이브러리 |

````plain
Our React Native app plays FLOWER ads and supports PIP (Picture-in-Picture). Add PIP
handling for the SDK's default mode to the code I provide. Modify the existing code.

========================================
GOAL
========================================

- Every PIP entry and exit is reported with notifyPictureInPictureModeChanged().
- The content player cannot enter PIP while an ad is playing.
- Nothing else in the ad integration changes.

========================================
PARAMETERS
========================================

PLAYER_TYPE: {{PLAYER_TYPE}} (react-native-video | bitmovin)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- The default is setIgnoreAdBreakInPIPMode(true). Do not change it in this case.
- The SDK does NOT detect PIP mode by itself. The only exception is Bitmovin on Android,
  where the SDK receives Bitmovin's own PIP events.
- notifyPictureInPictureModeChanged(isInPictureInPictureMode) is app-wide, not per
  nativeID. Report BOTH moments: true on entry, false on exit.
- When the app reports true while an ad plays, the SDK pauses the ad and hides its UI;
  its progress does not advance and no quartile events are sent. When the app reports
  false, the ad resumes from where it stopped and plays to the end.
- While the app is in PIP, VOD mid-rolls and post-rolls are not requested.
- Linear TV ads spliced into the stream keep playing in PIP; only the ad UI is hidden.
  A channel pre-roll (prerollAdTagUrl) is paused and resumed like a VOD ad.
- Which window enters PIP is the OS's and the app's decision: on iOS the player layer the
  PIP controller is attached to (the content player), on Android the whole Activity.
  While an ad plays, the content must not enter PIP, or PIP becomes a way around the ad.

========================================
IMPLEMENTATION
========================================

Step 1 — Track whether an ad is playing, per player

  const [adPlaying, setAdPlaying] = useState(false);

  useEffect(() => {
    const subscription = addAdEventListenerFor(nativeId, event => {
      if (event.event === 'play') {
        setAdPlaying(true);
      } else if (event.event === 'completed' || event.event === 'error') {
        setAdPlaying(false);
      }
      // ... keep the existing handling ('prepare' -> play(nativeId), etc.) unchanged
    });
    return () => subscription.remove();
  }, [nativeId]);

  Merge this into the component's EXISTING listener instead of adding a second one, and
  do not change what that listener already does for VOD or inline breaks.

Step 2 — react-native-video: report PIP and keep the content out of PIP during an ad

  import {notifyPictureInPictureModeChanged} from '@anypoint/flower-sdk-react-native';

  <Video
    nativeID={nativeId}
    ...existing props...
    // Keep the content out of PIP while an ad plays.
    enterPictureInPictureOnLeave={!adPlaying}
    // Report both entering and exiting PIP.
    onPictureInPictureStatusChanged={({isActive}) =>
      notifyPictureInPictureModeChanged(isActive).catch(() => {})
    }
  />

  The app must already satisfy react-native-video's own PIP requirements (on Android
  the Activity declares PIP support; on iOS the audio background mode). Do not remove
  existing PIP configuration.

Step 3 — bitmovin

  Android: the SDK follows Bitmovin's own PIP events; no notify call is needed.
  iOS: report PIP from <PlayerView>:

    <PlayerView
      player={player}
      ...existing props...
      onPictureInPictureEnter={() => notifyPictureInPictureModeChanged(true).catch(() => {})}
      onPictureInPictureExit={() => notifyPictureInPictureModeChanged(false).catch(() => {})}
    />

  On both platforms, do not trigger PIP for the content while adPlaying is true.

Step 4 — PIP entered by other means

  If the app enters PIP from its own native code (for example an Android Activity's
  onPictureInPictureModeChanged), send that change to JS and call
  notifyPictureInPictureModeChanged(true/false) there in the same way. Report each change
  once, from one place.

Step 5 — Several players on one screen

  PIP is app-wide: report it once, not once per player. Keep adPlaying per player
  (per nativeId) and block PIP while ANY player is showing an ad.

========================================
RULES
========================================

DO:
- Report every entry AND exit; a missing exit leaves an ad paused for good.
- Keep the content out of PIP while an ad plays.

DO NOT:
- Do NOT call setIgnoreAdBreakInPIPMode(false) in this case.
- Do NOT pause, seek or re-source the content as part of PIP handling around a VOD break.
- Do NOT report PIP per nativeID or more than once per change.
- Do NOT call notifyPictureInPictureModeChanged for Bitmovin on Android.

========================================
VERIFY
========================================

Android and iOS each, with {{PLAYER_TYPE}}:
1. Leave the app during content (no ad): the content enters PIP; true is reported. Back
   in the app: false is reported.
2. Leave the app during an ad: the content does NOT enter PIP; if the app enters PIP
   anyway, the ad pauses with its UI hidden, and resumes from the same point on return.
3. VOD: a mid-roll position passed while in PIP plays no ad; after return, later breaks
   play normally.
4. VOD post-roll: content ending while in PIP plays no post-roll.
5. Linear (if used): a spliced break keeps playing in PIP with the ad UI hidden.

========================================
OUTPUT
========================================

- The modified components as diffs, and where PIP changes are reported.
- Any native PIP entry point found and how it reports to the SDK.
````
