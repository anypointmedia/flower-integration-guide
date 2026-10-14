---
sidebar_position: 1
sidebar_label: 인라인 / 전면 광고
---

# 인라인 / 전면 광고

에피소드 사이, 화면 전환 시점, 전체 화면 전면 광고 등 앱이 정한 시점에 `requestAd()`로 독립적인 광고 브레이크를 보여줄 때 이 프롬프트를 사용하세요. 브레이크는 항상 오버레이 안의 SDK 자체 광고 플레이어에서 재생되며, 그 전후로 앱이 자신의 콘텐츠를 일시정지하고 재개합니다. 배경 설명: [인라인 광고 구현](../../../ad-insertion/advanced-ad-formats/inline-ad-implementation.md).

| 파라미터 | 예시 | 설명 |
|-----------|---------|-------------|
| `{{SDK_VERSION}}` | `1.0.3` | 설치할 `@anypoint/flower-sdk-react-native` 버전. 패키지가 이미 설치되어 있으면 무시됩니다. |
| `{{PLAYER_TYPE}}` | `react-native-video` \| `bitmovin` | 오버레이가 마운트될 뷰를 소유한 플레이어 라이브러리 |
| `{{TRIGGER}}` | 예: "when the episode ends" | 앱 흐름에서 브레이크가 들어갈 위치 |

````plain
We are integrating FLOWER inline (interstitial) ads into our React Native app with
requestAd(). Modify the code I provide; do not generate a new app from scratch.

========================================
GOAL
========================================

At {{TRIGGER}}, request an inline break over the view addressed by nativeID; when it is
ready, pause our content (if any is playing) and play the break; when it ends, fails or
is skipped, resume the content and stop the break; release on unmount.

========================================
PARAMETERS
========================================

SDK_VERSION: {{SDK_VERSION}}
PLAYER_TYPE: {{PLAYER_TYPE}} (react-native-video | bitmovin)
TRIGGER:     {{TRIGGER}}

From the app's config objects (do NOT hardcode): adTagUrl (required); extraParams and
adTagHeaders (optional).

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- requestAd() does NOT need the content player to exist. Only the view carrying the
  nativeID is looked up, so it can be called as soon as that view is mounted.
- The break ALWAYS plays on the SDK's own ad player, in an overlay that fills the view
  carrying the nativeID — in every mode, on every player. setIgnoreAdBreakInPIPMode
  does not move it into the app's player.
- The SDK never touches the content player here. Pausing and resuming the content around
  the break is the app's job.
- The break arrives as 'prepare' and waits for play(nativeId). It ends with 'completed'
  or 'error'. A request with no ad reports 'adBreakSkipped' (reason 1 = No Ad) and then
  'completed', without a 'prepare'.
- playerType still matters: it decides which kind of view is looked up. With 'bitmovin'
  the id goes on an empty overlay <View nativeID> above <PlayerView>.
- With the default setIgnoreAdBreakInPIPMode(true), an ad playing when the app reports
  PIP is paused until the app reports it is back.

========================================
SETUP — only if the package is not installed yet
========================================

.npmrc scope line (@anypoint:registry=https://maven.anypoint.tv/repository/npm-registry/);
npm install @anypoint/flower-sdk-react-native@{{SDK_VERSION}} react-native-video;
Android: useExoplayerIMA = true (MANDATORY), media3Version = "1.8.0", repositories
maven.anypoint.tv/repository/public-release and jitpack.io, core library desugaring
(desugar_jdk_libs:2.1.5), cleartext exception for
prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com; iOS: pod install;
initialize('Info') once at startup. For bitmovin, the Bitmovin/Expo setup from the
"Using the Bitmovin Player" guide must already be in place.

========================================
IMPLEMENTATION
========================================

Step 1 — Imports and state

  import React, {useCallback, useEffect, useState} from 'react';
  import {StyleSheet, View} from 'react-native';
  import Video from 'react-native-video';
  import {
    addAdEventListenerFor,
    play,
    release,
    requestAd,
    stop,
  } from '@anypoint/flower-sdk-react-native';

  export function InlineAdHost({nativeId, contentUrl, config}) {
    const [paused, setPaused] = useState(false);
    ...
  }

Step 2 — Ad events

  useEffect(() => {
    const subscription = addAdEventListenerFor(nativeId, event => {
      switch (event.event) {
        case 'prepare':
          setPaused(true);   // the app pauses its own content for an inline break
          play(nativeId).catch(e => console.error(`play failed: ${e.message}`));
          break;
        case 'completed':
          setPaused(false);
          stop(nativeId).catch(() => {});
          break;
        case 'error':
          setPaused(false);  // never strand the viewer on a frozen frame
          stop(nativeId).catch(() => {});
          console.error(`ad error: ${event.message}`);
          break;
        case 'adBreakSkipped':
          setPaused(false);
          console.log(`ad break skipped, reason ${event.reason}`);
          break;
      }
    });
    return () => subscription.remove();
  }, [nativeId]);

Step 3 — Request at the trigger

  const showAd = useCallback(async () => {
    try {
      await requestAd(nativeId, {
        adTagUrl: config.adTagUrl,
        extraParams: config.extraParams,     // omit if not configured
        adTagHeaders: config.adTagHeaders,   // omit if not configured
        // playerType: 'bitmovin',           // only for PLAYER_TYPE "bitmovin"
      });
    } catch (e: any) {
      console.error(`requestAd failed: ${e.message}`);   // no view with that nativeID
    }
  }, [nativeId, config]);

  Call showAd() at {{TRIGGER}}. It needs the view to be mounted, nothing more.

Step 4 — Release on unmount

  useEffect(
    () => () => {
      release(nativeId).catch(() => {});
    },
    [nativeId],
  );

Step 5 — Render (react-native-video)

  <View style={styles.player}>
    <Video
      nativeID={nativeId}
      source={{uri: contentUrl}}
      style={StyleSheet.absoluteFill}
      resizeMode="contain"
      paused={paused}
    />
  </View>

  For a FULL-SCREEN interstitial, address a full-screen view: the overlay fills exactly
  the view carrying the nativeID.

  Bitmovin: keep <PlayerView> as is, add an empty
  <View nativeID={nativeId} style={StyleSheet.absoluteFill} pointerEvents="box-none" />
  over it (same string as usePlayer({nativeId})), and pause/resume the content with
  player.pause() / player.play() instead of the paused prop.

========================================
RULES
========================================

DO:
- Pause the content on 'prepare' and resume it on 'completed', 'error' AND
  'adBreakSkipped'.
- Call stop(nativeId) after 'completed' or 'error'.
- Keep each nativeID unique on screen.

DO NOT:
- Do NOT wait for onLoad before requestAd(); it is not needed here.
- Do NOT expect the break to play inside the content player, even with
  setIgnoreAdBreakInPIPMode(false).
- Do NOT put the nativeID on <PlayerView> for bitmovin.
- Do NOT use this prompt's pause/resume pattern for VOD breaks (requestVodAd); VOD has
  its own rules. This prompt does not cover running VOD and inline sessions on the
  same nativeID.

========================================
VERIFY
========================================

Android and iOS each:
1. At {{TRIGGER}} the break plays in the overlay; the content is paused under it.
2. After 'completed' the content resumes and the overlay is gone.
3. No ad (adBreakSkipped, reason 1): the content resumes immediately.
4. Ad error: the content resumes; nothing stays frozen.
5. Full-screen case: the overlay covers the whole screen.
6. PIP (if the app supports it): with the default mode, an ad playing when PIP is
   reported pauses, and resumes when the app comes back.
7. Unmount during a break: release() runs and the overlay goes with it.

========================================
OUTPUT
========================================

- The modified component(s) and where showAd() is called.
- Setup changes as diffs, if any.
- Assumptions about config names.
````
