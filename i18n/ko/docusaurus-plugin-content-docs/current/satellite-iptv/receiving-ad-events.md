---
sidebar_position: 6
---

# 광고 이벤트 수신

SDK는 Ad Agent로부터 광고 이벤트를 수신 받아 `AdsManagerListener`에 이벤트를 전달합니다.

## `AdsManagerListener`에서 수신 가능한 이벤트
### onPrepare (adCount: Int, retainChannelStream: Boolean)
SDK는 Ad Agent로부터 재생할 광고 정보를 수신하면 받은 광고 수(adCount) 및 채널 스트림 유지 여부(retainChannelStream)를 `onPrepare` 리스너 함수에 매개변수로 전달합니다. `adCount`가 0이면 재생할 광고가 없으므로 SDK는 아무 동작도 수행하지 않습니다.

이 함수는 성공 여부를 반환하며, 구현체에서 광고를 재생할 수 없는 경우 `false`를 반환하면 수신된 광고가 있더라도 광고를 재생하지 않습니다.

`false`가 반환되면 SDK가 Ad Agent에 `ERROR_CODE_ON_RESPONSE_FAILED (-900)` 오류 코드를 전송합니다.

디지털 큐의 경우 `retainChannelStream` 값이 항상 `true`로 전달됩니다. 이후 진행되는 `onPlay`, `prepareStop`, `onStopped`, `onError` 이벤트에도 해당 값이 동일하게 전달됩니다.

### onPlay (retainChannelStream: Boolean)
아날로그 또는 디지털 큐가 수신된 후 광고가 재생되기 직전에 호출되는 함수입니다. TV 앱은 이 이벤트가 수신될 때 실시간 방송을 중지하거나 음소거 처리하여 원활한 시청 경험을 유지해야 합니다.

### onPause ()
재생 중인 광고가 일시 정지될 때 호출되는 함수입니다. 실시간 방송에서는 이 이벤트가 사용되지 않습니다.

### onResume ()
일시 정지된 광고가 재개될 때 호출되는 함수입니다. 실시간 방송에서는 이 이벤트가 사용되지 않습니다.

### prepareStop (retainChannelStream: Boolean)
광고 재생이 끝나기 2초 전에 미리 알려주는 함수입니다. 실시간 방송을 원활하게 재생하기 위해 준비가 필요한 경우 이 함수 내에 구현하면 됩니다.

### onStopped (retainChannelStream: Boolean)
광고 재생이 끝나는 시점에 호출되는 함수입니다. 다음과 같은 3가지 이유로 광고 재생이 끝날 수 있습니다.
*   모든 광고 재생이 완료된 경우
*   광고 재생 중에 오류가 발생한 경우
*   아날로그 또는 디지털 큐를 통해 대체 광고 종료 이벤트가 수신된 경우

### onError (t: Throwable, retainChannelStream: Boolean)
광고 재생 중에 오류가 발생할 때 호출되는 함수입니다. `onStopped`도 동시에 호출되므로, 별도의 오류 처리가 필요할 때만 이 이벤트를 사용하세요.

## 코드 예시
*   AnypointAdView 인스턴스에 `AdsManagerListener` 등록 방법

**_Java_**

```java
...
AnypointAdView adView = (AnypointAdView)findViewById(R.id.linearTvAdView);
AnypointAdsManager adsManager = adView.getAnypointAdsManager();
AdsManagerListener adsManagerListener = new AdsManagerListenerImpl(); // AdsManagerListener 인터페이스를 상속받아 구현
adsManager.addListener(adsManagerListener); // 여러개 등록 가능하며 모든 Listener에 이벤트 전달, 등록된 순서대로 전달
// 이 후 이벤트 수신 가능
...
```

**_Kotlin_**

```kotlin
...
val adView = findViewById<AnypointAdView>(R.id.linearTvAdView)
val adsManager = adView.anypointAdsManager
val adsManagerListener = AdsManagerListenerImpl() // AdsManagerListener 인터페이스를 상속받아 구현
adsManager.addListener(adsManagerListener) // 여러 개 등록 가능하며 모든 Listener에 이벤트 전달, 등록된 순서대로 전달
// 이 후 이벤트 수신 가능
...
```

*   AnypointAdView 인스턴스에서 `AdsManagerListener` 제거 방법

**_Java_**

```java
...
adsManager.removeListener(adsManagerListener);
// 이 후 이벤트 수신 불가
...
```

**_Kotlin_**

```kotlin
...
adsManager.removeListener(adsManagerListener)
// 이 후 이벤트 수신 불가
...
```

*   미디어 재생과 광고 재생을 동시에 사용하는 경우의 이벤트 처리 (Dual Player Mode)

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

*   미디어 재생을 중지하고 광고 재생을 사용하는 경우의 이벤트 처리 (Single Player Mode)

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
