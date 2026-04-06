---
sidebar_position: 7
---

# Receiving Submodule Lifecycle Events

If you need to receive events based on the lifecycle of each submodule, you can implement `SdkModuleLifecycleListener`. The available submodules are as follows:
*   multicast`(sdk-multicast)`
*   ima`(sdk-multicast-ima)`
*   player`(sdk-multicast-exoplayer)`
*   ad-ui `(sdk-ad-ui)`

Code examples are as follows:

**_Java_**

```java
public class YourApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        // SDK Initialization
        // TODO: Your SDK initialize code here
        
        AnypointSdk.addModuleLifecycleListener(new SdkModuleLifecycleListener() {
          @Override
          public void initialized(String module) {
            if (module.equals("multicast")) {
              // Perform necessary operations here
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
      // SDK Initialization
      // TODO: Your SDK initialize code here
        
      AnypointSdk.addModuleLifecycleListener { module ->
        if (module == "multicast") {
          // Perform necessary operations here
        }
      }
    }
}
```
