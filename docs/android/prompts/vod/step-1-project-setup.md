---
sidebar_position: 1
---

# Step 1: Project Setup & SDK Initialization

This prompt guides LLM to set up Flower SDK dependencies and initialization in an Android project.

**Before using:** Replace `{{SDK_VERSION}}` with the actual SDK version provided to your project.

```plain
We are integrating the FLOWER SDK into our Android project.

========================================
STEP 1 — Add FLOWER SDK Dependency
========================================

Use AnypointMedia's Maven repository:

Repository URL:
https://maven.anypoint.tv/repository/public-release

Support both Kotlin DSL and Groovy DSL.

--------------------------------------------------
If using Kotlin DSL (AGP 8+ preferred in settings.gradle.kts):

dependencyResolutionManagement {
    repositories {
        maven("https://maven.anypoint.tv/repository/public-release")
    }
}

dependencies {
    implementation("flower-sdk:sdk-android-ott:{{SDK_VERSION}}")

    // Add ONLY if the project uses FlowerMedia3ExoPlayer.
    // Supported androidx.media3 versions: 1.2.1 and above.
    // The companion artifact depends on sdk-android-ott, so add both together.
    // Pick the artifact whose version exactly matches the app's androidx.media3 version (>= 1.2.1):
    //   androidx.media3 1.10.1 -> sdk-android-ott-media3-1.10.1
    // For androidx.media3 versions below 1.2.1, contact dev-support@anypointmedia.com.
    // implementation("flower-sdk:sdk-android-ott-media3-1.10.1:{{SDK_VERSION}}")
}

--------------------------------------------------
If using Groovy DSL:

repositories {
    maven { url "https://maven.anypoint.tv/repository/public-release" }
}

dependencies {
    implementation "flower-sdk:sdk-android-ott:{{SDK_VERSION}}"

    // Add ONLY if the project uses FlowerMedia3ExoPlayer.
    // Supported androidx.media3 versions: 1.2.1 and above.
    // The companion artifact depends on sdk-android-ott, so add both together.
    // Pick the artifact whose version exactly matches the app's androidx.media3 version (>= 1.2.1):
    //   androidx.media3 1.10.1 -> sdk-android-ott-media3-1.10.1
    // For androidx.media3 versions below 1.2.1, contact dev-support@anypointmedia.com.
    // implementation "flower-sdk:sdk-android-ott-media3-1.10.1:{{SDK_VERSION}}"
}

Replace {{SDK_VERSION}} with the appropriate SDK version.

NOTE on the Media3 companion artifact (sdk-android-ott-media3-*):
- The core sdk-android-ott artifact is always required.
- The sdk-android-ott-media3-* artifact is REQUIRED ONLY when using FlowerMedia3ExoPlayer.
  It depends on sdk-android-ott, so both artifacts must be added together.
- It is NOT needed for FlowerExoPlayer2 (legacy ExoPlayer) or FlowerBitmovinPlayer.
- Supported androidx.media3 versions: 1.2.1 and above.
- Inspect the project's androidx.media3 version (e.g., in libs.versions.toml or
  build.gradle dependencies) and pick the exact same companion artifact version
  for any registered version 1.2.1 or above:
    androidx.media3 1.10.1 -> flower-sdk:sdk-android-ott-media3-1.10.1
- The companion artifact's version is the FLOWER SDK version ({{SDK_VERSION}}),
  not the androidx.media3 version.
- If the project uses an androidx.media3 version not covered above (e.g., below 1.2.1),
  instruct the user to contact dev-support@anypointmedia.com instead of guessing
  an artifact to add.

========================================
STEP 2 — Configure Cleartext Exception (Conditional)
========================================

We must allow cleartext (HTTP) traffic ONLY for:

prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com

----------------------------------------
IMPORTANT LOGIC:
----------------------------------------

1) First, check AndroidManifest.xml:

   - If android:usesCleartextTraffic="true" is already set globally:
       → DO NOT create or modify network_security_config.xml.
       → DO NOT add any domain-specific configuration.
       → Leave existing configuration unchanged.

2) If usesCleartextTraffic is NOT globally true:

   Then check whether a network security config is already defined:

   A) If android:networkSecurityConfig is already present:
        - Locate the referenced XML file.
        - If a <domain-config> exists:
              → Add the domain inside the existing config
                without removing other domains.
        - If no suitable <domain-config> exists:
              → Add a new <domain-config cleartextTrafficPermitted="true">
                block for this domain.
        - Do NOT overwrite unrelated existing security settings.

   B) If no networkSecurityConfig is defined:
        - Create:
          app/src/main/res/xml/network_security_config.xml
        - Add:

<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">
            prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com
        </domain>
    </domain-config>
</network-security-config>

        - Then update AndroidManifest.xml:
            android:networkSecurityConfig="@xml/network_security_config"
            android:usesCleartextTraffic="false"

========================================
STEP 3 — Initialize and Release SDK
========================================

In your Application class, initialize the SDK in onCreate() and release in onTerminate().

IMPORTANT — Required import:
  import tv.anypoint.flower.android.sdk.api.FlowerSdk

Environment modes:
- "local": Local environment, default log level Verbose
- "dev": Development environment, error logs saved to server, default log level Info
- "prod": Production environment, error logs saved to server, default log level Warn

Kotlin:

class YourApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        FlowerSdk.setEnv("local")  // Change to "dev" or "prod" as appropriate
        FlowerSdk.init(this)
    }

    override fun onTerminate() {
        super.onTerminate()
        FlowerSdk.destroy()
    }
}

Java:

public class YourApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        FlowerSdk.setEnv("local");
        FlowerSdk.init(this);
    }

    @Override
    public void onTerminate() {
        super.onTerminate();
        FlowerSdk.destroy();
    }
}

Ensure the Application class is registered in AndroidManifest.xml:

<application android:name=".YourApplication" ...>

----------------------------------------
CONSTRAINTS
----------------------------------------

- Do NOT enable global cleartext traffic unless it is already enabled.
- Do NOT remove existing domain configurations.
- Do NOT overwrite unrelated security rules.
- Keep the implementation minimal and production-safe.
- Maintain compatibility with modern Android Gradle Plugin versions.
```
