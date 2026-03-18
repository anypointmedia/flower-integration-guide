---
sidebar_position: 2
---

# Passing TV Events

In order for the SDK to respond appropriately to the current state of the TV app, the TV app must inform the SDK whenever its state changes. This includes events such as changing channels or exiting the app, which allows the SDK to respond appropriately.

## Passing Initial TV Events
Once your TV app is up and running, you need to pass the SDK an event that matches the initial state of one of the predefined TV events.

**_Java_**

```java
public class YourApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        // SDK Initialization
        // TODO: Your SDK initialize code here
        
        int sid = ... // sid of the initial channel
        TvEventPublisher tvEventPublisher = AnypointSdk.createTvEventPublisher();
        tvEventPublisher.publish(TvEvent.CHANNEL_CHANGE, sid);
    }
}
```

**_Kotlin_**

```kotlin
class YourApplication : Application() {
    override fun onCreate() {
      super.onCreate()
      // SDK Initialization
      // TODO: Your SDK initialize code here
      
      var sid = ... // sid of the initial channel
      val tvEventPublisher = AnypointSdk.createTvEventPublisher()
      tvEventPublisher.publish(TvEvent.CHANNEL_CHANGE, sid)
    }
}
```

## Predefined TV Events
Predefined TV events include:

### _CHANNEL\_CHANGE_
Indicates that a viewer has switched to another TV channel while watching linear TV.

**The first time it enters a linear TV channel, you must send the current channel ID.**

### _VOD\_START_
Indicates that VOD viewing has started. If you cannot confirm the VOD title, you can use the `MISC`event instead.

**Passing the accurate VOD title enhances advanced targeting effects, which helps increase the price of ads.**

### _APP\_START_
Indicates that another app has started on the device. If you cannot confirm the app package name, you can use the `MISC` event instead.

**Passing the accurate app package name enhances advanced targeting effects, which helps increase the price of ads.**

### _SLEEP\_MODE\_START_
Indicates the device has entered the standby mode.

### _MISC_
All other situations where ad creatives should not be played. The `MISC` event **includes** all events, except when the parameter of `CHANNEL_CHANGE` is the service ID of the current channel.

**_Java_**

```java
import tv.anypoint.sdk.comm.TvEvent
import tv.anypoint.api.tv.TvEventPublisher

// Create a TV Event Publisher
TvEventPublisher tvEventPublisher = AnypointSdk.createTvEventPublisher();
// Channel change while watching linear channel
int sid = ... // Changed channel's service id, at the first time it enters a linear channel, the current channel's service id
tvEventPublisher.publish(TvEvent.CHANNEL_CHANGE, sid);
// When entering VOD, deliver the state with the VOD title
tvEventPublisher.publish(TvEvent.VOD_START, "Frozen 2");
// When running an app, deliver the state with the app ID
tvEventPublisher.publish(TvEvent.APP_START, "com.google.android.youtube");
// When entering sleep mode
tvEventPublisher.publish(TvEvent.SLEEP_MODE_START);
// Deliver when ad creatives should not be played
tvEventPublisher.publish(TvEvent.MISC);
```

**_Kotlin_**

```kotlin
import tv.anypoint.sdk.comm.TvEvent
import tv.anypoint.api.tv.TvEventPublisher

// Create a TV Event Publisher
val tvEventPublisher = AnypointSdk.createTvEventPublisher()
// Channel change while watching linear channel
var sid = ... // Changed channel's service id, at the first time it enters a linear channel, the current channel's service id
tvEventPublisher.publish(TvEvent.CHANNEL_CHANGE, sid)
// When entering VOD, deliver the state with the VOD title
tvEventPublisher.publish(TvEvent.VOD_START, "Frozen 2")
// When running an app, deliver the state with the app ID
tvEventPublisher.publish(TvEvent.APP_START, "com.google.android.youtube")
// When entering sleep mode
tvEventPublisher.publish(TvEvent.SLEEP_MODE_START)
// Deliver when ad creatives should not be played
tvEventPublisher.publish(TvEvent.MISC)
```
