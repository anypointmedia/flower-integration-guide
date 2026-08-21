---
sidebar_position: 2
---

# Step 2: Ad UI Declaration & Player Setup

This prompt guides an LLM to mount the video player with a `nativeID` and wire the two-phase player handover.

**Before using:** Fill in `{{AD_TYPE}}` and `{{PLAYER_TYPE}}`.

````plain
We are integrating the FLOWER SDK into our React Native project.
This step mounts the video player and prepares it for the SDK handover.

AD_TYPE: {{AD_TYPE}} (linear-tv | vod | interstitial)
PLAYER_TYPE: {{PLAYER_TYPE}} (react-native-video | bitmovin)

========================================
PART 1 — There is no ad view to declare
========================================

Unlike the Android, iOS and HTML5 SDKs, the React Native package has NO FlowerAdView for
the app to place, and no player wrapper class to adopt. The SDK creates and mounts its ad
overlay itself, over the view carrying the nativeID it is given.

So this step is only about the video player and its nativeID.

========================================
PART 2 — Addressing by nativeID
========================================

Every SDK call takes a nativeId string as its FIRST argument. That string is the
nativeID prop of the <Video> element the session belongs to.

  <Video nativeID="channel-1" source={{uri: streamUrl}} />
  await changeChannelUrl('channel-1', {...});

RULES:
- Every nativeID on screen must be UNIQUE. All SDK state is keyed by it, and every ad
  event carries it back.
- Do NOT try to identify the player with a ref. react-native-video's ref is an imperative
  handle, so findNodeHandle() cannot resolve it, and under the new architecture the video
  view is not mounted as a descendant of the element wrapping it.

========================================
PART 3 — Mount the player
========================================

--------------------------------------------------
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

  const styles = StyleSheet.create({
    player: {width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000'},
  });

--------------------------------------------------
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
    <PlayerView
      player={player}
      style={StyleSheet.absoluteFill}
      onReady={handOver}
    />
    {/* the ad overlay's host — separate from <PlayerView> on purpose */}
    <View
      nativeID={NATIVE_ID}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    />
  </View>

========================================
PART 4 — The two-phase handover
========================================

Applies to AD_TYPE "linear-tv" and "vod". Skip for "interstitial".

The SDK needs the REAL player instance so it can attach an adapter and follow playback.
react-native-video builds and owns that player internally and only constructs one once a
source has been set. So:

  Phase 1: mount <Video nativeID="..."> on the ORIGINAL url.
           That is what makes react-native-video construct its player.
  Phase 2: once the player exists, call the SDK. onLoad is the reliable signal.
  Phase 3 (linear-tv only): swap <Video source> to the proxy url the SDK returned.

Phase 3 does NOT rebuild the player — react-native-video only constructs one when its
player field is null — which is what keeps the adapter's listeners valid.

Calling before the player exists rejects with:
  "react-native-video has not created its ExoPlayer yet. Mount <Video> on the original
   URL and wait for onLoad before calling this."
(iOS sends the same sentence with AVPlayer in place of ExoPlayer.)

For PLAYER_TYPE "bitmovin", the player comes from usePlayer() rather than from the view,
so it exists as soon as the hook has run — use onReady on <PlayerView>. Mounting the
overlay view is what the OVERLAY waits for.

--------------------------------------------------
If AD_TYPE is "interstitial":

requestAd() does NOT need the content player to exist — the break plays on the SDK's own
ad player, and only the view is looked up. Mount the <Video> normally and call the SDK
whenever the break belongs in your flow.

========================================
PART 5 — Re-entry guard (linear-tv only)
========================================

onLoad fires AGAIN after the source is swapped to the proxy url. Without a guard the
second onLoad would call changeChannelUrl() a second time:

  const handedOver = useRef(false);

  const handOver = useCallback(async () => {
    if (handedOver.current) return;
    // ... call the SDK, then:
    handedOver.current = true;
  }, [...]);

========================================
CONSTRAINTS
========================================

- Do NOT create a FlowerAdView. It does not exist in the React Native package.
- Do NOT use a ref to identify the player. Use nativeID.
- Do NOT call changeChannelUrl / requestVodAd while mounting. Wait for onLoad.
- For bitmovin, do NOT put the nativeID on <PlayerView>. Use a separate overlay <View>.
- Each nativeID must be unique among the elements mounted at the same time.
````
