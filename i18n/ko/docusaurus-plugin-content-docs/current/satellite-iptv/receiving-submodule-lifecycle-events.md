---
sidebar_position: 7
---

# 서브 모듈 라이프사이클 이벤트 수신

각 서브 모듈의 라이프사이클에 따른 이벤트를 수신해야 하는 경우 `SdkModuleLifecycleListener`를 구현하면 됩니다. 사용 가능한 서브 모듈은 아래와 같습니다.
*   multicast (`sdk-multicast`)
*   ima (`sdk-multicast-ima`)
*   player (`sdk-multicast-exoplayer`)
*   ad-ui (`sdk-ad-ui`)

코드 예시는 다음과 같습니다.

**_Java_**

```java
public class YourApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        // SDK 초기화
        // TODO: Your SDK initialize code here

        AnypointSdk.addModuleLifecycleListener(new SdkModuleLifecycleListener() {
          @Override
          public void initialized(String module) {
            if (module.equals("multicast")) {
              // 여기에서 필요한 작업 수행
            }
          }
        });
    }
}

```

**_Kotlin_**

```kotlin
class YourApplication : Application() {
    override fun onCreate() {
      super.onCreate()
      // SDK 초기화
      // TODO: Your SDK initialize code here

      AnypointSdk.addModuleLifecycleListener { module ->
        if (module == "multicast") {
          // 여기에서 필요한 작업 수행
        }
      }
    }
}
```
