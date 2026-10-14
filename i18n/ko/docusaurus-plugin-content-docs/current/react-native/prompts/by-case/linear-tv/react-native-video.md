---
sidebar_position: 1
sidebar_label: react-native-video
---

# react-native-video로 Linear TV / FAST 연동

`react-native-video`로 재생하는 실시간 채널이나 FAST 스트림에 Flower 광고를 추가할 때 이 프롬프트를 사용하세요. 한 화면의 여러 채널과 선택적인 채널 프리롤도 다룹니다. LLM은 플레이어를 SDK에 인계하고 SDK가 반환한 프록시 URL을 재생하는 채널 플레이어 컴포넌트를 생성합니다. 배경 설명: [Linear TV 광고 구현](../../../ad-insertion/linear-tv-fast/linear-tv-implementation.md).

| 파라미터 | 예시 | 설명 |
|-----------|---------|-------------|
| `{{SDK_VERSION}}` | `1.0.4` | 설치할 `@anypoint/flower-sdk-react-native` 버전. 패키지가 이미 설치되어 있으면 무시됩니다. |

````plain
We are integrating the FLOWER SDK into our React Native app for a LINEAR TV / FAST
channel played by react-native-video. Modify the code I provide; do not generate a new
app from scratch.

========================================
GOAL
========================================

A channel player component that:
  - mounts <Video nativeID> on the ORIGINAL stream url,
  - hands the player to the SDK with changeChannelUrl() once it exists,
  - swaps the source to the local proxy url the SDK returns,
  - optionally plays a channel pre-roll first,
  - on an ad 'error', stops the ads manager and starts the channel over,
  - releases the session on unmount.
Ad breaks are spliced into the stream and play by themselves.

========================================
PARAMETERS
========================================

SDK_VERSION: {{SDK_VERSION}}

Take these from the app's existing config objects. Do NOT hardcode them:
  videoUrl               original stream url                        (required)
  adTagUrl               ad tag url issued by Anypoint Media        (required)
  channelId              channel id registered in FLOWER            (required)
  prerollAdTagUrl        ad tag url for a channel pre-roll          (optional)
  extraParams            targeting values, {key: value} strings     (optional)
  adTagHeaders           headers for ad requests                    (optional)
  channelStreamHeaders   headers for original stream requests       (optional)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- The SDK needs the REAL player instance. react-native-video only builds it once a
  source is set, so the flow is two-phase: mount on the original url, wait for onLoad,
  call changeChannelUrl(), then swap <Video source> to the returned proxy url.
- Swapping the source does NOT rebuild the player, so the SDK's listeners stay valid.
- onLoad fires AGAIN after the swap. The handover must be guarded so it runs once.
- The SDK starts every linear break itself, scheduled by the cue in the stream. The app
  never calls play() for a linear break and never pauses the content for one.
- With prerollAdTagUrl, the SDK plays the pre-roll first and sends 'completed' when it is
  over (also when it fails). The proxy url is applied from that 'completed'. A failed
  pre-roll never sends 'error', so it needs no restart.
- Every changeChannelUrl() call starts a new session: the SDK stops the one running for
  that nativeID (a pre-roll still playing included) and requests the pre-roll of the new
  call. Switching to a channel with its own prerollAdTagUrl holds its proxy url again.
- By default (setIgnoreAdBreakInPIPMode(true)) a running channel pre-roll pauses when the
  user leaves the app and resumes on return, like a VOD ad, if the app reports both
  moments with notifyUserLeftApp() (see the PIP prompt).
- An 'error' on a channel means the SDK could not keep its ads in the stream (for one, a
  playlist it failed to manipulate), which can leave the player on a broken stream. The
  recovery is a restart: await stop(nativeId) - it stops the ads manager but, unlike
  release(), keeps the overlay and the subscription - then call changeChannelUrl() again
  with exactly the same params (prerollAdTagUrl included) and handle the NEW proxy url it
  returns as on the first start.
- The SDK remembers the channel (channelId) entered last. changeChannelUrl() for that
  same channel skips the pre-roll even with prerollAdTagUrl, and sends 'completed' right
  after the call resolves, like a pre-roll with no ad. So a restart does not show the
  pre-roll again, and a proxy url held until 'completed' plays exactly as on the first
  start. stop() and initialize() keep that channel; requestVodAd() / requestAd() clear
  it. It is one channel for the whole app, not one per nativeID (A -> B -> A plays A's
  pre-roll again).
- stop() ends any break in progress, and that break may still report 'completed' after
  the 'error', even after stop() resolved. The 'completed' handling must be idempotent.
- All SDK state is keyed by nativeID, and every ad event carries it back. Several
  <Video> elements can each run their own channel, as long as every nativeID is unique.

========================================
SETUP — only if the package is not installed yet
========================================

Skip this section if @anypoint/flower-sdk-react-native is already installed and builds.

1. .npmrc at the project root. Keep the "@anypoint:" scope prefix:
     @anypoint:registry=https://maven.anypoint.tv/repository/npm-registry/
2. npm install @anypoint/flower-sdk-react-native@{{SDK_VERSION}} react-native-video
   react-native-video must be >= 6.0.0 (verified against 6.19.2). Pin it.
3. android/build.gradle:
     buildscript { ext {
         useExoplayerIMA = true    // MANDATORY, or IMA ads fail with NoSuchMethodError
         media3Version = "1.8.0"   // same media3 for react-native-video and the Flower adapter
     } }
     allprojects { repositories {
         maven { url "https://maven.anypoint.tv/repository/public-release" }
         maven { url "https://jitpack.io" }
     } }
4. android/app/build.gradle (the build fails at checkDebugAarMetadata without it):
     android { compileOptions { coreLibraryDesugaringEnabled true } }
     dependencies { coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5") }
5. Android cleartext exception: res/xml/network_security_config.xml with a domain-config
   (cleartextTrafficPermitted="true", includeSubdomains="true") for
   prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com, referenced from
   <application android:networkSecurityConfig="@xml/network_security_config">.
6. iOS: cd ios && pod install. Info.plist NSAppTransportSecurity: NSAllowsLocalNetworking
   if every stream is HTTPS (the SDK's proxy is http://127.0.0.1:<port>); if any stream is
   plain HTTP, NSAllowsArbitraryLoads INSTEAD, standing alone in the dict.
7. Once at app startup, before any other SDK call:
     useEffect(() => {
       initialize('Info')
         .then(v => console.log(`Flower SDK initialized: ${v}`))
         .catch(e => console.error(`init failed: ${e.message}`));
     }, []);

========================================
IMPLEMENTATION
========================================

Step 1 — Component skeleton and imports

  import React, {useCallback, useEffect, useRef, useState} from 'react';
  import {StyleSheet, View} from 'react-native';
  import Video from 'react-native-video';
  import {
    addAdEventListenerFor,
    changeChannelUrl,
    release,
    stop,
  } from '@anypoint/flower-sdk-react-native';

  const MAX_RESTARTS = 3;   // cheap cap: a channel failing on every start must not loop

  export function ChannelPlayer({nativeId, config}) {
    // Phase 1: the ORIGINAL url, so react-native-video builds its player.
    const [sourceUri, setSourceUri] = useState(config.videoUrl);
    // Only with a pre-roll: the original stream is held while the pre-roll runs.
    const [held, setHeld] = useState(!!config.prerollAdTagUrl);
    const handedOver = useRef(false);
    const pendingProxyUrl = useRef<string | null>(null);
    const restarting = useRef(false);
    const restarts = useRef(0);
    ...
  }

Step 2 — Start the channel: the first handover from onLoad (guarded), and the restart

  // The same call for the first start and for every restart. On a restart the SDK skips
  // the pre-roll of the channel entered last and sends 'completed' right away, so the
  // held proxy url plays exactly as on the first start.
  const startChannel = useCallback(async () => {
    const proxyUrl = await changeChannelUrl(nativeId, {
      videoUrl: config.videoUrl,
      adTagUrl: config.adTagUrl,
      channelId: config.channelId,
      extraParams: config.extraParams,                    // omit if not configured
      adTagHeaders: config.adTagHeaders,                  // omit if not configured
      channelStreamHeaders: config.channelStreamHeaders,  // omit if not configured
      prerollAdTagUrl: config.prerollAdTagUrl,            // omit if not configured
    });
    if (config.prerollAdTagUrl) {
      pendingProxyUrl.current = proxyUrl;  // applied from 'completed'
    } else {
      setSourceUri(proxyUrl);              // Phase 3: same player, new source
    }
  }, [nativeId, config]);

  const handOver = useCallback(async () => {
    if (handedOver.current) return;          // onLoad fires again after every swap
    handedOver.current = true;
    try {
      await startChannel();
    } catch (e: any) {
      handedOver.current = false;
      console.error(`changeChannelUrl failed: ${e.message}`);
    }
  }, [startChannel]);

  // On 'error': stop the ads manager, then start the channel over with a NEW
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

Step 3 — Ad events for this channel only

  useEffect(() => {
    const subscription = addAdEventListenerFor(nativeId, event => {
      switch (event.event) {
        case 'completed':
          // Idempotent: also arrives for a break that stop() cut short.
          if (pendingProxyUrl.current) {
            // The pre-roll is over: now play the proxy url.
            setSourceUri(pendingProxyUrl.current);
            pendingProxyUrl.current = null;
            setHeld(false);
          }
          console.log('ad break finished');
          break;
        case 'adBreakPrepare':
          console.log(`ad break loaded: ${event.adCount} ads`);
          break;
        case 'play':
          console.log('ad break started');
          break;
        case 'error':
          console.error(`ad error: ${event.message}`);
          restartChannel();
          break;
      }
    });
    return () => subscription.remove();
  }, [nativeId, restartChannel]);

Step 4 — Release on unmount (its own effect)

  useEffect(
    () => () => {
      if (handedOver.current) {
        release(nativeId).catch(() => {});
      }
    },
    [nativeId],
  );

Step 5 — Render

  return (
    <View style={styles.player}>
      <Video
        nativeID={nativeId}              // unique on screen
        source={{uri: sourceUri}}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        paused={held}                    // true only while a channel pre-roll runs
        onLoad={handOver}                // the reliable "player exists" signal
        onError={e => console.error(`player error: ${JSON.stringify(e)}`)}
      />
    </View>
  );

  const styles = StyleSheet.create({
    player: {width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000'},
  });

Step 6 — Several channels on one screen (only if the app shows more than one)

  {channels.map(ch => (
    <ChannelPlayer key={ch.nativeId} nativeId={ch.nativeId} config={ch} />
  ))}

Each nativeId must be unique among mounted elements. Each one gets its own overlay, ads
manager and local proxy. Use addAdEventListenerFor(nativeId, ...) per player, or one
addAdEventListener(...) and switch on event.nativeId.

========================================
RULES
========================================

DO:
- Address the player only by the nativeID prop.
- Call changeChannelUrl() from onLoad, guarded by a ref.
- Remove your own subscriptions; release() does not remove them.
- Treat runtime ad failures as 'error' events; they do not reject a promise.
- On 'error', await stop(nativeId), then call changeChannelUrl() again with exactly the
  same params, prerollAdTagUrl included, and handle the new proxy url as on the first
  start. Cap the restarts.
- Keep the 'completed' handling idempotent; a stopped break may still report it.

DO NOT:
- Do NOT call release() to recover from an 'error'; it drops the overlay. Use stop().
- Do NOT keep playing the old proxy url after an 'error', and do NOT restart from a
  failed pre-roll (it reports 'completed', never 'error').
- Do NOT use a ref or findNodeHandle() to identify the player.
- Do NOT call changeChannelUrl() while mounting, before onLoad.
- Do NOT call play() for a linear break, and do NOT pause the content around one.
- Do NOT remount <Video> (e.g. by changing its key) to swap to the proxy url.
- Do NOT create a FlowerAdView or any ad view. The SDK mounts its overlay itself.
- Do NOT call requestVodAd() for a channel.

========================================
VERIFY
========================================

Android and iOS each:
1. Channel without pre-roll: the proxy url (http://127.0.0.1:<port>/...) starts right
   after onLoad, and changeChannelUrl() runs exactly once (until an 'error' restart).
2. A scheduled break plays by itself; 'play' then 'completed' are logged; the stream
   continues afterwards.
3. With prerollAdTagUrl: no channel audio under the pre-roll; the proxy url starts after
   'completed'. With a pre-roll tag that returns no ad, the channel still starts.
4. Ad error: an 'error' is logged, stop() is called, then changeChannelUrl() runs once
   more and the channel plays again from a NEW proxy url. With prerollAdTagUrl, the
   pre-roll does not play again on the restart and the new proxy url is applied from the
   'completed' that follows right away. A channel that keeps failing stops restarting
   after MAX_RESTARTS.
5. Two channels on screen: each has its own overlay and events carry the right nativeId.
6. Unmount: release() is called, no overlay is left behind.
Native SDK logs are in adb logcat (Android) and the Xcode console (iOS), not in Metro.

========================================
OUTPUT
========================================

- The full modified channel player component and the screen that mounts it.
- Any setup files changed (.npmrc, Gradle files, Info.plist), as diffs.
- A short list of assumptions about the app's config names.
````
