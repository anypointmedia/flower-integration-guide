---
sidebar_position: 2
---

# Initialization and Release

Before using any features of the SDK, you must initialize it in your OTT app's startup process. Set the operating environment mode to either _local_, _dev_, or _prod_ as described below.
*   **_local_:** This mode can be used in a local environment and the default log level is _Verbose_.
*   **_dev_:** This mode can be used in a development environment and in this mode, the error log that is generated in the SDK is saved in the server. The default log level is _Info_.
*   **_prod_:** This mode can be used in a commercial environment and in this mode, the error log that is generated in the SDK is saved in the server. The default log level _Warn_.

To ensure proper resource management and avoid potential memory leaks, always call the SDK release function when your OTT app terminates.

**_Java_**

```java
public class YourApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        // TODO GUIDE: initialize SDK
        FlowerSdk.setEnv("local");
        FlowerSdk.init(this);
    }

    @Override
    public void onTerminate() {
        super.onTerminate();

        // TODO GUIDE: release SDK
        FlowerSdk.destroy();
    }
}
```

**_Kotlin_**

```kotlin
class YourApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // TODO GUIDE: initialize SDK
        FlowerSdk.setEnv("local")
        FlowerSdk.init(this)
    }

    override fun onTerminate() {
        super.onTerminate()

        // TODO GUIDE: release SDK
        FlowerSdk.destroy()
    }
}
```

<details>
<summary><strong>Deactivate Ad Skip Feature</strong></summary>

If you are using an ad serving system other than Flower with the Flower SDK, ad skipping might malfunction. In such cases, you need to call the API to deactivate the FLOWER SDK's ad skip feature as follows.

**_Java_**

```java
public class YourApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        // ...

        // TODO GUIDE: Disable ad skip function
        FlowerSdk.ignoreSkip();
    }
}
```

**_Kotlin_**

```kotlin
class YourApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // ...

        // TODO GUIDE: Disable ad skip function
        FlowerSdk.ignoreSkip()
    }
}
```

</details>
