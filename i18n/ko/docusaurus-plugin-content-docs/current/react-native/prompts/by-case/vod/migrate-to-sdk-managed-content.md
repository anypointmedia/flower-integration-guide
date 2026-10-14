---
sidebar_position: 4
sidebar_label: 기존 VOD 연동 전환
---

# VOD 연동을 SDK 관리 방식으로 전환

1.0.x용으로 작성된 연동처럼, 기존 VOD 연동이 `prepare`에서 콘텐츠를 일시정지하고 `completed`나 `error`에서 재개하고 있다면 이 프롬프트를 사용하세요. `setIgnoreAdBreakInPIPMode`가 추가된 릴리스부터는 SDK가 mid-roll 전후의 콘텐츠 일시정지, 되감기, 재개를 직접 처리하므로 해당 앱 코드는 제거해야 하며(mid-roll `error` 시 단순 재개만 안전장치로 남깁니다), 첫 시작 전에 콘텐츠를 붙잡아 두는 부분은 유지해야 합니다. LLM은 기존 컴포넌트에 대한 최소한의 diff를 생성합니다. 배경 설명: [VOD 광고 구현](../../../ad-insertion/vod/vod-ad-implementation.md), [릴리즈 노트](../../../release-notes.md).

| 파라미터 | 예시 | 설명 |
|-----------|---------|-------------|
| `{{SDK_VERSION}}` | `1.0.3` | 업그레이드할 `@anypoint/flower-sdk-react-native` 버전 |
| `{{PLAYER_TYPE}}` | `react-native-video` \| `bitmovin` | VOD 콘텐츠를 재생하는 플레이어 라이브러리 |

````plain
Our React Native app already integrates FLOWER VOD ads (requestVodAd). It was written
for 1.0.x, where the app paused the content around each break. We are upgrading to
@anypoint/flower-sdk-react-native@{{SDK_VERSION}}, where the SDK manages the content
around a mid-roll itself. Migrate the code I provide with the SMALLEST possible diff.

========================================
GOAL
========================================

After the migration the app:
  - holds the content before its first start, until the first 'completed' or 'error',
  - calls play(nativeId) on every 'prepare',
  - never pauses, seeks or re-sources the content after it has started,
  - on an 'error' while the content has started and not ended (a failed mid-roll),
    resumes it — and does nothing else,
  - keeps requestVodAd() from onLoad / onReady, notifyContentEnded() and release() as is,
    marking the content ended just before notifyContentEnded().

========================================
PARAMETERS
========================================

SDK_VERSION: {{SDK_VERSION}}
PLAYER_TYPE: {{PLAYER_TYPE}} (react-native-video | bitmovin)

========================================
HOW THE SDK BEHAVES IN THIS CASE
========================================

Old contract (1.0.x): 'prepare' -> app pauses the content and calls play();
'completed' / 'error' -> app resumes the content.

New contract:
- By default a VOD break plays on the SDK's own ad player over the content. For a
  mid-roll the SDK pauses the content itself at 'prepare' and, at 'completed' or
  'error', seeks it back 5 seconds and resumes it. After a post-roll nothing resumes.
- This now holds for Bitmovin on iOS too, which used to be the exception where the app
  had to pause and resume the Bitmovin player itself.
- The SDK does NOT hold the content for a PRE-ROLL. It sends 'completed' after the
  pre-roll and also when there is no pre-roll, no breaks, or the request fails.
- A mid-roll's 'prepare' now arrives when playback reaches the break position (the ad is
  requested about 10 seconds earlier), so play() goes out right away.
- An app pause that keeps running fights the SDK's own pause, rewind and resume. With
  setIgnoreAdBreakInPIPMode(false) it lands on the player the ad is playing on, freezes
  the ad, and 'completed' never arrives.
- On a failed mid-roll the SDK issues its rewind and resume natively BEFORE it emits
  'error'. The old resume on 'error' therefore survives, reduced to a plain resume
  (react-native-video: videoRef.current?.resume(); Bitmovin: player.play()) as a safety
  net — no seek, no source change, and not after a post-roll, when the content has ended.

========================================
IMPLEMENTATION
========================================

Step 1 — Upgrade the package

  npm install @anypoint/flower-sdk-react-native@{{SDK_VERSION}}
  cd ios && pod install

Step 2 — Inventory. Before changing anything, list every place in the code I provide
that, for the VOD player:
  - sets a paused state / calls player.pause() / player.play() / seek() / load() or
    changes <Video source> from an ad event ('prepare', 'play', 'adPlay', 'completed',
    'error', 'adBreakSkipped'),
  - implements its own rewind after a break,
  - starts the content before or regardless of the first 'completed'.

Step 3 — Replace the paused state with a one-way latch

  Before (typical 1.0.x code):
    const [paused, setPaused] = useState(false);
    ...
    if (event.event === 'prepare') {
      setPaused(true);
      play(nativeId).catch(...);
    } else if (event.event === 'completed') {
      setPaused(false);
    } else if (event.event === 'error') {
      setPaused(false);
      ...
    }
    <Video ... paused={paused} />

  After:
    const [contentStarted, setContentStarted] = useState(false);
    const contentStartedRef = useRef(false);   // the same, readable from the listener
    const contentEnded = useRef(false);        // set from onEnd / onPlaybackFinished
    const videoRef = useRef<VideoRef>(null);   // react-native-video only
    const startContent = () => {
      contentStartedRef.current = true;
      setContentStarted(true);
    };
    ...
    if (event.event === 'prepare') {
      play(nativeId).catch(e => console.error(`play failed: ${e.message}`));
    } else if (event.event === 'completed') {
      startContent();   // first one starts the content; later ones change nothing
    } else if (event.event === 'error') {
      console.error(`ad error: ${event.message}`);
      if (!contentStartedRef.current) {
        startContent();                // pre-roll failed
      } else if (!contentEnded.current) {
        videoRef.current?.resume();    // mid-roll failed (Bitmovin: player.play())
      }
      // post-roll failed: nothing
    }
    <Video ref={videoRef} ... paused={!contentStarted} />

  Bitmovin: delete player.pause() / player.play() calls in the ad event handler — except
  the player.play() in the mid-roll branch of 'error' above — and use
    useEffect(() => { if (contentStarted) player.play(); }, [player, contentStarted]);
  Keep playbackConfig.isAutoplayEnabled off.

Step 4 — Delete app-side rewind or seek logic that ran after a break. The SDK already
rewinds 5 seconds; doing it again moves the viewer further back.

Step 5 — If the old code started the content immediately (paused={false} at mount) and
only paused it at the pre-roll's 'prepare', the latch above now holds it from the
start instead. Check that onLoad / onReady still call requestVodAd() — they fire while
the content is held.

Step 6 — Leave unchanged: requestVodAd() parameters, notifyContentEnded() on
onEnd / onPlaybackFinished (only add contentEnded.current = true just before it),
release() on unmount, subscription.remove(), inline (requestAd) handling. Inline breaks
still need the app to pause and resume its content.

Step 7 — If the app's own controls (a play/pause button) share the same paused state,
keep the viewer's pause working but derive it separately, e.g.
paused={!contentStarted || userPaused}, and never set userPaused from ad events.

========================================
RULES
========================================

DO:
- Keep the diff minimal and confined to the VOD player.
- Keep the hold before the first start; it is what prevents double audio at a pre-roll.

- Keep a plain resume on 'error' while the content has started and not ended.

DO NOT:
- Do NOT pause, seek or re-source the content from any ad event once it has started.
  The resume on a mid-roll 'error' is the one allowed action; it never pauses.
- Do NOT resume the content after a post-roll 'error'.
- Do NOT remove the hold before the first start ("the SDK handles everything" is wrong
  for the pre-roll).
- Do NOT change inline / interstitial handling.
- Do NOT add setIgnoreAdBreakInPIPMode(false) as part of this migration.

========================================
VERIFY
========================================

Android and iOS each, with {{PLAYER_TYPE}}:
1. Pre-roll: no content audio underneath; content starts after 'completed'.
2. No pre-roll / empty response / failed request: content starts.
3. Mid-roll: the content pauses and resumes about 5 s before where it stopped — once,
   not twice (no leftover app rewind).
4. Mid-roll: no paused-state change or player.pause() is logged by the app.
5. Post-roll plays after the content ends; the content does not restart.
6. Ad error in a mid-roll: the content resumes; nothing stays frozen; no app seek.
7. Ad error in a post-roll: the content stays ended and does not restart.
8. Inline breaks (if any) still pause and resume the content as before.

========================================
OUTPUT
========================================

- The Step 2 inventory.
- The migration as a minimal diff of each changed file.
- Anything in the old code whose purpose was unclear, flagged rather than removed.
````
