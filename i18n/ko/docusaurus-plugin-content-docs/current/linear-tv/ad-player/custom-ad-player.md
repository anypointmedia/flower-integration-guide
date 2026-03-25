---
sidebar_position: 2
---

# 커스텀 광고 플레이어

SDK를 통합하여 광고를 운영하는 가장 쉬운 방법은 모든 제어를 SDK에 위임하는 것이지만, 이 섹션에서는 TV 앱이 이미 구현한 비디오 플레이어를 사용하여 광고를 재생하는 방법에 대해 설명합니다.

이 방식은 하드웨어 성능이 낮거나 다른 사용자 경험을 추가로 제공하려는 경우에 유용합니다.

이렇게 하려면 SDK가 제공하는 `AnypointAdPlayer` 인터페이스를 상속하여 구현한 후 `AnypointAdView`에 등록하면 됩니다.

단, 광고 재생에 사용되는 레이어는 여타 사용자 액션을 인식하는 광고 UI에 사용되는 `AnypointAdView` 레이어보다 아래에 위치해야 합니다.

## AnypointAdPlayer Interface 구현
### addCallback
광고 플레이어의 상태에 따라 콜백을 받는 객체를 등록하는 함수이며, 다수의 콜백 객체를 처리할 수 있도록 구현되어야 합니다.

이 콜백 객체는 SDK 내부 동작에 큰 중심이 되므로 반드시 올바른 시점에 호출하도록 해야 합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    private final ArrayList<AnypointAdPlayerCallback> callbacks = new ArrayList<>();
...
    @Override
    public void addCallback(AnypointAdPlayerCallback callback) {
        if (!callbacks.contains(callback))
            callbacks.add(callback);
    }
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    private val callbacks: MutableList<AnypointAdPlayerCallback> = mutableListOf()
...
    override fun addCallback(callback: AnypointAdPlayerCallback) {
        if (!callbacks.contains(callback))
            callbacks.add(callback)
    }
...
}
```

### removeCallback
등록된 콜백 객체를 제거하는 함수이며, 전달된 객체와 일치하는 콜백 객체만 제거해야 합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    private final ArrayList<AnypointAdPlayerCallback> callbacks = new ArrayList<>();
...
    @Override
    public void removeCallback(AnypointAdPlayerCallback callback) {
        callbacks.remove(callback);
    }
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    private val callbacks: MutableList<AnypointAdPlayerCallback> = mutableListOf()
...
    override fun removeCallback(callback: AnypointAdPlayerCallback) {
        callbacks.remove(callback)
    }
...
}
```

### load
재생할 광고 목록과 총 재생 시간을 전달하는 함수이며, 이 함수가 호출되면 일반적인 미디어 플레이어의 prepare 함수를 실행합니다. 마지막 단계에서는 등록된 `AnypointAdPlayerCallback`에 포함된 모든 객체에 대해 `onLoaded(String mediaUrl)`를 호출해야 합니다. `onLoaded`의 파라미터는 `playSet`의 첫 번째 media URL을 넘깁니다. 단, 여러 파일을 재생하는 경우에는 첫 번째 파일이 로드될 때만 `onLoaded`를 호출해야 합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    private final ArrayList<AnypointAdPlayerCallback> callbacks = new ArrayList<>();
    private final ArrayList<PlaySet> playSets = new ArrayList<>();
    private final ArrayList<String> mediaUrls = new ArrayList<>();
    private int currentMediaUrlIndex = 0;
    private Long adTotalDuration = 0L;
...
    @Override
	public void load(PlaySet playSet) {
		playSets.clear();
		mediaUrls.clear();

		playSets.add(playSet);
		mediaUrls = playSet.toMediaUrls();
		adTotalDuration = playSet.getDuration();
		currentMediaUrlIndex = 0;

		//TODO: Prepare the media player

        for (AnypointAdPlayerCallback callback : callbacks) {
            callback.onLoaded(mediaUrls.get(0));
        }
	}
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    private val callbacks: MutableList<AnypointAdPlayerCallback> = mutableListOf()
    private val playSets: MutableList<PlaySet> = mutableListOf()
    private val mediaUrls: MutableList<String> = mutableListOf()
    private var currentMediaUrlIndex = 0
    private var adTotalDuration: Long = 0L

    override fun load(playSet: PlaySet) {
        playSets.clear()
        mediaUrls.clear()

        playSets.add(playSet)
        mediaUrls.addAll(playSet.toMediaUrls())
        adTotalDuration = playSet.duration
        currentMediaUrlIndex = 0

		//TODO: Prepare the media player

        callbacks.forEach { it.onLoaded(mediaUrls.first()) }
    }
```

### play
prepare 함수를 통해 로딩된 미디어 리소스를 화면에 재생하는 함수입니다. 여러 파일을 재생하는 경우 load 함수에 전달된 광고 목록을 순차적으로 재생해야 합니다. 첫 번째 `mediaUrl`이 재생될 때에만 `AnypointAdPlayerCallback`에 포함된 모든 객체에 대해 현재 재생 중인 mediaUrl의 정보와 함께 `onPlay(String mediaUrl)`를 호출해야 합니다.

마지막 MediaUnit은 실제 영상 길이가 아니라 `PlaySet.getEndingDurationUs`을 통해 확인되는 길이만큼만 재생해야 합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    private final ArrayList<AnypointAdPlayerCallback> callbacks = new ArrayList<>();
    private final ArrayList<String> mediaUrls = new ArrayList<>();
	private int currentMediaUrlIndex = 0;
...
    @Override
	public void play() {
		//TODO: Play the media player

	    if (currentMediaUrlIndex == 0) {
            for (AnypointAdPlayerCallback callback : callbacks) {
                callback.onPlay(mediaUrls.get(0));
            }
        }
	}
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    private val callbacks: MutableList<AnypointAdPlayerCallback> = mutableListOf()
    private val mediaUrls: MutableList<String> = mutableListOf()
    private var currentMediaUrlIndex = 0
...
    override fun play() {
		//TODO: Play the media player

	    if (currentMediaUrlIndex == 0) {
            callbacks.forEach { it.onPlay(mediaUrls.first()) }
        }
    }
...
}
```

### append
현재 재생 목록 끝에 새 재생 목록을 추가합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer, MediaPlayer.OnCompletionListener {
    private final ArrayList<PlaySet> playSets = new ArrayList<>();
    private final ArrayList<String> mediaUrls = new ArrayList<>();
    private Long adTotalDuration = 0L;
...
    @Override
	public void append(PlaySet playSet) {
        mediaUrls.addAll(playSet.toMediaUrls());
        playSets.add(playSet);
        adTotalDuration += playSet.getDuration();
          // TODO: In the custom player, add another playlist.
          // When playing the last file of the current playlist, play only for PlaySet.getEndingDurationUs.
          // Then immediately play the added playlist.
	}
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    private val playSets: MutableList<PlaySet> = mutableListOf()
    private val mediaUrls: MutableList<String> = mutableListOf()
    private var adTotalDuration: Long = 0L
...
    override fun append(playSet: PlaySet) {
        mediaUrls.addAll(playSet.toMediaUrls())
        playSets.add(playSet)
        adTotalDuration += playSet.duration
    }
...
}
```

### currentMediaUrl
현재 재생 중인 미디어의 URL을 반환합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    private final ArrayList<String> mediaUrls = new ArrayList<>();
  	private int currentMediaUrlIndex = 0;
...
    @Override
	public String currentMediaUrl() {
		return mediaUrls.get(currentMediaUrlIndex);
	}
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    private val mediaUrls: MutableList<String> = mutableListOf()
    private var currentMediaUrlIndex = 0
...
    override fun currentMediaUrl(): String {
        return mediaUrls[currentMediaUrlIndex]
    }
...
}
```

### getCurrentMediaUnitIndex
현재 재생 중인 미디어의 순번을 반환합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
  	private int currentMediaUrlIndex = 0;
...
    @Override
    public int getCurrentMediaUnitIndex() {
        return currentMediaUrlIndex;
    }
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    private var currentMediaUrlIndex = 0
...
    override fun getCurrentMediaUnitIndex(): Int {
       return currentMediaUrlIndex
    }
...
}
```

### getVolume
현재 재생 중인 플레이어의 볼륨을 반환합니다. 0.0부터 1.0 사이의 값입니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    @Override
    public float getVolume() {
        //TODO: Return the volume of the media player
    }
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    override fun getVolume(): Float {
        //TODO: Return the volume of the media player
    }
...
}
```

### isAdPlaying
광고가 재생 중인지 여부를 반환합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    @Override
	public boolean isAdPlaying() {
        // If an ad is playing, return true
        // If an ad is not playing, return false
	}
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    override fun isAdPlaying(): Boolean {
        // If an ad is playing, return true
        // If an ad is not playing, return false
    }
...
}
```

### pause
광고가 재생 중이면 일시 정지합니다. `AnypointAdPlayerCallback`에 등록된 모든 객체에 대해 현재 재생 중인 mediaUrl의 정보와 함께 `onPause(String mediaUrl)`를 호출해야 합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    private final ArrayList<AnypointAdPlayerCallback> callbacks = new ArrayList<>();
    private final ArrayList<String> mediaUrls = new ArrayList<>();
    private int currentMediaUrlIndex = 0;
...
    @Override
    public void pause() {
        //TODO: Pause the media player

        for (AnypointAdPlayerCallback callback : callbacks) {
            callback.onPause(mediaUrls.get(currentMediaUrlIndex));
        }
    }
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    private val callbacks: MutableList<AnypointAdPlayerCallback> = mutableListOf()
    private val mediaUrls: MutableList<String> = mutableListOf()
    private var currentMediaUrlIndex = 0
...
      override fun pause() {
        //TODO: Pause the media player

        callbacks.forEach { it.onPause(mediaUrls[currentMediaUrlIndex])}
    }
...
}
```

### resume
일시 정지된 광고를 재개합니다. `AnypointAdPlayerCallback`에 등록된 모든 객체에 대해 현재 재생 중인 mediaUrl의 정보와 함께 `onResume(String mediaUrl)`를 호출해야 합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    private final ArrayList<AnypointAdPlayerCallback> callbacks = new ArrayList<>();
    private final ArrayList<String> mediaUrls = new ArrayList<>();
    private int currentMediaUrlIndex = 0;
...
	public void resume() {
		//TODO: Resume the media player

		for (AnypointAdPlayerCallback callback : callbacks) {
            callback.onResume(mediaUrls.get(currentMediaUrlIndex));
        }
	}
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    private val callbacks: MutableList<AnypointAdPlayerCallback> = mutableListOf()
    private val mediaUrls: MutableList<String> = mutableListOf()
    private var currentMediaUrlIndex = 0
...
    override fun resume() {
        //TODO: Resume the media player

        callbacks.forEach { it.onResume(mediaUrls[currentMediaUrlIndex]) }
    }
...
}
```

### stop
재생 중인 광고를 완전히 중지합니다. 중지된 직후에는 `AnypointAdPlayerCallback`에 등록된 모든 객체에 대해 `onStopped()`를 호출해야 합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    private final ArrayList<AnypointAdPlayerCallback> callbacks = new ArrayList<>();
...
	public void stop() {
		// TODO: Stop the media player

		for (AnypointAdPlayerCallback callback : callbacks) {
            callback.onStopped();
        }
	}
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    private val callbacks: MutableList<AnypointAdPlayerCallback> = mutableListOf()
...
    override fun stop() {
		// TODO: Stop the media player

        callbacks.forEach { it.onStopped() }
    }
...
}
```

### release
생성된 광고 플레이어의 모든 리소스를 해제합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
	public void release() {
		// TODO: Release the media player
	}
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    override fun release() {
		// TODO: Release the media player
    }
...
}
```

### getProgress
광고의 현재 재생 상태를 반환합니다. 총 재생 시간과 현재까지 재생된 시간을 반환해야 합니다. 재생 준비가 완료되지 않은 경우 `AdProgress.NOT_READY`를 반환해야 합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    @Override
	public AdProgress getProgress() {
		if (isAdPlaying()) {
			// Current PlaySet's playtime, total duration of PlaySet, current playback position within the playing media
			return AdProgress(adPlayTime, adTotalDuration, currentAdPlayTime);
		} else {
			return AdProgress.NOT_READY;
		}
	}
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    override fun getProgress(): AdProgress {
        return if (isAdPlaying) {
			// Current PlaySet's playtime, total duration of PlaySet, current playback position within the playing media
            AdProgress(adPlayTime, adTotalDuration, currentAdPlayTime)
        } else {
            AdProgress.NOT_READY
        }
    }
  ...
}
```

### skipAd
현재 재생 중인 광고를 스킵합니다. 다음 광고가 재생되면 `true`를 반환하고, 다음 광고가 없다면 `false`를 반환합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    @Override
    public boolean skipAd(long skipDurationMs) {
        //TODO: Play the next mediaUrls video in the media player
        // If the next ad is played, return true
        // Otherwise, return false
    }
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    override fun skipAd(skipDurationMs: Long): Boolean {
        //TODO: Play the next mediaUrls video in the media player
        // If the next ad is played, return true
        // Otherwise, return false
    }
...
}
```

### mute
광고 플레이어의 오디오를 음소거합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    private float previousVolume = 1f;

    @Override
    public void mute() {
        //TODO: Save current volume and mute the media player
        previousVolume = getVolume();
        player.setVolume(0f);
    }
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    private var previousVolume = 1f

    override fun mute() {
        //TODO: Save current volume and mute the media player
        previousVolume = getVolume()
        player.setVolume(0f)
    }
...
}
```

### unmute
광고 플레이어의 오디오를 이전 볼륨으로 복원합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    @Override
    public void unmute() {
        //TODO: Restore the media player to previous volume
        player.setVolume(previousVolume);
    }
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    override fun unmute() {
        //TODO: Restore the media player to previous volume
        player.setVolume(previousVolume)
    }
...
}
```

### setVolume
광고 플레이어의 볼륨을 설정합니다. 볼륨 값은 0.0에서 1.0 사이입니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    @Override
    public void setVolume(float volume) {
        //TODO: Set the media player volume
        player.setVolume(volume);
    }
...
}
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    override fun setVolume(volume: Float) {
        //TODO: Set the media player volume
        player.setVolume(volume)
    }
...
}
```

## 커스텀 광고 플레이어를 적용하는 방법
코드 예시는 다음과 같습니다.

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
  // TODO: Implement the interface of AnypointAdPlayer
}

...

// Register your custom player to the AnypointAdView.
AnypointAdView adView = (AnypointAdView) findViewById(R.id.adPlayerView);
CustomAdPlayer customAdPlayer = new CustomAdPlayer();
adView.setAdPlayer(customAdPlayer);
```

**_Kotlin_**

```kotlin
class CustomAdPlayer : AnypointAdPlayer {
    // TODO: Implement the interface of AnypointAdPlayer
}

...

// Register your custom player to the AnypointAdView.
val adView = findViewById<AnypointAdView>(R.id.adPlayerView)
val customAdPlayer = CustomAdPlayer()
adView.setAdPlayer(customAdPlayer)
```
