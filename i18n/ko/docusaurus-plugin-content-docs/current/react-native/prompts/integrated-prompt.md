---
sidebar_position: 5
---

# 통합 프롬프트 (전체 단계)

이 프롬프트 하나로 React Native의 Flower SDK 연동 전체를 다룹니다. Step 1~4의 모든 내용을 포함합니다.

**사용 전:** 모든 `{{...}}` 자리표시자를 실제 값으로 바꾸세요.

````plain
We are integrating the FLOWER SDK into our React Native project. Generate the complete
integration for the following configuration:

AD_TYPE: {{AD_TYPE}} (linear-tv | vod | interstitial)
PLAYER_TYPE: {{PLAYER_TYPE}} (react-native-video | bitmovin)
SDK_VERSION: {{SDK_VERSION}}

################################################################
STEP 1 — PROJECT SETUP & SDK INITIALIZATION
################################################################

========================================
STEP 1-1 — Registry configuration
========================================

Add this scope line to the project's .npmrc (create it at the project root if missing).
Reads are anonymous, so no credential is needed:

  @anypoint:registry=https://maven.anypoint.tv/repository/npm-registry/

IMPORTANT: keep the "@anypoint:" scope prefix. Without it this becomes the DEFAULT
registry and every dependency, public ones included, starts resolving through Nexus.

========================================
STEP 1-2 — Install
========================================

  npm install @anypoint/flower-sdk-react-native@{{SDK_VERSION}} react-native-video

react, react-native and react-native-video are peer dependencies. react-native-video must
be >= 6.0.0 (verified against 6.19.2). Pin it — the package reads its internal player
field to obtain the underlying player instance, so the version is a hard coupling.

========================================
STEP 1-3 — Android configuration
========================================

android/build.gradle — buildscript.ext:

  buildscript {
      ext {
          // MANDATORY. Left at the default of false, react-native-video compiles its own
          // stub classes into com.google.ads.interactivemedia.v3.api and those stubs
          // shadow the real IMA SDK, so the Flower SDK's
          // ImaSdkFactory.createAdDisplayContainer() fails at runtime with
          // NoSuchMethodError. Only Google/IMA ads break, so it is easy to miss.
          useExoplayerIMA = true

          // react-native-video and the Flower media3 adapter must compile against the
          // SAME androidx.media3 version.
          media3Version = "1.8.0"

          // Optional: pins the underlying Android SDK version.
          flowerSdkVersion = "2.9.22"
      }
  }

android/build.gradle — repositories. Gradle resolves an autolinked project's external
artifacts using the CONSUMER's repositories, so these belong in the app:

  allprojects {
      repositories {
          maven { url "https://maven.anypoint.tv/repository/public-release" }
          // sdk-android-ott depends on com.github.fingerprintjs:fingerprint-android at
          // runtime, which is on JitPack and not on Maven Central.
          maven { url "https://jitpack.io" }
          // Only if PLAYER_TYPE is "bitmovin":
          maven { url "https://artifacts.bitmovin.com/artifactory/public-releases" }
      }
  }

If PLAYER_TYPE is "bitmovin", Android also needs Expo's Gradle autolinking, because
bitmovin-player-react-native is an Expo module and its Android build pulls expo-crypto /
expo-keep-awake. Without it the build fails while evaluating :expo with "Plugin with id
'expo-module-gradle-plugin' not found":

  // android/settings.gradle — React Native's own includeBuild stays as it is
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

  // android/build.gradle
  apply plugin: "expo-root-project"

android/app/build.gradle — core library desugaring. Required by the SDK's AAR metadata;
without it the build fails at checkDebugAarMetadata:

  android {
      compileOptions {
          coreLibraryDesugaringEnabled true
      }
  }

  dependencies {
      coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
  }

android/app/src/main/res/xml/network_security_config.xml — Android 9 (API 28) and above
block cleartext traffic by default:

  <?xml version="1.0" encoding="utf-8"?>
  <network-security-config>
      <domain-config cleartextTrafficPermitted="true">
          <domain includeSubdomains="true">
              prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com
          </domain>
      </domain-config>
  </network-security-config>

Reference it from AndroidManifest.xml:

  <application
      android:networkSecurityConfig="@xml/network_security_config"
      android:usesCleartextTraffic="false"
      ... >

========================================
STEP 1-4 — iOS configuration
========================================

  cd ios && pod install

Autolinking picks up the podspec, which depends on the FlowerSdk pod.

ios/<YourApp>/Info.plist — App Transport Security. The SDK's local proxy is
http://127.0.0.1:<port>, which ATS blocks by default with NSURLErrorDomain -1022.

If every stream is HTTPS, NSAllowsLocalNetworking is enough:

  <key>NSAppTransportSecurity</key>
  <dict>
      <key>NSAllowsLocalNetworking</key>
      <true/>
  </dict>

If any stream is plain HTTP, use NSAllowsArbitraryLoads INSTEAD — and it must stand
ALONE. iOS 10+ silently ignores it whenever a more specific ATS key sits alongside it:

  <key>NSAppTransportSecurity</key>
  <dict>
      <key>NSAllowsArbitraryLoads</key>
      <true/>
  </dict>

If PLAYER_TYPE is "bitmovin", add ABOVE the target block in ios/Podfile:

  $FlowerSdkUseBitmovin = true

bitmovin-player-react-native is an Expo module, so the app needs Expo wired up. Two
pieces are shared by both platforms:
  - "expo" in dependencies
  - "babel-preset-expo" as the Babel preset
Android's half is the Gradle autolinking in STEP 1-3 above. iOS needs three more:
  - use_expo_modules! in the Podfile target
  - ExpoAppDelegate + ExpoReactNativeFactory in the app delegate
  - deployment target >= the Expo SDK's (16.4 for SDK 57) on the app AND on the
    flower-sdk-react-native pod, raised in post_install

Missing any of the shared or iOS pieces still builds; it fails at runtime as usePlayer
being undefined, which shows as a blank white screen. The Android Gradle wiring is the
one part that fails loudly, at build time.

========================================
STEP 1-5 — Initialize the SDK
========================================

Call once at app startup, before any other SDK function:

  import {useEffect} from 'react';
  import {initialize} from '@anypoint/flower-sdk-react-native';

  export default function App() {
    useEffect(() => {
      initialize('Info')
        .then(version => console.log(`Flower SDK initialized: ${version}`))
        .catch(error => console.error(`init failed: ${error.message}`));
    }, []);

    // ...
  }

Log levels: 'Verbose' | 'Debug' | 'Info' | 'Warn' | 'Error' | 'Off'. Default 'Info'.

There is NO environment mode (local/dev/prod) and no setEnv() in this package.

################################################################
STEP 2 — AD UI DECLARATION & PLAYER SETUP
################################################################

========================================
STEP 2-1 — There is no ad view to declare
========================================

Unlike the Android, iOS and HTML5 SDKs, the React Native package has NO FlowerAdView for
the app to place, and no player wrapper class to adopt. The SDK creates and mounts its ad
overlay itself, over the view carrying the nativeID it is given.

========================================
STEP 2-2 — Addressing by nativeID
========================================

Every SDK call takes a nativeId string as its FIRST argument. That string is the
nativeID prop of the <Video> element the session belongs to.

  <Video nativeID="channel-1" source={{uri: streamUrl}} />
  await changeChannelUrl('channel-1', {...});

RULES:
- Every nativeID on screen must be UNIQUE. All SDK state is keyed by it, and every ad
  event carries it back.
- Do NOT use a ref to identify the player. react-native-video's ref is an imperative
  handle, so findNodeHandle() cannot resolve it, and under the new architecture the video
  view is not mounted as a descendant of the element wrapping it.

========================================
STEP 2-3 — Mount the player
========================================

If PLAYER_TYPE is "react-native-video":

  import Video from 'react-native-video';

  const [sourceUri, setSourceUri] = useState(originalUrl);

  <View style={styles.player}>
    <Video
      nativeID={nativeId}
      source={{uri: sourceUri}}
      style={StyleSheet.absoluteFill}
      resizeMode="contain"
      onLoad={handOver}
      onError={e => console.error(JSON.stringify(e))}
    />
  </View>

If PLAYER_TYPE is "bitmovin":

The same string does double duty — the nativeID of the overlay view, and the key
usePlayer() registers the player under. They MUST match, or the call rejects.

Give the id to a PLAIN <View> layered over <PlayerView>, never to <PlayerView> itself:
the SDK adds its ad UI as a native child, and doing that to a React-managed view that
also has React children puts React's index bookkeeping out of step with the real child
list.

  import {PlayerView, SourceType, usePlayer} from 'bitmovin-player-react-native';

  const NATIVE_ID = 'ch1';
  const player = usePlayer({nativeId: NATIVE_ID, licenseKey});

  useEffect(() => {
    player.load({url: originalUrl, type: SourceType.HLS});
  }, [player, originalUrl]);

  <View style={StyleSheet.absoluteFill}>
    <PlayerView player={player} style={StyleSheet.absoluteFill} onReady={handOver} />
    {/* the ad overlay's host — separate from <PlayerView> on purpose */}
    <View nativeID={NATIVE_ID} style={StyleSheet.absoluteFill} pointerEvents="box-none" />
  </View>

========================================
STEP 2-4 — The two-phase handover
========================================

Applies to AD_TYPE "linear-tv" and "vod". Skip for "interstitial".

The SDK needs the REAL player instance so it can attach an adapter and follow playback.
react-native-video builds and owns that player internally and only constructs one once a
source has been set. So:

  Phase 1: mount <Video nativeID="..."> on the ORIGINAL url.
  Phase 2: once the player exists, call the SDK. onLoad is the reliable signal.
  Phase 3 (linear-tv only): swap <Video source> to the proxy url the SDK returned.

Phase 3 does NOT rebuild the player, which is what keeps the adapter's listeners valid.

Calling before the player exists rejects with:
  "react-native-video has not created its ExoPlayer yet. Mount <Video> on the original
   URL and wait for onLoad before calling this."
(iOS sends the same sentence with AVPlayer in place of ExoPlayer.)

For "bitmovin" the player comes from usePlayer() rather than from the view, so it exists
as soon as the hook has run — use onReady on <PlayerView>.

For "interstitial", requestAd() does NOT need the content player. Only the view is
looked up.

========================================
STEP 2-5 — Re-entry guard (linear-tv only)
========================================

onLoad fires AGAIN after the source is swapped to the proxy url:

  const handedOver = useRef(false);

  const handOver = useCallback(async () => {
    if (handedOver.current) return;
    // ... call the SDK, then:
    handedOver.current = true;
  }, [...]);

################################################################
STEP 3 — AD INTEGRATION
################################################################

========================================
STEP 3-1 — Subscribe to ad events
========================================

Ad events replace the FlowerAdsManagerListener interface of the native SDKs. There is no
listener object to implement.

  import {addAdEventListenerFor} from '@anypoint/flower-sdk-react-native';

  useEffect(() => {
    const subscription = addAdEventListenerFor(nativeId, event => {
      switch (event.event) {
        // ...
      }
    });
    return () => subscription.remove();
  }, [nativeId]);

addAdEventListener(fn) subscribes to EVERY session; addAdEventListenerFor(nativeId, fn)
filters to one. Both return a subscription with remove().

AdEvent is a discriminated union on the `event` field:

  {nativeId: string} & (
    | {event: 'adBreakPrepare'; adCount: number}
    | {event: 'prepare'; adDurationMs: number}
    | {event: 'play'}
    | {event: 'adPlay'; adId: string; durationMs: number}
    | {event: 'completed'}
    | {event: 'error'; message: string | null}
    | {event: 'adUserAction'; action: string; adId: string}
    | {event: 'adBreakSkipped'; reason: number}
  )

adBreakSkipped reason codes: 0 Unknown, 1 No Ad, 2 Timeout, 3 Error.
adUserAction actions: 'learn_more', 'skip'.

========================================
STEP 3-2 — Who starts the break
========================================

  linear-tv     -> the SDK. Scheduled by the cue in the stream. Do NOT call play().
  vod           -> your app, via play(). Your app also pauses/resumes the content.
  interstitial  -> your app, via play(). Your app also pauses/resumes the content.

========================================
STEP 3-3 — Handle events by AD_TYPE
========================================

If AD_TYPE is "linear-tv" — logging and error recovery only:

  const subscription = addAdEventListenerFor(nativeId, event => {
    switch (event.event) {
      case 'adBreakPrepare':
        console.log(`ad break loaded: ${event.adCount} ads`);
        break;
      case 'play':
        console.log('ad break started');
        break;
      case 'completed':
        console.log('ad break finished');
        break;
      case 'error':
        console.error(`ad error: ${event.message}`);
        break;
    }
  });

If AD_TYPE is "vod":

  const [paused, setPaused] = useState(false);

  const subscription = addAdEventListenerFor(nativeId, event => {
    if (event.event === 'prepare') {
      setPaused(true);           // pausing the content is the app's job
      play(nativeId).catch(e => console.error(`play failed: ${e.message}`));
    } else if (event.event === 'completed') {
      setPaused(false);
    } else if (event.event === 'error') {
      setPaused(false);          // never strand the viewer on a frozen frame
      console.error(`ad error: ${event.message}`);
    }
  });

Pass `paused={paused}` to the <Video>.

If AD_TYPE is "interstitial":

  const subscription = addAdEventListenerFor(nativeId, event => {
    switch (event.event) {
      case 'prepare':
        setPaused(true);
        play(nativeId).catch(e => console.error(`play failed: ${e.message}`));
        break;
      case 'completed':
      case 'error':
        setPaused(false);
        stop(nativeId).catch(() => {});
        break;
      case 'adBreakSkipped':
        setPaused(false);
        break;
    }
  });

========================================
STEP 3-4 — Request the ads
========================================

Use values from your config objects — do NOT hardcode URLs or parameters.
extraParams, adTagHeaders and channelStreamHeaders are plain {key: value} string objects.
Omitting one is not the same as passing an empty object: the SDK reads an omitted value
as "not supplied".

If PLAYER_TYPE is "bitmovin", add `playerType: 'bitmovin'` to the params object.

If AD_TYPE is "linear-tv" — call from onLoad, guarded, then swap the source:

  const proxyUrl = await changeChannelUrl(nativeId, {
    videoUrl: config.contentUrl,                                  // Required
    adTagUrl: config.adTagUrl,                                    // Required
    channelId: config.channelId,                                  // Required
    extraParams: config.extraParams,                              // Optional
    adTagHeaders: config.adTagHeaders,                            // Optional
    channelStreamHeaders: config.channelStreamHeaders,            // Optional
    prerollAdTagUrl: config.prerollAdTagUrl,                      // Optional
  });

  setSourceUri(proxyUrl);   // react-native-video
  // bitmovin: player.load({url: proxyUrl, type: SourceType.HLS});

PRE-ROLL: with a prerollAdTagUrl the pre-roll runs FIRST. Hold the proxy url in a ref and
apply it from the 'completed' event rather than right away.

If AD_TYPE is "vod" — call from onLoad. The content url is NEVER rewritten:

  await requestVodAd(nativeId, {
    adTagUrl: config.adTagUrl,                                    // Required
    contentId: config.contentId,                                  // Required
    durationMs: config.durationMs,                                // Required (ms)
    extraParams: config.extraParams,                              // Optional
    adTagHeaders: config.adTagHeaders,                            // Optional
  });

durationMs must be the real total duration of the content — the SDK places the break
positions against it.

POST-ROLL: wire the <Video> onEnd prop to notifyContentEnded(nativeId). Without it the
SDK never learns the content is over and no post-roll can run:

  onEnd={() => notifyContentEnded(nativeId).catch(e => console.error(e.message))}

If AD_TYPE is "interstitial" — no player needed, call whenever the break belongs:

  await requestAd(nativeId, {
    adTagUrl: config.adTagUrl,                                    // Required
    extraParams: config.extraParams,                              // Optional
    adTagHeaders: config.adTagHeaders,                            // Optional
  });

################################################################
STEP 4 — CLEANUP & RELEASE
################################################################

========================================
STEP 4-1 — Two independent things to clean up
========================================

  1. The SDK session      -> release(nativeId)
  2. Your event listeners -> subscription.remove()

They are NOT linked. release() removes the SDK's own internal listener and stops any
break in progress, but it does not touch subscriptions the app created.

========================================
STEP 4-2 — Release the session on unmount
========================================

The native side RETAINS the ad overlay for each nativeID. Skipping release() leaks it:
the overlay outlives the player it was mounted over, along with its ads manager and its
local proxy.

  const started = useRef(false);

  useEffect(
    () => () => {
      if (started.current) {
        release(nativeId).catch(() => {});
      }
    },
    [nativeId],
  );

Set started.current = true right after the ad request resolves.

========================================
STEP 4-3 — stop() vs release()
========================================

  stop(nativeId)     -> ends the ad break in progress. The content keeps playing and the
                        session stays alive, so a later break will still play.
  release(nativeId)  -> detaches the SDK from that <Video> entirely.

Both ignore an unknown nativeId rather than rejecting.

========================================
STEP 4-4 — Full component skeleton
========================================

  function AdPlayer({nativeId, config}) {
    const [sourceUri, setSourceUri] = useState(config.contentUrl);
    const [paused, setPaused] = useState(false);
    const started = useRef(false);

    // 1. events
    useEffect(() => {
      const subscription = addAdEventListenerFor(nativeId, event => {
        // ... see Step 3-3
      });
      return () => subscription.remove();
    }, [nativeId]);

    // 2. session
    useEffect(
      () => () => {
        if (started.current) {
          release(nativeId).catch(() => {});
        }
      },
      [nativeId],
    );

    // 3. request, from onLoad
    const start = useCallback(async () => {
      if (started.current) return;
      try {
        // ... see Step 3-4
        started.current = true;
      } catch (error) {
        console.error(error.message);
      }
    }, [nativeId, config]);

    return (
      <View style={styles.player}>
        <Video
          nativeID={nativeId}
          source={{uri: sourceUri}}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          paused={paused}
          onLoad={start}
          onEnd={() => notifyContentEnded(nativeId).catch(() => {})}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    player: {width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000'},
  });

################################################################
CONSTRAINTS
################################################################

- Do NOT create a FlowerAdView. It does not exist in the React Native package.
- Do NOT use a ref to identify the player. Use nativeID, unique per mounted element.
- Do NOT call changeChannelUrl / requestVodAd while mounting. Wait for onLoad.
- changeChannelUrl() is for linear-tv ONLY. Use requestVodAd() for VOD.
- Do NOT call play() for linear-tv. The break plays itself.
- Do NOT swap the video source for vod or interstitial. Only linear-tv returns a url.
- For bitmovin, do NOT put the nativeID on <PlayerView>. Use a separate overlay <View>.
- play() and notifyContentEnded() REJECT when no session was started for that nativeId.
  stop() and release() resolve silently.
- Runtime ad failures do NOT reject a promise. They arrive as an 'error' ad event.
- extraParams / headers are plain objects of strings, not Maps.
- There is no global SDK teardown call. initialize() is once per app; release() is per
  nativeID.
- Always remove event subscriptions yourself. release() does not remove them.
- Native SDK logs do NOT appear in the Metro console. Use adb logcat on Android and the
  Xcode console on iOS.
````
