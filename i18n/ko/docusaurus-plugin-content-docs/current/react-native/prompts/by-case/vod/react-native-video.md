---
sidebar_position: 1
sidebar_label: react-native-video
---

# react-native-video로 VOD 연동

`react-native-video`로 재생하는 주문형 콘텐츠에 프리롤, mid-roll, post-roll 광고를 추가할 때 이 프롬프트를 사용하세요. 브레이크가 SDK 자체 광고 플레이어에서 재생되는 기본 모드를 다룹니다. LLM은 프리롤이 끝날 때까지 콘텐츠를 붙잡아 두고, 그 이후에는 콘텐츠를 SDK에 맡기는 VOD 플레이어 컴포넌트를 생성합니다. 배경 설명: [VOD 광고 구현](../../../ad-insertion/vod/vod-ad-implementation.md).

| 파라미터 | 예시 | 설명 |
|-----------|---------|-------------|
| `{{SDK_VERSION}}` | `1.0.3` | 설치할 `@anypoint/flower-sdk-react-native` 버전. 패키지가 이미 설치되어 있으면 무시됩니다. |

````plain
We are integrating the FLOWER SDK into our React Native app for VOD content played by
react-native-video, in the default ad mode. Modify the code I provide; do not generate
a new app from scratch.

========================================
GOAL
========================================

A VOD player component that:
  - mounts <Video nativeID> on the content url, PAUSED,
  - calls requestVodAd() from onLoad,
  - calls play() on every 'prepare',
  - starts the content on the first 'completed' or 'error' and never pauses it again,
  - resumes the content on a later 'error' while it has not ended (a failed mid-roll),
  - calls notifyContentEnded() from onEnd so a post-roll can run,
  - releases the session on unmount.

========================================
PARAMETERS
========================================

SDK_VERSION: {{SDK_VERSION}}

From the app's config objects (do NOT hardcode):
  contentUrl     content url, played as is                         (required)
  adTagUrl       ad tag url issued by Anypoint Media               (required)
  contentId      content id registered in FLOWER                   (required)
  durationMs     REAL total duration of the content, milliseconds  (required)
  extraParams    targeting values, {key: value} strings            (optional)
  adTagHeaders   headers for ad requests                           (optional)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

- The content url is never rewritten. requestVodAd() needs the player to exist, so it
  is called from onLoad. It does not return a url and the source is never swapped.
- Break positions come from the ad response, placed against durationMs.
- Every break arrives as 'prepare' and waits for play(nativeId).
- PRE-ROLL: the SDK does NOT pause the content for it. If the content is already
  playing, it plays underneath the pre-roll and both soundtracks are heard.
- The SDK sends 'completed' after the pre-roll, and ALSO when there is no pre-roll, the
  ad response has no breaks, or the ad request fails or times out. So the first
  'completed' (or an 'error') is always the moment to start the content.
- MID-ROLL: the ad is requested about 10 seconds before its position, and 'prepare' is
  held until playback reaches the position. The break plays on the SDK's own ad player
  over the <Video>. The SDK pauses the content itself and, at 'completed' or 'error',
  seeks it back 5 seconds (the rewind duration, not configurable from React Native) and
  resumes it.
- MID-ROLL 'error': the SDK stops the ad and issues that rewind and resume natively
  BEFORE it emits 'error'; the event then reaches JS asynchronously. The app still
  resumes the content (videoRef.current?.resume()) as a safety net. It normally finds
  the content already playing and changes nothing; it never seeks or re-sources.
- POST-ROLL: requested only after notifyContentEnded(nativeId). The content has ended,
  so it is not resumed afterwards — not after 'completed', not after 'error'.
- While the app reports PIP mode, mid-rolls and post-rolls are not requested, and an ad
  playing when PIP starts is paused until the app comes back (see the PIP prompt).

========================================
SETUP — only if the package is not installed yet
========================================

Skip if @anypoint/flower-sdk-react-native is already installed and builds.
1. .npmrc: @anypoint:registry=https://maven.anypoint.tv/repository/npm-registry/
   (keep the "@anypoint:" scope prefix)
2. npm install @anypoint/flower-sdk-react-native@{{SDK_VERSION}} react-native-video
   (react-native-video >= 6.0.0, verified against 6.19.2; pin it)
3. android/build.gradle: buildscript.ext useExoplayerIMA = true (MANDATORY) and
   media3Version = "1.8.0"; repositories
   maven { url "https://maven.anypoint.tv/repository/public-release" } and
   maven { url "https://jitpack.io" }
4. android/app/build.gradle: compileOptions.coreLibraryDesugaringEnabled true and
   coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
5. Android network_security_config.xml cleartext exception for
   prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com, referenced from
   <application android:networkSecurityConfig="@xml/network_security_config">
6. iOS: cd ios && pod install. If any content is plain HTTP, Info.plist ATS needs
   NSAllowsArbitraryLoads standing alone.
7. initialize('Info') once at app startup, before any other SDK call.

========================================
IMPLEMENTATION
========================================

Step 1 — Imports and state

  import React, {useCallback, useEffect, useRef, useState} from 'react';
  import {StyleSheet, View} from 'react-native';
  import Video, {type VideoRef} from 'react-native-video';
  import {
    addAdEventListenerFor,
    notifyContentEnded,
    play,
    release,
    requestVodAd,
  } from '@anypoint/flower-sdk-react-native';

  export function VodPlayer({nativeId, config}) {
    // Held until the pre-roll is over. Only ever goes from false to true.
    const [contentStarted, setContentStarted] = useState(false);
    const contentStartedRef = useRef(false);   // the same, readable from the listener
    const contentEnded = useRef(false);        // set from onEnd
    const videoRef = useRef<VideoRef>(null);   // only for resume() after a mid-roll error
    const requested = useRef(false);

    const startContent = useCallback(() => {
      contentStartedRef.current = true;
      setContentStarted(true);
    }, []);
    ...
  }

Step 2 — Ad events (subscribe before requesting)

  useEffect(() => {
    const subscription = addAdEventListenerFor(nativeId, event => {
      if (event.event === 'prepare') {
        play(nativeId).catch(e => console.error(`play failed: ${e.message}`));
      } else if (event.event === 'completed') {
        // First one: pre-roll over, or no pre-roll at all. Later ones change nothing.
        startContent();
      } else if (event.event === 'error') {
        console.error(`ad error: ${event.message}`);
        if (!contentStartedRef.current) {
          startContent();                // pre-roll failed: never leave the content held
        } else if (!contentEnded.current) {
          videoRef.current?.resume();    // mid-roll failed: resume; no seek, no re-source
        }
        // post-roll failed: the content has ended, nothing to resume
      }
    });
    return () => subscription.remove();
  }, [nativeId, startContent]);

Step 3 — Request from onLoad

  const request = useCallback(async () => {
    if (requested.current) return;
    requested.current = true;
    try {
      await requestVodAd(nativeId, {
        adTagUrl: config.adTagUrl,
        contentId: config.contentId,
        durationMs: config.durationMs,
        extraParams: config.extraParams,     // omit if not configured
        adTagHeaders: config.adTagHeaders,   // omit if not configured
      });
    } catch (e: any) {
      // Rejected (no view / no player yet): no ad will come, so do not hold the content.
      console.error(`requestVodAd failed: ${e.message}`);
      startContent();
    }
  }, [nativeId, config, startContent]);

Step 4 — Release on unmount

  useEffect(
    () => () => {
      if (requested.current) {
        release(nativeId).catch(() => {});
      }
    },
    [nativeId],
  );

Step 5 — Render

  return (
    <View style={styles.player}>
      <Video
        ref={videoRef}
        nativeID={nativeId}                    // unique on screen
        source={{uri: config.contentUrl}}      // never rewritten for VOD
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        paused={!contentStarted}               // held before the first start ONLY
        onLoad={request}                       // fires while paused too
        onEnd={() => {
          contentEnded.current = true;         // first: a post-roll error must not resume
          notifyContentEnded(nativeId).catch(e =>
            console.error(`notifyContentEnded failed: ${e.message}`),
          );
        }}
        onError={e => console.error(`player error: ${JSON.stringify(e)}`)}
      />
    </View>
  );

If the app has its own play/pause button, keep it working for the viewer, but do not
let it start the content before contentStarted is true. If the same screen plays another
content next, render the component with key={contentId} so a new content starts held.

========================================
RULES
========================================

DO:
- Hold the content paused only until the first 'completed' or 'error'.
- Call play(nativeId) on every 'prepare' (pre-roll, mid-roll and post-roll).
- Pass the real durationMs of the content.
- Wire onEnd to notifyContentEnded(nativeId), setting contentEnded first.
- On 'error': content not started -> start it; started and not ended ->
  videoRef.current?.resume(); ended -> nothing.

DO NOT:
- Do NOT pause, seek or change the source of the content after it has started — not on
  'prepare', 'play', 'completed' or 'error'. The SDK pauses and resumes it for a
  mid-roll; an app pause fights the SDK's own pause, rewind and resume. The resume on a
  mid-roll 'error' is the one allowed action; it never pauses.
- Do NOT resume the content after a post-roll 'error'.
- Do NOT call requestVodAd() while mounting, before onLoad.
- Do NOT call changeChannelUrl() for VOD, and do NOT swap the source.
- Do NOT call release() before the content is left; later breaks need the session.
- Do NOT use a ref to identify the player, and do NOT create any ad view.

========================================
VERIFY
========================================

Android and iOS each:
1. Pre-roll: the ad plays with NO content audio underneath; the content starts from
   0:00 right after 'completed'.
2. No pre-roll (or an empty ad response): the content starts within the ad request time
   after onLoad, without any ad.
3. Ad request failure (e.g. an invalid adTagUrl): the content still starts.
4. Mid-roll: at the break position the content pauses, the ad plays, and the content
   resumes about 5 seconds before where it stopped. The app logged no pause/seek.
5. Post-roll: at the end of the content the post-roll plays; the content does not
   restart afterwards.
6. Ad error in a mid-roll: the content resumes (about 5 s before where it stopped, from
   the SDK's own rewind); nothing is left frozen, and the app logged no seek.
7. Ad error in a post-roll: the content stays ended and does not restart.
8. Ad error in a pre-roll: the content starts from 0:00.
9. Unmount mid-break: release() runs and no overlay remains.

========================================
OUTPUT
========================================

- The full VOD player component and the screen that mounts it.
- Any setup changes as diffs.
- Where durationMs comes from in the app, and any assumptions about config names.
````
