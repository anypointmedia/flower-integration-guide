---
sidebar_position: 3
sidebar_label: 기존 VOD 연동 업데이트
---

# 기존 VOD 연동을 SDK가 본편을 관리하는 방식으로 업데이트

이전 방식으로 VOD 광고를 연동하여 앱이 직접 본편이나 광고를 일시정지, 재개, 탐색(seek), 지연하고 있는 경우(예: `onPlay`에서 플레이어 일시정지, `onPrepare`에서 `play()` 지연, `onCompleted`에서 `videoElement.play()` 호출) 이 프롬프트를 사용하세요. 현재 기본 모드에서는 SDK가 Ad Break 전후의 본편을 직접 제어하므로, 이러한 앱 코드는 프리롤 아래에서 본편 소리가 들리거나 mid-roll이 늦게 시작되는 등의 문제를 일으킵니다. LLM이 해당 코드를 제거하고 `isContentPrepared` 패턴을 적용하도록 안내합니다. [VOD 광고 적용](../../../ad-insertion/vod/vod-ad-implementation.md) 페이지를 참고하세요.

| 매개변수 | 값 | 설명 |
|-----------|--------|-------------|
| `PLAYER` | `hls.js` \| `bitmovin` \| `dash.js` \| `shaka` | 앱에서 VOD 재생에 사용하는 플레이어 라이브러리 |

```plain
Our HTML5/Web VOD player already integrates FLOWER SDK VOD ads with
FlowerAdsManager.requestVodAd(). Update the integration to the current SDK behavior,
where the SDK manages the content around ad breaks. Modify the code I paste after this
prompt. Change only what is listed below.

========================================
GOAL
========================================

- Remove every place where the app pauses, resumes, seeks, reloads, or delays playback
  around an ad break. The one exception is a play() safety net in onError() after a
  mid-roll (change 4).
- Start the content only on the first onCompleted()/onError() (isContentPrepared pattern).
- Keep everything else (UI, analytics, player setup) unchanged.

========================================
PARAMETERS
========================================

PLAYER: {{PLAYER}}   (hls.js | bitmovin | dash.js | shaka)

========================================
HOW THE SDK BEHAVES NOW
========================================

1. By default (FlowerSdk.setIgnoreAdBreakInPIPMode(true)), VOD ads play in the SDK's own
   video element over the content.
2. Pre-roll: the SDK does not pause the content, so content loaded right after
   requestVodAd() plays with audio under the pre-roll.
3. The SDK calls onCompleted() after the pre-roll, and also when there is no pre-roll,
   no ad, or the ad request fails. onError() is called when an ad fails to play, and
   onCompleted() may follow it. On a mid-roll error the content is normally
   already playing again; resuming is a harmless safety net, so the app calls play()
   there (no seek or reload). onError() is also called with a message starting with
   "playback unrecoverable" when the content stops and the SDK cannot recover it: the app
   reloads the content or shows an error, without that play().
4. Mid-roll: onPrepare() arrives when the content reaches the mid-roll position. The SDK
   pauses the content on onPrepare(), and when the break ends it seeks the content back by rewindDuration
   (default 5000 ms) and resumes it.
5. Post-roll: after notifyContentEnded(); the content is not resumed afterwards.
6. Optional trailing requestVodAd() arguments, in milliseconds (null = default 5000):
   requestTimeout, minPrepareDuration, rewindDuration. rewindDuration 0 resumes the
   content exactly where it was interrupted.
7. onAdBreakPrepare(adInfos) is called when an ad break has been loaded, before its
   onPrepare(). For a mid-roll this is before the content reaches the mid-roll position.

========================================
CHANGES TO MAKE
========================================

Search the pasted code for each pattern below and apply the change.

1. Content loaded right after requestVodAd()
   Before:
       flowerAdView.adsManager.requestVodAd(...);
       player.loadSource(url);  /  player.load(...)  /  player.attachSource(url)  /  videoElement.play()
   After: move that load-and-play code into prepareContentSource() and call it only from
   the first onCompleted()/onError():
       let isContentPrepared = false;   // reset to false before every requestVodAd()
       function prepareContentSource() { /* the moved {{PLAYER}} load-and-play code */ }

2. Pausing in onPlay()
   Before:  onPlay() { yourPlayer.pause(); ... }
   After:   onPlay() { /* UI-only actions, e.g. hide custom controls */ }

3. Delayed or conditional play() in onPrepare()
   Before:
       onPrepare(adDurationMs) {
           if (!videoElement.paused) {
               showNotification('Ads will start in a moment.');
               setTimeout(() => { flowerAdView.adsManager.play(); }, 5000);
           } else {
               flowerAdView.adsManager.play();
           }
       }
   After:
       onPrepare(adDurationMs) { flowerAdView.adsManager.play(); }
   If a "the ad starts soon" notice is still wanted for mid-rolls, show it from
   onAdBreakPrepare(adInfos) when isContentPrepared is true and isContentEnd is false.
   It is UI only: never pause or delay anything for it.

4. Resuming the content in onCompleted()/onError()
   Before:
       onCompleted() { if (!isContentEnd) { videoElement.play(); } }
       onError(error) { if (!isContentEnd) { videoElement.play(); } }
   After:
       onCompleted() {
           if (!isContentPrepared) { isContentPrepared = true; prepareContentSource(); }
           else if (isContentEnd) { /* post-roll done: playback finished */ }
           // after a mid-roll the SDK resumes the content by itself
       }
       onError(error) {
           if (!isContentPrepared) { isContentPrepared = true; prepareContentSource(); }  // pre-roll error
           else if (error?.message?.startsWith('playback unrecoverable')) {
               // The content stopped and the SDK cannot recover it:
               // reload the content or show an error. No safety-net play() here.
           }
           else if (!isContentEnd) { videoElement.play(); }  // mid-roll error: play() only (bitmovin: player.play())
           // post-roll error (isContentEnd): playback is over - nothing to resume
       }
   Remove any seek, currentTime assignment, or source reload from the old onError() for ad
   errors; keep (or add) only the guarded play() and the "playback unrecoverable" branch above.

5. App-side seek-back or resume-point logic after a mid-roll
   Remove it. If the product needs a different rewind, pass rewindDuration to
   requestVodAd() instead (0 = no rewind).

6. Hiding the content <video> or muting it during ads
   Remove it if it existed only to hide the content under an ad: the SDK pauses the
   content for mid-rolls, and with change 1 nothing plays under the pre-roll.

7. Calls the app made to restart the content when an ad failed or was skipped
   (onAdBreakSkipped, timeouts, custom watchdog timers that call play()).
   Remove them; onCompleted()/onError() already cover these cases.

8. Keep as they are:
   - notifyContentEnded() on the content's end (make sure it is called only once).
   - flowerAdView.adsManager.pause()/resume() on user pause/resume.
   - removeListener() followed by stop() when leaving the VOD screen
     (fix the order if stop() comes first).

9. Player check
   The player passed through MediaPlayerHook must be HLS.js, Bitmovin, dash.js or Shaka,
   created (and for hls.js, attachMedia() called) before requestVodAd(). With an
   unsupported player (e.g. Video.js) no callback arrives, so the content would never
   start with the new pattern. Report it if the pasted code uses another player.

========================================
RULES
========================================

DO NOT:
- Add any new pause(), play(), seek, currentTime assignment, or source change around
  ad events, other than the guarded play() in onError() after a mid-roll and the
  "playback unrecoverable" reload or error (change 4).
- Call the safety-net play() for a "playback unrecoverable" onError().
- Resume the content in onError() after a post-roll (isContentEnd).
- Add setTimeout around flowerAdView.adsManager.play().
- Change requestVodAd() arguments other than adding the optional trailing ones on request.
- Switch to FlowerSdk.setIgnoreAdBreakInPIPMode(false) unless ads must play in PIP mode;
  that mode needs different event handling and is a separate prompt.

========================================
VERIFY
========================================

- Pre-roll: no content audio or frames under the ad; the content starts after it.
- No pre-roll / no ad / ad server down: the content starts once.
- Mid-roll: starts exactly at its position (no 5-second delay); the content resumes about
  rewindDuration before the interruption point.
- Post-roll: plays once; the content does not restart.
- Ad error during a pre-roll: the content starts exactly once.
- Ad error during a mid-roll: the content resumes about rewindDuration before the
  interruption point, without being reloaded.
- Ad error during a post-roll: the content stays ended.
- onError() with "playback unrecoverable": the content is reloaded or an error is shown;
  play() is not called for it.
- Leaving the screen during an ad: nothing starts playing afterwards.

========================================
OUTPUT
========================================

- Show each change as a before/after diff, grouped by the numbered items above.
- List every changed file. Say explicitly which numbered items did not apply.
- Do not add linear TV, interstitial, or PIP code.
```
