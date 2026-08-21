---
sidebar_position: 3
---

# Step 3: Ad Integration

This prompt guides an LLM to subscribe to ad events and request ads for the chosen content type.

**Before using:** Fill in `{{AD_TYPE}}` and `{{PLAYER_TYPE}}`.

````plain
We are integrating the FLOWER SDK into our React Native project.
This step implements ad event handling and the ad request itself.

AD_TYPE: {{AD_TYPE}} (linear-tv | vod | interstitial)
PLAYER_TYPE: {{PLAYER_TYPE}} (react-native-video | bitmovin)

========================================
PART 1 — Subscribe to ad events
========================================

Ad events replace the FlowerAdsManagerListener interface of the native SDKs. There is no
listener object to implement — subscribe to a stream of AdEvent values instead.

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

Narrow on event.event to get the payload fields in scope. adBreakSkipped reason codes:
0 Unknown, 1 No Ad, 2 Timeout, 3 Error. adUserAction actions: 'learn_more', 'skip'.

========================================
PART 2 — Who starts the break
========================================

  linear-tv     -> the SDK. The break is scheduled by the cue in the stream and plays
                   itself. Do NOT call play().
  vod           -> your app. The break is prepared, then waits for play().
  interstitial  -> your app. The break is prepared, then waits for play().

For vod and interstitial, the app also pauses and resumes its own content around the
break. The SDK never touches the content player for those.

========================================
PART 3 — Handle events by AD_TYPE
========================================

--------------------------------------------------
If AD_TYPE is "linear-tv":

The app does not drive the break. Handle events for logging and error recovery only.

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

--------------------------------------------------
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

--------------------------------------------------
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
PART 4 — Request the ads
========================================

Use values from your config objects — do NOT hardcode URLs or parameters.
extraParams, adTagHeaders and channelStreamHeaders are plain {key: value} string objects.
Omitting one is not the same as passing an empty object: the SDK reads an omitted value
as "not supplied".

If PLAYER_TYPE is "bitmovin", add `playerType: 'bitmovin'` to the params object of
whichever call you use below. It defaults to 'react-native-video'.

--------------------------------------------------
If AD_TYPE is "linear-tv":

Call from onLoad, guarded against re-entry. Then swap the source to the returned url.

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

--------------------------------------------------
If AD_TYPE is "vod":

Call from onLoad. The content url is NEVER rewritten — do not swap the source.

  await requestVodAd(nativeId, {
    adTagUrl: config.adTagUrl,                                    // Required
    contentId: config.contentId,                                  // Required
    durationMs: config.durationMs,                                // Required (ms)
    extraParams: config.extraParams,                              // Optional
    adTagHeaders: config.adTagHeaders,                            // Optional
  });

durationMs must be the real total duration of the content. The SDK places the break
positions against it.

POST-ROLL: wire the <Video> onEnd prop to notifyContentEnded(nativeId). Without it the
SDK never learns the content is over and no post-roll can run.

  onEnd={() => notifyContentEnded(nativeId).catch(e => console.error(e.message))}

--------------------------------------------------
If AD_TYPE is "interstitial":

No player is needed — call whenever the break belongs in your flow.

  await requestAd(nativeId, {
    adTagUrl: config.adTagUrl,                                    // Required
    extraParams: config.extraParams,                              // Optional
    adTagHeaders: config.adTagHeaders,                            // Optional
  });

========================================
CONSTRAINTS
========================================

- changeChannelUrl() is for linear-tv ONLY. Use requestVodAd() for VOD.
- Do NOT call play() for linear-tv. The break plays itself.
- Do NOT swap the video source for vod or interstitial. Only linear-tv returns a url.
- play() and notifyContentEnded() REJECT when no session was started for that nativeId.
  stop() and release() resolve silently, so teardown paths can call them unconditionally.
- Runtime ad failures do NOT reject a promise. They arrive as an 'error' ad event.
- extraParams / headers are plain objects of strings, not Maps.
````
