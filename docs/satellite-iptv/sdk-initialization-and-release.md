---
sidebar_position: 3
---

# SDK Initialization and Release

To use the SDK, you must call the SDK initialization function at the same time the TV app starts. 

The code example is as follows:

**_Java_**

```java
import tv.anypoint.api.AnypointSdk;
import tv.anypoint.api.ui.app.FlowerUIAppSdk; // Add this if using ad-ui

public class YourApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        // DebugMode setting (default value is true)
        AnypointSdk.setDebugMode(false);
        // OPTIONAL: If using ad-ui, put the package name of the TV app.
        FlowerUIAppSdk.setTvAppPackageName("com.yourapp.tv");
        // Initialize at the first start of the Application class
        AnypointSdk.initialize(getApplicationContext());
        // Check initialization status
        boolean isInitialized = AnypointSdk.isInitialized();
        if (!isInitialized) {
          // TODO: What to do if initialization fails
        }
    }
    
    @Override
    public void onTerminate() {
        super.onTerminate();
        
        // Release SDK
        AnypointSdk.destroy();
    }
}
```

**_Kotlin_**

```kotlin
import tv.anypoint.api.AnypointSdk
import tv.anypoint.api.ui.app.FlowerUIAppSdk // Add this if using ad-ui

class YourApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // DebugMode setting (default value is true)
        AnypointSdk.setDebugMode(false)
        // OPTIONAL: If using ad-ui, put the package name of the TV app.
        FlowerUIAppSdk.setTvAppPackageName("com.yourapp.tv")
        // Initialize at the first start of the Application class
        AnypointSdk.initialize(applicationContext)
        // Check initialization status
        val isInitialized = AnypointSdk.isInitialized()
        if (!isInitialized) {
          // TODO: What to do if initialization fails
        }
    }

    override fun onTerminate() {
        super.onTerminate()
        
        // Release SDK
        AnypointSdk.destroy()
    }
}
```
