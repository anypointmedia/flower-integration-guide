---
sidebar_position: 3
---

# Project Settings

## build.gradle
```groovy
repositories {
	maven {
		url "https://maven.anypoint.tv/repository/public-release/"
	}
}
def sdkVersion = "1.0.0"
dependencies {
    // Set if using Google Ads
	implementation "tv.anypoint:sdk-multicast-ima:$sdkVersion"
    // Set if using SDK built-in ad player
	implementation "tv.anypoint:sdk-multicast-exoplayer:$sdkVersion"
    // Set if not using Google Ads or SDK built-in player,
    // Set if only using multicast SDK
    implementation "tv.anypoint:sdk-multicast:$sdkVersion"
    // Not using built-in player or own player,
    // If there is a separate TV app separated from the channel app
    implementation "tv.anypoint:sdk-ad-ui:$sdkVersion"
}
```

*   **If you use ad-ui or the above method is not acceptable, please contact** [**Helpdesk**](mailto:dev-support@anypointmedia.com)**.**

## [proguard-rules.pro](http://proguard-rules.pro)

```plain
-keep class tv.anypoint.sdk.comm.** { *; }
```

## AndroidManifest.xml
Versions lower than `2.0.7` need to add the settings below, higher or equal versions, skip them.
Query settings

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
...
    <!-- Register the Ad Agent Package -->
    <queries>
        <package android:name="tv.anypoint.flower.app"/>
    </queries>
...
</manifest>
```
