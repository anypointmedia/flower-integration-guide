---
sidebar_position: 2.5
sidebar_label: 광고 없는 PIP 모드(기본)
---

# VOD — 광고 없는 PIP 모드(기본)

VOD 앱이 기본 모드(`setIgnoreAdBreakInPIPMode(true)`)에서 PIP(Picture-in-Picture)를 지원할 때 이 프롬프트를 사용하세요. 기본 모드에서는 PIP 모드에서 광고가 노출되지 않습니다. PIP 모드로 광고를 회피하지 못하도록, 앱은 사용자가 홈 화면으로 가면 `notifyUserLeftApp(true)`로 앱을 떠났음을 알리고, 다시 앱으로 돌아오면 `notifyUserLeftApp(false)`로 복귀를 알립니다. 동작하는 VOD 연동([react-native-video](./react-native-video.md) 또는 [Bitmovin](./bitmovin.md))에서 시작하세요. PIP 모드에서도 VOD 광고가 계속 재생되게 하려면 [PIP 모드에서도 재생되는 VOD 광고](./ads-in-pip-mode.md)를 사용하세요. 배경 설명: [PIP 모드 지원](../../../getting-started/pip-mode-support.md#pip-모드에서의-광고-기본값).

:::danger 광고가 재생 중일 때
`'play'` 이벤트를 받은 뒤 `'completed'` 또는 `'error'`를 받기 전까지는, 사용자가 홈 화면으로 가더라도 본편 플레이어를 PIP 모드로 **전환하면 안 됩니다**. 이때도 앱은 `notifyUserLeftApp(true)`를 호출하며, SDK는 광고를 일시정지합니다. 사용자가 앱으로 돌아오면 앱은 **반드시** `notifyUserLeftApp(false)`를 호출해야 합니다. 그래야만 일시정지된 광고가 재개됩니다. 호출하지 않으면 광고는 일시정지된 채로 남습니다.
:::

| 파라미터 | 값 | 설명 |
|-----------|--------|-------------|
| `{{PLAYER_TYPE}}` | `react-native-video` \| `bitmovin` | VOD 콘텐츠를 재생하는 플레이어 라이브러리 |

````plain
Our React Native app already plays VOD ads with the FLOWER SDK (requestVodAd) in the
default mode, and supports PIP (Picture-in-Picture). Add PIP handling for that mode to
the code I provide. Modify the existing code; do not rewrite the app.

========================================
IMPORTANT — WHILE AN AD IS PLAYING
========================================

An ad is playing from the listener's 'play' event until its 'completed' or 'error'.
During that window:
  1. When the user goes to the home screen (or another app), the content player must
     NOT be switched to PIP — neither automatically nor from a PIP button. Otherwise
     PIP becomes a way around the ad.
  2. notifyUserLeftApp(true) is still called. The SDK pauses the ad and hides its UI.
  3. When the user comes back to the app, notifyUserLeftApp(false) MUST be called. Only
     then does the SDK resume the paused ad. Without it, the ad stays paused.

========================================
GOAL
========================================

- setIgnoreAdBreakInPIPMode stays at its default (true): ads are not shown in PIP mode.
- The user going to the home screen is reported with notifyUserLeftApp(true), and the
  user coming back with notifyUserLeftApp(false), whether or not the app enters PIP.
- The content player cannot enter PIP while an ad is playing.
- When no ad is playing, the content enters PIP as before.
- Nothing else in the VOD integration changes.

========================================
PARAMETERS
========================================

PLAYER_TYPE: {{PLAYER_TYPE}} (react-native-video | bitmovin)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- The default is setIgnoreAdBreakInPIPMode(true). VOD breaks play on the SDK's own ad
  player over the <Video>, and ads are not shown in PIP mode. Do not change the setting.
- notifyUserLeftApp(hasLeftApp) is app-wide, not per nativeID. true when the user leaves
  the app (home screen, another app, or the video moved to a PIP window), false when the
  user comes back.
- The SDK does NOT detect the user leaving or coming back by itself, with any
  PLAYER_TYPE. While an ad plays there is no PIP, so the SDK knows the user has left
  only because the app says so.
- notifyUserLeftApp(true) while an ad plays: the SDK pauses the ad and hides its UI; its
  progress does not advance and no quartile events are sent.
- notifyUserLeftApp(false): the ad resumes from where it stopped and plays to the end;
  the break then ends with 'completed' as usual, and the content continues.
- Until the user comes back, VOD mid-rolls and post-rolls are not requested.
- notifyPictureInPictureModeChanged is deprecated and replaced by notifyUserLeftApp.
  Existing calls keep working. Do not use it in new code; replace existing calls.
- Which window enters PIP is the OS's and the app's decision: on iOS the player layer the
  PIP controller is attached to (the content player), on Android the whole Activity.

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
      // ... keep the existing VOD handling ('prepare' -> play(nativeId), starting the
      // content on the first 'completed' or 'error', resume on a mid-roll 'error')
      // unchanged
    });
    return () => subscription.remove();
  }, [nativeId]);

  Merge this into the VOD component's EXISTING listener instead of adding a second one.

Step 2 — Report the user leaving and coming back, once for the whole app

  import {AppState} from 'react-native';
  import {notifyUserLeftApp} from '@anypoint/flower-sdk-react-native';

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') {
        notifyUserLeftApp(true).catch(() => {});    // home screen, another app, or PIP
      } else if (state === 'active') {
        notifyUserLeftApp(false).catch(() => {});   // back in the app: the ad resumes
      }
      // 'inactive' is transient (app switcher, system dialog): ignore it.
    });
    return () => subscription.remove();
  }, []);

  Put this in ONE place that lives as long as the app (the root component, or the screen
  that hosts the players), not in each player. Same for every PLAYER_TYPE and platform.
  If the app already reports PIP with notifyPictureInPictureModeChanged (for example from
  onPictureInPictureStatusChanged, <PlayerView>'s onPictureInPictureEnter/Exit, or a
  native module), remove those calls: this subscription replaces them.

Step 3 — react-native-video: keep the content out of PIP during an ad

  <Video
    ref={videoRef}
    nativeID={nativeId}
    ...existing props...
    // No automatic PIP on leaving while an ad plays.
    enterPictureInPictureOnLeave={!adPlaying}
  />

  If the app has its own PIP button calling videoRef.current?.enterPictureInPicture(),
  make it do nothing while adPlaying is true (disable or hide it).
  The app must already satisfy react-native-video's own PIP requirements (on Android the
  Activity declares PIP support; on iOS the audio background mode). Do not remove
  existing PIP configuration.

Step 4 — bitmovin: keep the content out of PIP during an ad

  Do not trigger PIP for the content while adPlaying is true, on either platform: neither
  the automatic PIP on leaving the app nor a PIP button. The notifyUserLeftApp()
  reporting from Step 2 applies here too, Android and iOS.

Step 5 — PIP entered by other means

  If the app enters PIP from its own native code (for example an Android Activity's
  enterPictureInPictureMode() from onUserLeaveHint()), make that code skip PIP while an
  ad plays as well. It needs no separate report: entering PIP takes the app to the
  background, which Step 2 already reports.

========================================
RULES
========================================

DO:
- Keep the content out of PIP from 'play' until 'completed' or 'error'.
- Call notifyUserLeftApp(true) when the user leaves the app, whether or not the app
  enters PIP.
- Call notifyUserLeftApp(false) EVERY time the user comes back. A missing false leaves
  the ad paused for good.
- Let the content enter PIP as before when no ad is playing.

DO NOT:
- Do NOT switch the content player to PIP while an ad is playing.
- Do NOT call setIgnoreAdBreakInPIPMode(false) in this case.
- Do NOT pause, seek or re-source the content as part of this handling; the SDK pauses
  and resumes the content around a mid-roll.
- Do NOT tie the report to PIP events only: during an ad there is no PIP to report.
- Do NOT report per nativeID or more than once per change.
- Do NOT use the deprecated notifyPictureInPictureModeChanged.

========================================
VERIFY
========================================

Android and iOS each, with {{PLAYER_TYPE}}:
1. Go home during the content (no ad): the content enters PIP; notifyUserLeftApp(true)
   is logged. Back in the app: notifyUserLeftApp(false) is logged.
2. Go home during the pre-roll or a mid-roll: the content does NOT enter PIP;
   notifyUserLeftApp(true) is logged and the ad pauses with its UI hidden.
3. Come back after step 2: notifyUserLeftApp(false) is logged, the ad resumes from where
   it stopped and completes, and the content then continues.
4. A PIP button pressed during an ad does nothing.
5. A mid-roll position passed while the user is away (content in PIP) plays no ad;
   after return, later breaks play normally.
6. Content ending while the user is away plays no post-roll.
7. Go home and come back several times during one ad: every leave and return is logged
   once, and the ad always resumes.

========================================
OUTPUT
========================================

- The modified VOD component and the place where the user leaving and returning is
  reported, as diffs.
- Every PIP entry point found (prop, button, native code) and how it is blocked while an
  ad plays.
````
