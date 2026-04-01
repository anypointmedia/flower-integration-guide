---
sidebar_position: 1
---

# 초기화 및 해제

SDK를 사용하려면 TV 앱 시작과 동시에 SDK 초기화 함수를 호출해야 합니다. 

코드 예시는 다음과 같습니다.

**_Java_**

```java
import tv.anypoint.api.AnypointSdk;
import tv.anypoint.api.ui.app.FlowerUIAppSdk; // ad-ui를 사용할 경우 추가

public class YourApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        // DebugMode 설정(기본값은 true)
        AnypointSdk.setDebugMode(false);
        // OPTIONAL: ad-ui 를 사용한다면, TV앱의 패키지명을 넣어준다.
        FlowerUIAppSdk.setTvAppPackageName("com.yourapp.tv");
        // Application 클래스의 최초 시작 시에 초기화
        AnypointSdk.initialize(getApplicationContext());
        // 초기화 여부 확인
        boolean isInitialized = AnypointSdk.isInitialized();
        if (!isInitialized) {
          // TODO: 초기화 실패시 해야할일
        }
    }

    @Override
    public void onTerminate() {
        super.onTerminate();

        // SDK 해제
        AnypointSdk.destroy();
    }
}
```

**_Kotlin_**

```kotlin
import tv.anypoint.api.AnypointSdk
import tv.anypoint.api.ui.app.FlowerUIAppSdk // ad-ui를 사용할 경우 추가

class YourApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // DebugMode 설정(기본값은 true)
        AnypointSdk.setDebugMode(false)
        // OPTIONAL: ad-ui 를 사용한다면, TV앱의 패키지명을 넣어준다.
        FlowerUIAppSdk.setTvAppPackageName("com.yourapp.tv")
        // Application 클래스의 최초 시작 시에 초기화
        AnypointSdk.initialize(applicationContext)
        // 초기화 여부 확인
        val isInitialized = AnypointSdk.isInitialized()
        if (!isInitialized) {
          // TODO: 초기화 실패시 해야할일
        }
    }

    override fun onTerminate() {
        super.onTerminate()

        // SDK 해제
        AnypointSdk.destroy()
    }
}
```
