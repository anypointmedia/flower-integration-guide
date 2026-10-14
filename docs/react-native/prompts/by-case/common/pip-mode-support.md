---
sidebar_position: 1
sidebar_label: PIP Mode Support
---

# PIP Mode Support (Default Mode)

Use this prompt when an app that already plays Flower ads also supports PIP (Picture-in-Picture). In the default mode ads do not play in PIP, so the app keeps the content out of PIP while an ad plays and reports to the SDK every time the user leaves the app and comes back, whether or not it enters PIP. It applies to every case above. To make VOD ads keep playing in PIP instead, use [VOD Ads That Keep Playing in PIP Mode](../vod/ads-in-pip-mode.md). Background: [PIP Mode Support](../../../getting-started/pip-mode-support.md).

| Parameter | Values | Description |
|-----------|--------|-------------|
| `{{PLAYER_TYPE}}` | `react-native-video` \| `bitmovin` | Player library that plays the content |

````plain
Our React Native app plays FLOWER ads and supports PIP (Picture-in-Picture). Add PIP
handling for the SDK's default mode to the code I provide. Modify the existing code.

========================================
GOAL
========================================

- Every time the user leaves the app and comes back is reported with
  notifyUserLeftApp(), whether or not the app enters PIP.
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
- notifyUserLeftApp(hasLeftApp) is app-wide, not per nativeID. Report BOTH moments:
  true when the user leaves the app (home screen, another app, or the video moved to a
  PIP window), false when the user comes back.
- The SDK does NOT detect the user leaving the app by itself, with any PLAYER_TYPE.
- Report leaving whether or not the app enters PIP. While an ad plays the content must
  not enter PIP, so when the user leaves during an ad there is no PIP at all, and the
  SDK knows the user has left only because the app says so.
- notifyPictureInPictureModeChanged() is deprecated and replaced by notifyUserLeftApp().
  Do not use it in new code; replace existing calls.
- When the app reports true while an ad plays, the SDK pauses the ad and hides its UI;
  its progress does not advance and no quartile events are sent. When the app reports
  false, the ad resumes from where it stopped and plays to the end.
- Until the user comes back, VOD mid-rolls and post-rolls are not requested.
- Linear TV ads spliced into the stream keep playing while the user is away; only the
  ad UI is hidden. A channel pre-roll (prerollAdTagUrl) is paused and resumed like a
  VOD ad.
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

Step 2 — Report the user leaving and coming back, once for the whole app

  import {AppState} from 'react-native';
  import {notifyUserLeftApp} from '@anypoint/flower-sdk-react-native';

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') {
        notifyUserLeftApp(true).catch(() => {});
      } else if (state === 'active') {
        notifyUserLeftApp(false).catch(() => {});
      }
      // 'inactive' is transient (app switcher, system dialog): ignore it.
    });
    return () => subscription.remove();
  }, []);

  Put this in ONE place that lives as long as the app (the root component, or the screen
  that hosts the players), not in each player. Same for every PLAYER_TYPE and platform.
  If the app already reports PIP with notifyPictureInPictureModeChanged (for example from
  onPictureInPictureStatusChanged, <PlayerView>'s onPictureInPictureEnter/Exit, or a
  native module), remove those calls: the AppState subscription replaces them.

Step 3 — react-native-video: keep the content out of PIP during an ad

  <Video
    nativeID={nativeId}
    ...existing props...
    // Keep the content out of PIP while an ad plays.
    enterPictureInPictureOnLeave={!adPlaying}
  />

  The app must already satisfy react-native-video's own PIP requirements (on Android
  the Activity declares PIP support; on iOS the audio background mode). Do not remove
  existing PIP configuration.

Step 4 — bitmovin: keep the content out of PIP during an ad

  Do not trigger PIP for the content while adPlaying is true, on either platform. The
  notifyUserLeftApp() reporting from Step 2 applies here too, Android included.

Step 5 — PIP entered by other means

  If the app enters PIP from its own native code (for example an Android Activity's
  enterPictureInPictureMode()), make that code skip PIP while an ad plays as well. It
  needs no separate report: entering PIP takes the app to the background, which Step 2
  already reports.

Step 6 — Several players on one screen

  notifyUserLeftApp is app-wide: report it once, not once per player. Keep adPlaying per
  player (per nativeId) and block PIP while ANY player is showing an ad.

========================================
RULES
========================================

DO:
- Report every leave AND return; a missing return leaves an ad paused for good.
- Report leaving whether or not the app enters PIP.
- Keep the content out of PIP while an ad plays.

DO NOT:
- Do NOT call setIgnoreAdBreakInPIPMode(false) in this case.
- Do NOT pause, seek or re-source the content as part of this handling around a VOD break.
- Do NOT report per nativeID or more than once per change.
- Do NOT tie the report to PIP events only: during an ad there is no PIP to report.
- Do NOT use the deprecated notifyPictureInPictureModeChanged.

========================================
VERIFY
========================================

Android and iOS each, with {{PLAYER_TYPE}}:
1. Leave the app during content (no ad): the content enters PIP; true is reported. Back
   in the app: false is reported.
2. Leave the app during an ad: the content does NOT enter PIP; true is still reported, the
   ad pauses with its UI hidden, and on return false is reported and the ad resumes from
   the same point.
3. Switch to another app or the home screen with PIP off: true on leaving, false on return.
4. VOD: a mid-roll position passed while the user is away plays no ad; after return,
   later breaks play normally.
5. VOD post-roll: content ending while the user is away plays no post-roll.
6. Linear (if used): a spliced break keeps playing while the user is away, with the ad
   UI hidden.

========================================
OUTPUT
========================================

- The modified components as diffs, and where the user leaving and returning is reported.
- Any native PIP entry point found and how it keeps the content out of PIP during an ad.
````
