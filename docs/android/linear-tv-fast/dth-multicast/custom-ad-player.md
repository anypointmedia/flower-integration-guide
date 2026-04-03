---
sidebar_position: 2
---

# Custom Ad Player

While the easiest way to integrate the SDK and manage ads is to delegate all control to the SDK, this section explains how to control ad playback using your TV app's existing video player.

This method is useful if you have limited hardware resources or want to provide a customized user experience.

To do this, inherit the `AnypointAdPlayer` interface provided by the SDK, implement its methods, and register it with `AnypointAdView`.

However, ensure the ad layer is placed below the `AnypointAdView` layer that is responsible for the ad UI and user interaction handling.

## Implementing the AnypointAdPlayer Interface
### addCallback
This function registers an object to receive callbacks based on the ad player's status. You must implement this function to handle multiple callback objects. 

Because this callback mechanism is crucial to the SDK's internal operation, ensure these callbacks are called at the correct times.

Below are code examples:

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
This function removes registered callback objects. Only the callback object matching the passed object must be removed.

Below are code examples:

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
This function passes a list of ads to play and the total playback time. When called, it initiates the prepare function of a standard media player. Finally, `onLoaded(String mediaUrl)` must be called for all objects registered with `AnypointAdPlayerCallback`. The `mediaUrl` parameter of `onLoaded` must be the first media URL in the `playSet`. If playing multiple files, call `onLoaded` only when the first file has loaded.

Below are code examples:

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
		mediaUrls.addAll(playSet.toMediaUrls());
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
This function plays the media resource loaded through the `prepare` function. If playing multiple files, play the ad list passed to the `load` function sequentially. Call `onPlay(String mediaUrl)` for all objects registered with `AnypointAdPlayerCallback`, only when the first `mediaUrl` starts playing.

The last MediaUnit must be played only for the duration specified by `PlaySet.getEndingDurationUs`, not its actual length.

Below are the examples:

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
This function adds a new playlist to the end of the current playlist.

Below are code examples:

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
This function returns the URL of the currently playing media.

Below are code examples:

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
This function returns the sequence number of the currently playing media unit.

Below are code examples:

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
This function returns the volume of the currently playing media player. The volume value is between 0.0 and 1.0.

Below are code examples:

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
This function returns a boolean value indicating whether an ad is currently playing.

Below are code examples:

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
This function pauses ad playback. When an ad is paused, call `onPause(String mediaUrl)` for all objects registered with `AnypointAdPlayerCallback`. The `mediaUrl` parameter of `onPause` must be the URL of the paused media.

Below are code examples:

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
This function resumes a paused ad. When an ad resumes, call `onResume(String mediaUrl)` for all objects registered with `AnypointAdPlayerCallback`. The `mediaUrl` parameter of `onResume` must be the URL of the resumed media.

Below are code examples:

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
This function stops ad playback. Immediately after an ad stops, call `onStopped()` for all objects registered with `AnypointAdPlayerCallback`.

Below are code examples:

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
This function releases all resources held by the ad player.

Below are code examples:

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
This function returns the ad playback progress, including the current playtime, total duration, and current playback position within the playing media. If not ready to play, it must return `AdProgress.NOT_READY`.

Below are code examples:

**_Java_**

```java
class CustomAdPlayer implements AnypointAdPlayer {
    @Override
	public AdProgress getProgress() {
		if (isAdPlaying()) {
			// Current PlaySet's playtime, total duration of PlaySet, current playback position within the playing media
			return new AdProgress(adPlayTime, adTotalDuration, currentAdPlayTime);
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
This function skips the currently playing ad by the specified duration. It returns `true` if another ad starts playing and `false` if there are no more ads to play.

Below are code examples:

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
This function mutes the ad player audio.

Below are code examples:

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
This function restores the ad player audio to its previous volume.

Below are code examples:

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
This function sets the ad player volume. The volume value is between 0.0 and 1.0.

Below are code examples:

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

## Applying a Custom Ad Player
Below are code examples:

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
