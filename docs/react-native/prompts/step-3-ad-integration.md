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

For interstitial, the app also pauses and resumes its own content around the break. The
SDK never touches the content player for it.

For vod, the app only holds the content paused until the first 'completed' or 'error'
(the SDK does NOT pause it for a pre-roll). After that the SDK pauses the content for a
mid-roll and rewinds and resumes it; the app leaves it alone, except that on a mid-roll
'error' it resumes the content as a safety net.

For linear-tv, an 'error' is recovered by restarting the channel: stop(), then a new
changeChannelUrl() with the same params as the first start, prerollAdTagUrl included.

========================================
PART 3 — Handle events by AD_TYPE
========================================

--------------------------------------------------
If AD_TYPE is "linear-tv":

The app does not drive the break. Handle events for logging and error recovery.

  const subscription = addAdEventListenerFor(nativeId, event => {
    switch (event.event) {
      case 'adBreakPrepare':
        console.log(`ad break loaded: ${event.adCount} ads`);
        break;
      case 'play':
        console.log('ad break started');
        break;
      case 'completed':
        // Keep this idempotent: a break cut short by stop() may still report it.
        console.log('ad break finished');
        break;
      case 'error':
        console.error(`ad error: ${event.message}`);
        restartChannel();   // see below
        break;
    }
  });

An 'error' on a channel means the SDK could not keep its ads in the stream. Recover by
starting the channel over: stop the ads
manager, then call changeChannelUrl() again with exactly the same params, prerollAdTagUrl
included, and handle the NEW proxy url it returns as on the first start (Part 4).
stop() keeps the overlay and the subscription; release() would drop them.

Passing prerollAdTagUrl again is safe: if the channel has not changed, the pre-roll is
skipped, and 'completed' arrives right after the call resolves, so a proxy url held until 'completed'
plays as on the first start.

  const restarting = useRef(false);
  const restarts = useRef(0);

  const restartChannel = useCallback(async () => {
    if (restarting.current || restarts.current >= 3) return;   // cheap cap, no endless loop
    restarting.current = true;
    restarts.current += 1;
    try {
      await stop(nativeId);
      // Exactly the same params as Part 4, prerollAdTagUrl included.
      const proxyUrl = await changeChannelUrl(nativeId, {/* ...same as Part 4 */});
      // Then the same handling as Part 4.
      if (config.prerollAdTagUrl) {
        // Held, as on the first start. 'completed' follows right away: the channel
        // has not changed, so the pre-roll is skipped.
        pendingProxyUrl.current = proxyUrl;
      } else {
        setSourceUri(proxyUrl);   // react-native-video; onLoad fires again, the guard holds
        // bitmovin: player.load({url: proxyUrl, type: SourceType.HLS}); play from onReady
      }
    } catch (e: any) {
      console.error(`channel restart failed: ${e.message}`);
    } finally {
      restarting.current = false;
    }
  }, [nativeId, config]);

A channel pre-roll needs no restart: a failed pre-roll reports 'completed', not 'error'.

--------------------------------------------------
If AD_TYPE is "vod":

  import Video, {type VideoRef} from 'react-native-video';

  // Held until the pre-roll is over. Only ever goes from false to true.
  const [contentStarted, setContentStarted] = useState(false);
  const contentStartedRef = useRef(false);   // the same, readable from the listener
  const contentEnded = useRef(false);        // set from onEnd, see Part 4
  const videoRef = useRef<VideoRef>(null);   // <Video ref={videoRef}>; only for resume()

  const startContent = () => {
    contentStartedRef.current = true;
    setContentStarted(true);
  };

  const subscription = addAdEventListenerFor(nativeId, event => {
    if (event.event === 'prepare') {
      // Only play the break. Once the content has started, the SDK pauses it for a
      // mid-roll and, at 'completed', rewinds and resumes it.
      play(nativeId).catch(e => console.error(`play failed: ${e.message}`));
    } else if (event.event === 'completed') {
      // The first one ends the pre-roll, or stands in for it when there is none
      // (the SDK also sends it for an empty ad response or a failed request).
      startContent();
    } else if (event.event === 'error') {
      console.error(`ad error: ${event.message}`);
      if (!contentStartedRef.current) {
        startContent();                 // pre-roll failed: start the held content
      } else if (!contentEnded.current) {
        videoRef.current?.resume();     // mid-roll failed: resume (bitmovin: player.play())
      }
      // post-roll failed: the content has ended, nothing to resume
    }
  });

Pass `paused={!contentStarted}` to the <Video>. The SDK does NOT pause the content for a
pre-roll; without this the content plays underneath the pre-roll with both soundtracks.
For bitmovin, call player.play() only once contentStarted is true, e.g.
useEffect(() => { if (contentStarted) player.play(); }, [player, contentStarted]).

The mid-roll resume on 'error' is a safety net. The SDK brings the content back after a
failed mid-roll itself, so the content is normally already playing again; resuming is a
harmless safety net. It only resumes: no seek, no source change.

Apart from that resume, once the content has started do NOT pause, seek or re-source it
around a VOD break, and do NOT drive the <Video>'s `paused` prop from VOD ad events. With
setIgnoreAdBreakInPIPMode(false) such a pause can land on the player the ad is playing
on, freezing the ad and never handing the content back. resume() never pauses, so it
cannot cause that.

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

PRE-ROLL: with a prerollAdTagUrl the pre-roll runs FIRST. Hold the proxy url in a ref
(pendingProxyUrl) and apply it from the 'completed' event rather than right away.

ERROR: on an 'error', restart the channel with stop() and a NEW changeChannelUrl() call,
as in Part 3. The restart passes the same params, prerollAdTagUrl included, and handles
the proxy url the same way as the first start.

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
SDK never learns the content is over and no post-roll can run. Mark the content ended
first, so a post-roll 'error' does not resume it.

  onEnd={() => {
    contentEnded.current = true;
    notifyContentEnded(nativeId).catch(e => console.error(e.message));
  }}

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
- For vod, hold the content paused only until the first 'completed' or 'error'. Never
  pause, seek or re-source it after it has started. The one action allowed after that
  is resuming it (videoRef.current?.resume() / bitmovin player.play()) on an 'error'
  while the content has started and not ended. After a post-roll 'error', do nothing.
- For linear-tv, on 'error' await stop(nativeId), then call changeChannelUrl() again
  with exactly the same params, prerollAdTagUrl included, and handle the new proxy url
  as on the first start. Cap the restarts. Do NOT release() to recover.
- play() and notifyContentEnded() REJECT when no session was started for that nativeId.
  stop() and release() resolve silently, so teardown paths can call them unconditionally.
- Runtime ad failures do NOT reject a promise. They arrive as an 'error' ad event.
- extraParams / headers are plain objects of strings, not Maps.
````
