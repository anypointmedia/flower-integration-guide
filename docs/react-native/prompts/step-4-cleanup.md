---
sidebar_position: 4
---

# Step 4: Cleanup & Release

This prompt guides an LLM to release SDK sessions and remove event subscriptions when a component unmounts.

**Before using:** Fill in `{{AD_TYPE}}`.

````plain
We are integrating the FLOWER SDK into our React Native project.
This step implements proper cleanup.

AD_TYPE: {{AD_TYPE}} (linear-tv | vod | interstitial)

========================================
PART 1 — Two independent things to clean up
========================================

  1. The SDK session      -> release(nativeId)
  2. Your event listeners -> subscription.remove()

They are NOT linked. release() removes the SDK's own internal listener and stops any
break in progress, but it does not touch subscriptions the app created with
addAdEventListener() / addAdEventListenerFor().

========================================
PART 2 — Release the session on unmount
========================================

The native side RETAINS the ad overlay for each nativeID. Skipping release() leaks it:
the overlay outlives the player it was mounted over, along with its ads manager and its
local proxy.

  import {useEffect, useRef} from 'react';
  import {release} from '@anypoint/flower-sdk-react-native';

  const started = useRef(false);

  useEffect(
    () => () => {
      if (started.current) {
        release(nativeId).catch(() => {});
      }
    },
    [nativeId],
  );

Set started.current = true right after changeChannelUrl / requestVodAd / requestAd
resolves. The guard is optional — release() ignores an unknown nativeId — but it keeps
the intent readable.

Note the effect returns the cleanup function directly and depends only on [nativeId], so
it is not re-run by unrelated re-renders.

========================================
PART 3 — Remove event subscriptions
========================================

  useEffect(() => {
    const subscription = addAdEventListenerFor(nativeId, handleAdEvent);
    return () => subscription.remove();
  }, [nativeId]);

Keep this in its own effect, separate from the release effect above. The listener should
be attached before the ad request is made and removed on unmount.

========================================
PART 4 — Stopping a break without ending the session
========================================

  stop(nativeId)     -> ends the ad break in progress. The content keeps playing and the
                        session stays alive, so a later break will still play.
  release(nativeId)  -> detaches the SDK from that <Video> entirely.

Both ignore an unknown nativeId rather than rejecting, so teardown paths can call them
without tracking whether a session was ever started.

--------------------------------------------------
If AD_TYPE is "linear-tv":

  // leaving the channel
  await release(nativeId);

  // stopping only the current break (rare — the SDK schedules them)
  await stop(nativeId);

--------------------------------------------------
If AD_TYPE is "vod":

  // exiting the content
  await release(nativeId);

Make sure the content is not left paused. If your last state change was setPaused(true)
from a 'prepare' event and the user navigates away mid-break, the paused state goes with
the unmounted component — but if the same <Video> is reused, reset it explicitly.

--------------------------------------------------
If AD_TYPE is "interstitial":

  // after the break completes or errors
  await stop(nativeId);

  // on unmount
  await release(nativeId);

========================================
PART 5 — Full component skeleton
========================================

  function AdPlayer({nativeId, config}) {
    const [paused, setPaused] = useState(false);
    const started = useRef(false);

    // 1. events
    useEffect(() => {
      const subscription = addAdEventListenerFor(nativeId, event => {
        // ... see Step 3
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
        // ... see Step 3
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
          paused={paused}
          onLoad={start}
        />
      </View>
    );
  }

========================================
CONSTRAINTS
========================================

- There is no global SDK teardown call. initialize() is called once for the app's
  lifetime; release() is per nativeID.
- Always remove event subscriptions yourself. release() does not remove them.
- release() and stop() never reject on an unknown nativeId, so .catch(() => {}) in a
  cleanup path is about promise hygiene, not about handling a real failure.
- Do not call release() while the <Video> is still mounted and playing a proxied stream —
  the overlay goes with it.
````
