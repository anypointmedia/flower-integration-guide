---
sidebar_position: 1
---

# Step 1: 프로젝트 설정 및 SDK 초기화

이 프롬프트는 LLM이 STB(셋톱박스) 환경에서 Flower Linear TV SDK 의존성과 초기화를 설정하도록 안내합니다.

**사용 전:** `{{SDK_VERSION}}`을 교체하고 의존성 경로를 선택하세요.

```plain
We are integrating the FLOWER Linear TV SDK into our Android STB project.

========================================
STEP 1 — Add Dependencies (build.gradle)
========================================

First, add the AnypointMedia Maven repository:

repositories {
    maven { url "https://maven.anypoint.tv/repository/public-release/" }
}

Then choose ONE dependency path based on your ad player strategy:

Path 1: Google IMA + Built-in ExoPlayer (recommended)
  implementation "tv.anypoint:sdk-multicast-ima:{{SDK_VERSION}}"
  implementation "tv.anypoint:sdk-multicast-exoplayer:{{SDK_VERSION}}"

Path 2: Built-in ExoPlayer only (no Google Ads)
  implementation "tv.anypoint:sdk-multicast-exoplayer:{{SDK_VERSION}}"

Path 3: Custom ad player (minimal SDK)
  implementation "tv.anypoint:sdk-multicast:{{SDK_VERSION}}"

========================================
STEP 2 — ProGuard Configuration
========================================

Add to proguard-rules.pro:
  -keep class tv.anypoint.sdk.comm.** { *; }

========================================
STEP 3 — AndroidManifest.xml (SDK < 2.0.7)
========================================

If using SDK version below 2.0.7, add:
  <queries>
      <package android:name="tv.anypoint.flower.app"/>
  </queries>

========================================
STEP 4 — Initialize and Release SDK
========================================

In your Application class:

Java:
public class YourApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        AnypointSdk.setDebugMode(false);  // Optional: enable debug logging
        AnypointSdk.initialize(getApplicationContext());
    }

    @Override
    public void onTerminate() {
        super.onTerminate();
        AnypointSdk.destroy();
    }
}

Kotlin:
class YourApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        AnypointSdk.setDebugMode(false) // Optional: enable debug logging
        AnypointSdk.initialize(applicationContext)
    }

    override fun onTerminate() {
        super.onTerminate()
        AnypointSdk.destroy()
    }
}

========================================
STEP 5 — Send Initial TV Event
========================================

After SDK initialization, publish the initial channel event:

Java:
TvEventPublisher tvEventPublisher = AnypointSdk.createTvEventPublisher();
tvEventPublisher.publish(TvEvent.CHANNEL_CHANGE, initialServiceId);

Kotlin:
val tvEventPublisher = AnypointSdk.createTvEventPublisher()
tvEventPublisher.publish(TvEvent.CHANNEL_CHANGE, initialServiceId)

This tells the SDK which channel the viewer is watching so it can serve appropriate ads.

========================================
CONSTRAINTS
========================================

- Linear TV SDK uses AnypointSdk (not FlowerSdk) for initialization.
- Always send initial CHANNEL_CHANGE event after SDK init.
- The SDK is designed for STB environments (Android TV, set-top boxes).
- Choose only ONE dependency path — do not mix.
```
