---
sidebar_position: 2
sidebar_label: Bitmovin
---

# Bitmovin 플레이어로 VOD 연동

`bitmovin-player-react-native`(`playerType: 'bitmovin'`)로 재생하는 주문형 콘텐츠에 프리롤, mid-roll, post-roll 광고를 추가할 때 이 프롬프트를 사용하세요. LLM은 프리롤이 끝날 때까지 Bitmovin 플레이어가 재생을 시작하지 않도록 하고, 그 이후에는 콘텐츠를 SDK에 맡기는 VOD 컴포넌트를 생성합니다. 배경 설명: [VOD 광고 구현](../../../ad-insertion/vod/vod-ad-implementation.md), [Bitmovin 플레이어 사용](../../../ad-insertion/using-bitmovin-player.md).

| 파라미터 | 예시 | 설명 |
|-----------|---------|-------------|
| `{{SDK_VERSION}}` | `1.0.4` | 설치할 `@anypoint/flower-sdk-react-native` 버전. 패키지가 이미 설치되어 있으면 무시됩니다. |

````plain
We are integrating the FLOWER SDK into our React Native app for VOD content played by
bitmovin-player-react-native (playerType: 'bitmovin'), in the default ad mode. Modify the
code I provide; do not generate a new app from scratch.

========================================
GOAL
========================================

A VOD component that:
  - creates the player with usePlayer({nativeId}) and loads the content url WITHOUT
    playing it,
  - puts the SAME id on an empty overlay <View nativeID> above <PlayerView>,
  - calls requestVodAd(..., playerType: 'bitmovin') from <PlayerView onReady>,
  - calls play(nativeId) on every 'prepare',
  - calls player.play() once, on the first 'completed' or 'error', and never pauses again,
  - calls player.play() again on a later 'error' while the content has not ended (a
    failed mid-roll),
  - calls notifyContentEnded() from onPlaybackFinished, and releases on unmount.

========================================
PARAMETERS
========================================

SDK_VERSION: {{SDK_VERSION}}

From the app's config objects (do NOT hardcode): contentUrl, adTagUrl, contentId,
durationMs (the REAL total duration in ms) — required; extraParams, adTagHeaders —
optional; the Bitmovin licence key (or keep it in Info.plist / AndroidManifest.xml).

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- One string addresses both the Bitmovin player (usePlayer({nativeId})) and the view the
  ad overlay mounts on. They MUST match, or the call rejects.
- The content url is never rewritten. Every break arrives as 'prepare' and waits for
  play(nativeId) from the Flower package.
- PRE-ROLL: the SDK does NOT pause the content for it. Bitmovin does not autoplay by
  default, so simply do not call player.play() until the first 'completed' or 'error'.
  The SDK sends 'completed' also when there is no pre-roll, no breaks, or the request
  fails, so the content always gets started.
- MID-ROLL: requested about 10 seconds before its position; 'prepare' arrives when
  playback reaches it. In the default mode the break plays on the SDK's own ad player
  over the content, and the SDK pauses the content and, at 'completed' or 'error',
  seeks it back 5 seconds and resumes it — through the Bitmovin player, on Android and on
  iOS alike.
- MID-ROLL 'error': the SDK stops the ad and issues that rewind and resume natively
  BEFORE it emits 'error'; the event then reaches JS asynchronously. The app still calls
  player.play() as a safety net. It normally finds the content already playing and
  changes nothing; it never seeks or reloads.
- POST-ROLL: requested after notifyContentEnded(nativeId); the content is not resumed —
  not after 'completed', not after 'error'.
- On iOS a Bitmovin VOD break ALWAYS plays on the SDK's own ad player, whatever
  setIgnoreAdBreakInPIPMode says. On Android it follows that setting (see the "Ads in
  PIP Mode" prompt for false).

========================================
SETUP — only what is missing
========================================

Flower package: .npmrc scope line
(@anypoint:registry=https://maven.anypoint.tv/repository/npm-registry/); npm install
@anypoint/flower-sdk-react-native@{{SDK_VERSION}} react-native-video; Android
useExoplayerIMA = true, media3Version = "1.8.0", repositories public-release and
jitpack.io, core library desugaring (desugar_jdk_libs:2.1.5), cleartext exception for
prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com; iOS pod install
(NSAllowsArbitraryLoads standing alone only if content is plain HTTP); initialize('Info')
once at startup.

Bitmovin (an Expo module; verified against 1.25.0, 1.19.0 declares the same registry API):
  - "expo" in dependencies; "babel-preset-expo" as the Babel preset
  - Android: maven { url "https://artifacts.bitmovin.com/artifactory/public-releases" };
    Expo autolinking in android/settings.gradle (includeBuild of expo-gradle-plugin,
    plugins id("expo-autolinking-settings"),
    ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand),
    expoAutolinking.useExpoModules(), expoAutolinking.useExpoVersionCatalog()) and
    apply plugin: "expo-root-project" in android/build.gradle
  - iOS: $FlowerSdkUseBitmovin = true ABOVE the Podfile target; use_expo_modules!;
    ExpoAppDelegate + ExpoReactNativeFactory; deployment target >= 16.4 (Expo SDK 57)
    on the app AND the flower-sdk-react-native pod, raised in post_install
  - A licence key registered for the app's bundle id / application id
Missing an Expo piece still builds, then fails at runtime as usePlayer being undefined.

========================================
IMPLEMENTATION
========================================

Step 1 — Imports, player, state

  import React, {useCallback, useEffect, useRef, useState} from 'react';
  import {StyleSheet, View} from 'react-native';
  import {PlayerView, SourceType, usePlayer} from 'bitmovin-player-react-native';
  import {
    addAdEventListenerFor,
    notifyContentEnded,
    play,
    release,
    requestVodAd,
  } from '@anypoint/flower-sdk-react-native';

  export function BitmovinVodPlayer({nativeId, config, licenseKey}) {
    const player = usePlayer({nativeId, licenseKey});   // no isAutoplayEnabled
    const [contentStarted, setContentStarted] = useState(false);
    const contentStartedRef = useRef(false);   // the same, readable from the listener
    const contentEnded = useRef(false);        // set from onPlaybackFinished
    const requested = useRef(false);

    const startContent = useCallback(() => {
      contentStartedRef.current = true;
      setContentStarted(true);
    }, []);
    ...
  }

Step 2 — Load the content (not played yet)

  useEffect(() => {
    // SourceType.HLS / DASH / PROGRESSIVE — whichever matches the content.
    player.load({url: config.contentUrl, type: SourceType.HLS});
  }, [player, config.contentUrl]);

Step 3 — Start the content once, after the pre-roll

  useEffect(() => {
    if (contentStarted) {
      player.play();
    }
  }, [player, contentStarted]);

Step 4 — Ad events

  useEffect(() => {
    const subscription = addAdEventListenerFor(nativeId, event => {
      if (event.event === 'prepare') {
        play(nativeId).catch(e => console.error(`play failed: ${e.message}`));
      } else if (event.event === 'completed') {
        startContent();   // first one only matters
      } else if (event.event === 'error') {
        console.error(`ad error: ${event.message}`);
        if (!contentStartedRef.current) {
          startContent();              // pre-roll failed: never leave the content held
        } else if (!contentEnded.current) {
          player.play();               // mid-roll failed: resume; no seek, no load
        }
        // post-roll failed: the content has ended, nothing to resume
      }
    });
    return () => subscription.remove();
  }, [nativeId, player, startContent]);

Step 5 — Request from onReady, once

  const onReady = useCallback(async () => {
    if (requested.current) return;
    requested.current = true;
    try {
      await requestVodAd(nativeId, {
        adTagUrl: config.adTagUrl,
        contentId: config.contentId,
        durationMs: config.durationMs,
        playerType: 'bitmovin',
        extraParams: config.extraParams,     // omit if not configured
        adTagHeaders: config.adTagHeaders,   // omit if not configured
      });
    } catch (e: any) {
      console.error(`requestVodAd failed: ${e.message}`);
      startContent();                      // no ad will come: do not hold the content
    }
  }, [nativeId, config, startContent]);

Step 6 — Release on unmount

  useEffect(
    () => () => {
      if (requested.current) {
        release(nativeId).catch(() => {});
      }
    },
    [nativeId],
  );

Step 7 — Render

  return (
    <View style={StyleSheet.absoluteFill}>
      <PlayerView
        player={player}
        style={StyleSheet.absoluteFill}
        onReady={onReady}
        onPlaybackFinished={() => {
          contentEnded.current = true;   // first: a post-roll error must not resume
          notifyContentEnded(nativeId).catch(e =>
            console.error(`notifyContentEnded failed: ${e.message}`),
          );
        }}
        onPlayerError={e => console.error(`player: ${e.message}`)}
        onSourceError={e => console.error(`source: ${e.message}`)}
      />
      {/* The ad overlay's host. Empty, separate from <PlayerView> on purpose. */}
      <View nativeID={nativeId} style={StyleSheet.absoluteFill} pointerEvents="box-none" />
    </View>
  );

========================================
RULES
========================================

DO:
- Use one string for usePlayer({nativeId}) and the overlay <View nativeID>.
- Pass playerType: 'bitmovin' to requestVodAd().
- Call player.play() for the content once, when contentStarted becomes true — and
  again only on an 'error' while the content has started and not ended.
- Set contentEnded in onPlaybackFinished before notifyContentEnded().

DO NOT:
- Do NOT call player.pause(), player.seek() or player.load() from 'prepare', 'play',
  'completed' or 'error', or anywhere around a break once the content has started. The
  SDK pauses, rewinds and resumes the content itself — on iOS too. player.play() on a
  mid-roll 'error' is the one allowed action; it never pauses.
- Do NOT call player.play() after a post-roll 'error'.
- Do NOT enable playbackConfig.isAutoplayEnabled; it plays the content under the pre-roll.
- Do NOT put nativeID on <PlayerView>, and do NOT give the overlay view children.
- Do NOT call requestVodAd() before onReady, or changeChannelUrl() for VOD.

========================================
VERIFY
========================================

Android and iOS each:
1. Pre-roll plays with no content audio underneath; content starts after 'completed'.
2. No pre-roll / empty response / failed request: the content still starts.
3. Mid-roll: content pauses at the position, ad plays, content resumes about 5 s earlier
   than where it stopped. The app issued no pause/seek.
4. Post-roll: plays after the content ends (onPlaybackFinished); content does not restart.
5. Ad error in a mid-roll: the content resumes (about 5 s earlier, from the SDK's own
   rewind); the app issued no seek or load.
6. Ad error in a post-roll: the content stays ended and does not restart.
7. Ad error in a pre-roll: the content starts from the beginning.
8. Unmount: release() runs and no overlay remains.

========================================
OUTPUT
========================================

- The full VOD component and the screen that mounts it.
- All setup changes as diffs.
- The SourceType chosen for the content, and assumptions about config names.
````
