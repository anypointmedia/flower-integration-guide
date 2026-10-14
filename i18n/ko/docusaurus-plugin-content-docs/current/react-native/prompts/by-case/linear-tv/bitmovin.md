---
sidebar_position: 2
sidebar_label: Bitmovin
---

# Bitmovin 플레이어로 Linear TV / FAST 연동

실시간 채널이나 FAST 스트림을 `bitmovin-player-react-native`(`playerType: 'bitmovin'`)로 재생할 때 이 프롬프트를 사용하세요. LLM은 Expo/Bitmovin 설정과, Bitmovin 플레이어와 광고 오버레이 뷰가 하나의 id를 공유하는 채널 컴포넌트를 생성합니다. 배경 설명: [Bitmovin 플레이어 사용](../../../ad-insertion/using-bitmovin-player.md), [Linear TV 광고 구현](../../../ad-insertion/linear-tv-fast/linear-tv-implementation.md).

| 파라미터 | 예시 | 설명 |
|-----------|---------|-------------|
| `{{SDK_VERSION}}` | `1.0.4` | 설치할 `@anypoint/flower-sdk-react-native` 버전. 패키지가 이미 설치되어 있으면 무시됩니다. |

````plain
We are integrating the FLOWER SDK into our React Native app for a LINEAR TV / FAST
channel played by bitmovin-player-react-native (playerType: 'bitmovin'). Modify the code
I provide; do not generate a new app from scratch.

========================================
GOAL
========================================

A channel component that:
  - creates the Bitmovin player with usePlayer({nativeId}) and loads the ORIGINAL url,
  - puts the SAME id on an empty overlay <View nativeID> above <PlayerView>,
  - hands the player to the SDK with changeChannelUrl(..., playerType: 'bitmovin'),
  - loads and plays the proxy url the SDK returns,
  - optionally plays a channel pre-roll first, and releases the session on unmount,
  - on an ad 'error', ends the ad session and starts the channel over.

========================================
PARAMETERS
========================================

SDK_VERSION: {{SDK_VERSION}}

From the app's config objects (do NOT hardcode): videoUrl, adTagUrl, channelId (required);
prerollAdTagUrl, extraParams, adTagHeaders, channelStreamHeaders (optional); the Bitmovin
licence key (or keep it in Info.plist / AndroidManifest.xml).

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- One string addresses two things: the key usePlayer({nativeId}) registers the player
  under, and the nativeID of the view the ad overlay mounts on. They MUST be the same
  string, or the call rejects saying no player is registered under that id.
- The SDK adds its ad UI as a native child of the view carrying the id. Put the id on a
  plain, EMPTY <View> layered over <PlayerView>, never on <PlayerView> itself.
- The player comes from usePlayer(), so it exists once the hook has run. Hand it over
  from <PlayerView onReady>.
- The SDK starts every linear break itself. The app never calls play() from the Flower
  package for a linear break, and never pauses the content for one.
- With prerollAdTagUrl, the pre-roll runs first and 'completed' marks its end (also when
  it fails). Load the proxy url from that 'completed'. A failed pre-roll never sends
  'error', so it needs no restart.
- Every changeChannelUrl() call starts a new session: the SDK stops the one running for
  that id (a pre-roll still playing included) and requests the pre-roll of the new call.
  Switching to a channel with its own prerollAdTagUrl holds its proxy url again.
- By default (setIgnoreAdBreakInPIPMode(true)) a running channel pre-roll pauses when the
  user leaves the app and resumes on return, like a VOD ad, if the app reports both
  moments with notifyUserLeftApp() on Android and iOS (see the PIP prompt).
- An 'error' on a channel means the SDK could not keep its ads in the stream. The
  recovery is a restart: await stop(nativeId) - it ends the ad session but, unlike
  release(), keeps the overlay and the subscription - then call changeChannelUrl()
  again with exactly the same params (prerollAdTagUrl included) and handle the NEW
  proxy url it returns as on the first start: load it and play it from onReady as usual.
- If the channel has not changed, the pre-roll is skipped, so a restart does not show it
  again: 'completed' arrives right after the call resolves, so a proxy url held until 'completed' plays exactly as on the first start.
- stop() ends any break in progress, and that break may still report 'completed' after
  the 'error', even after stop() resolved. The 'completed' handling must be idempotent.
- Bitmovin does not autoplay by default, and player.play() before a source is ready is a
  no-op. Play from onReady, every time a source becomes ready.

========================================
SETUP — only what is missing
========================================

Flower package (skip if installed and building):
  - .npmrc: @anypoint:registry=https://maven.anypoint.tv/repository/npm-registry/
  - npm install @anypoint/flower-sdk-react-native@{{SDK_VERSION}} react-native-video
  - android/build.gradle: buildscript.ext useExoplayerIMA = true and media3Version =
    "1.8.0"; repositories maven.anypoint.tv/repository/public-release and jitpack.io
  - android/app/build.gradle: coreLibraryDesugaringEnabled true +
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
  - Android network_security_config.xml cleartext exception for
    prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com
  - iOS Info.plist ATS: NSAllowsLocalNetworking (all streams HTTPS) or
    NSAllowsArbitraryLoads standing alone (any plain HTTP stream)
  - initialize('Info') once at app startup

Bitmovin (bitmovin-player-react-native is an Expo module; verified against 1.25.0, and
1.19.0 declares the same registry API):
  - package.json: "expo" in dependencies; babel.config.js preset "babel-preset-expo"
  - android/build.gradle repositories:
      maven { url "https://artifacts.bitmovin.com/artifactory/public-releases" }
  - android/settings.gradle — Expo autolinking:
      pluginManagement {
          def expoPluginsPath = new File(
              providers.exec {
                  workingDir(rootDir)
                  commandLine("node", "--print", "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })")
              }.standardOutput.asText.get().trim(),
              "../android/expo-gradle-plugin"
          ).absolutePath
          includeBuild(expoPluginsPath)
      }
      plugins {
          id("com.facebook.react.settings")
          id("expo-autolinking-settings")
      }
      extensions.configure(com.facebook.react.ReactSettingsExtension) { ex ->
          ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand)
      }
      expoAutolinking.useExpoModules()
      expoAutolinking.useExpoVersionCatalog()
  - android/build.gradle: apply plugin: "expo-root-project"
  - ios/Podfile: $FlowerSdkUseBitmovin = true ABOVE the target block; use_expo_modules!
    inside the target; deployment target >= the Expo SDK's (16.4 for SDK 57) on the app
    AND on the flower-sdk-react-native pod (raise it in post_install)
  - iOS app delegate: ExpoAppDelegate + ExpoReactNativeFactory
  - Bitmovin licence key: usePlayer({licenseKey}) or Info.plist / AndroidManifest.xml
Missing an Expo piece on JS or iOS still builds, then fails at runtime as usePlayer being
undefined (a blank white screen). The Android Gradle wiring fails at build time.

========================================
IMPLEMENTATION
========================================

Step 1 — Imports, player and state

  import React, {useCallback, useEffect, useRef, useState} from 'react';
  import {StyleSheet, View} from 'react-native';
  import {PlayerView, SourceType, usePlayer} from 'bitmovin-player-react-native';
  import {
    addAdEventListenerFor,
    changeChannelUrl,
    release,
    stop,
  } from '@anypoint/flower-sdk-react-native';

  const MAX_RESTARTS = 3;   // cheap cap: a channel failing on every start must not loop

  export function BitmovinChannel({nativeId, config, licenseKey}) {
    // The SAME string as the overlay <View nativeID> below.
    const player = usePlayer({nativeId, licenseKey});
    const [sourceUri, setSourceUri] = useState(config.videoUrl);
    const [held, setHeld] = useState(!!config.prerollAdTagUrl);
    const [readySeq, setReadySeq] = useState(0);
    const handedOver = useRef(false);
    const pendingProxyUrl = useRef<string | null>(null);
    const restarting = useRef(false);
    const restarts = useRef(0);
    ...
  }

Step 2 — Load whichever url is current, and play whenever a source is ready

  useEffect(() => {
    player.load({url: sourceUri, type: SourceType.HLS}); // SourceType.DASH for .mpd
  }, [player, sourceUri]);

  useEffect(() => {
    if (readySeq > 0 && !held) {
      player.play();
    }
  }, [player, held, readySeq]);

Step 3 — Start the channel: the first handover from onReady (once), and the restart

  // The same call for the first start and for every restart. A restart does not change
  // the channel, so the pre-roll is skipped: 'completed' arrives right away and the
  // held proxy url plays exactly as on the first start.
  const startChannel = useCallback(async () => {
    const proxyUrl = await changeChannelUrl(nativeId, {
      videoUrl: config.videoUrl,
      adTagUrl: config.adTagUrl,
      channelId: config.channelId,
      playerType: 'bitmovin',
      extraParams: config.extraParams,                    // omit if not configured
      adTagHeaders: config.adTagHeaders,                  // omit if not configured
      channelStreamHeaders: config.channelStreamHeaders,  // omit if not configured
      prerollAdTagUrl: config.prerollAdTagUrl,            // omit if not configured
    });
    if (config.prerollAdTagUrl) {
      pendingProxyUrl.current = proxyUrl;   // loaded from 'completed'
    } else {
      setSourceUri(proxyUrl);   // loaded by Step 2, played from onReady
    }
  }, [nativeId, config]);

  const handOver = useCallback(async () => {
    if (handedOver.current) return;
    handedOver.current = true;
    try {
      await startChannel();
    } catch (e: any) {
      handedOver.current = false;
      console.error(`changeChannelUrl failed: ${e.message}`);
    }
  }, [startChannel]);

  // On 'error': end the ad session, then start the channel over with a NEW
  // changeChannelUrl() and its NEW proxy url. Never release() here.
  const restartChannel = useCallback(async () => {
    if (restarting.current || restarts.current >= MAX_RESTARTS) return;
    restarting.current = true;
    restarts.current += 1;
    try {
      await stop(nativeId);
      await startChannel();
    } catch (e: any) {
      console.error(`channel restart failed: ${e.message}`);
    } finally {
      restarting.current = false;
    }
  }, [nativeId, startChannel]);

Step 4 — Ad events

  useEffect(() => {
    const subscription = addAdEventListenerFor(nativeId, event => {
      // 'completed' is idempotent: it also arrives for a break that stop() cut short.
      if (event.event === 'completed' && pendingProxyUrl.current) {
        setSourceUri(pendingProxyUrl.current);   // pre-roll over: load the proxy url
        pendingProxyUrl.current = null;
        setHeld(false);
      } else if (event.event === 'error') {
        console.error(`ad error: ${event.message}`);
        restartChannel();
      }
    });
    return () => subscription.remove();
  }, [nativeId, restartChannel]);

  const onReady = useCallback(() => {
    setReadySeq(seq => seq + 1);
    handOver();
  }, [handOver]);

Step 5 — Release on unmount

  useEffect(
    () => () => {
      if (handedOver.current) {
        release(nativeId).catch(() => {});
      }
    },
    [nativeId],
  );

Step 6 — Render

  return (
    <View style={StyleSheet.absoluteFill}>
      <PlayerView player={player} style={StyleSheet.absoluteFill} onReady={onReady} />
      {/* The ad overlay's host. Empty, and separate from <PlayerView> on purpose. */}
      <View nativeID={nativeId} style={StyleSheet.absoluteFill} pointerEvents="box-none" />
    </View>
  );

For several channels on one screen, give each its own unique id, used for both
usePlayer({nativeId}) and its overlay <View nativeID>.

========================================
RULES
========================================

DO:
- Use one string for usePlayer({nativeId}) and the overlay <View nativeID>.
- Pass playerType: 'bitmovin' to changeChannelUrl().
- Remove your own subscriptions; release() does not remove them.
- On 'error', await stop(nativeId), then call changeChannelUrl() again with exactly the
  same params, prerollAdTagUrl included, and handle the new proxy url as on the first
  start. Cap the restarts.
- Keep the 'completed' handling idempotent; a stopped break may still report it.

DO NOT:
- Do NOT call release() to recover from an 'error'; it drops the overlay. Use stop().
- Do NOT restart from a failed pre-roll; it reports 'completed', never 'error'.
- Do NOT put nativeID on <PlayerView>, or give the overlay view React children.
- Do NOT call play() from the Flower package for a linear break; the SDK starts it.
- Do NOT pause the content around a linear break.
- Do NOT enable playbackConfig.isAutoplayEnabled to work around the pre-roll hold.
- Do NOT create a FlowerAdView or any ad view.

========================================
VERIFY
========================================

Android and iOS each:
1. The app launches (no blank white screen) and usePlayer is defined.
2. Without pre-roll: the proxy url plays after onReady; changeChannelUrl runs once (until
   an 'error' restart).
3. A scheduled break plays by itself and the stream continues afterwards.
4. With prerollAdTagUrl: no channel audio under the pre-roll; the proxy url plays after
   'completed', also when the pre-roll returns no ad.
5. Ad error: logged, stop() is called, then changeChannelUrl() runs once more and the
   channel plays again from a NEW proxy url. With prerollAdTagUrl, the pre-roll does not
   play again on the restart and the new proxy url is loaded from the 'completed' that
   follows right away. After MAX_RESTARTS it stops restarting.
6. Unmount: release() is called and no overlay remains.
Known limit: on iOS, with a DASH stream, a replacement ad may play for a second or two
and then restart from its beginning; HLS is unaffected. This is an SDK-side limit, not
something the app can fix.

========================================
OUTPUT
========================================

- The full channel component and the screen that mounts it.
- All setup changes (package.json, babel.config.js, Gradle files, Podfile, app delegate,
  Info.plist / AndroidManifest.xml) as diffs.
- Assumptions about config names and the source type (HLS or DASH).
````
