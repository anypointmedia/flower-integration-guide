---
sidebar_position: 6
---

# Receiving Ad Events

The SDK receives ad events from the ad agent and passes them to the `AdsManagerListener`.

## Events that can be received from the `AdsManagerListener`
### onPrepare (adCount: Int, retainChannelStream: Boolean)
When the SDK receives information about the ads to play from the ad agent, it passes the ad count and whether to retain the channel stream as parameters to the `onPrepare` listener function. If the `adCount` is 0, the SDK does nothing because there are no ads to play.

This function returns a boolean value indicating whether it was successful. If the implementation cannot play ads, it returns `false`, and it does not play ads even if they are available.

If `false` is returned, the SDK sends the error code `ERROR_CODE_ON_RESPONSE_FAILED (-900)` to the ad agent.

For digital cues, the `retainChannelStream` value is always passed as `true`. The same value is also passed to the `onPlay`, `prepareStop`, `onStopped`, and `onError` events that follow.

### onPlay (retainChannelStream: Boolean)
This function is called just before an ad is played after an analog or digital cue is received. The TV app must pause or mute the channel stream when this event is received to ensure a smooth viewing experience.

### onPause ()
This function is called when a currently playing ad is paused. This event is not used for linear broadcasts.

### onResume ()
This function is called when a paused ad resumes playback. This event is not used for linear broadcasts.

### prepareStop (retainChannelStream: Boolean)
This function notifies you two seconds before the end of ad playback. You can use this function to prepare for a smooth transition back to the linear broadcast stream.

### onStopped (retainChannelStream: Boolean)
This function is called when ad playback ends. Ad playback can end for the following reasons:
*   All ads have finished playing.
*   An error occurred during ad playback.
*   A replaced ad-end event is received via an analog or digital cue.

### onError (t: Throwable, retainChannelStream: Boolean)
This function is called when an error occurs during ad playback. The `onStopped` event is also called at the same time. Use this event only when you need to implement separate error handling.

## Code Examples
*   How to register an `AdsManagerListener` with an `AnypointAdView` instance

**_Java_**

```java
...
AnypointAdView adView = (AnypointAdView)findViewById(R.id.linearTvAdView);
AnypointAdsManager adsManager = adView.getAnypointAdsManager();
AdsManagerListener adsManagerListener = new AdsManagerListenerImpl(); // Inherit and implement AdsManagerListener interface
adsManager.addListener(adsManagerListener); // Multiple registrations are possible, and events are delivered to all listeners in the order of registration.
// After this, events can be received. 
...
```

**_Kotlin_**

```kotlin
...
val adView = findViewById<AnypointAdView>(R.id.linearTvAdView)
val adsManager = adView.anypointAdsManager
val adsManagerListener = AdsManagerListenerImpl() // Implements the AdsManagerListener interface
adsManager.addListener(adsManagerListener) // Multiple registrations are possible, and events are delivered to all listeners in the order of registration.
// After this, events can be received.
...
```

*   How to remove an `AdsManagerListener` from an `AnypointAdView` instance

**_Java_**

```java
...
adsManager.removeListener(adsManagerListener);
// Events cannot be received after this.
...
```

**_Kotlin_**

```kotlin
...
adsManager.removeListener(adsManagerListener)
// Events cannot be received after this.
...
```

*   Event handling for simultaneous media and ad playback (Dual Player Mode)

**_Java_**

```java
class AdsManagerListenerImpl implements AdsManagerListener {
	private MediaPlayer channelPlayer;
	public AdsManagerListenerImpl(MediaPlayer channelPlayer) {
		this.channelPlayer = channelPlayer;
	}
	public void onPlay(boolean retainChannelStream) {
		channelPlayer.setVolume(0, 0);
	}
	public void onStopped(boolean retainChannelStream) {
		channelPlayer.setVolume(1, 1);
	}
}
```

**_Kotlin_**

```kotlin
class AdsManagerListenerImpl(private val channelPlayer: MediaPlayer) 
  : AdsManagerListener {
	 override fun onPlay(retainChannelStream: Boolean) {
        channelPlayer.setVolume(0f, 0f)
    }

    override fun onStopped(retainChannelStream: Boolean) {
        channelPlayer.setVolume(1f, 1f)
    }
}
```

*   Event handling when media playback is stopped and ad playback is used (Single Player Mode)

**_Java_**

```java
class AdsManagerListenerImpl implements AdsManagerListener {
	private MediaPlayer channelPlayer;
	public AdsManagerListenerImpl(MediaPlayer channelPlayer) {
		this.channelPlayer = channelPlayer;
	}
	public void onPlay(boolean retainChannelStream) {
		channelPlayer.pause();
	}
	public void prepareStop(boolean retainChannelStream) {
		channelPlayer.prepare();
	}
	public void onStopped(boolean retainChannelStream) {
		channelPlayer.start();
	}
}
```

**_Kotlin_**

```kotlin
class AdsManagerListenerImpl(private val channelPlayer: MediaPlayer) 
  : AdsManagerListener {
	 override fun onPlay(retainChannelStream: Boolean) {
        channelPlayer.pause()
    }

    override fun prepareStop(retainChannelStream: Boolean) {
        channelPlayer.prepare()
    }

    override fun onStopped(retainChannelStream: Boolean) {
        channelPlayer.start()
    }
}
```
