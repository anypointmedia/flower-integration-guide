---
sidebar_position: 1
---

# Step 1: 프로젝트 설정 및 SDK 초기화

이 프롬프트는 LLM이 Android 프로젝트에서 Flower SDK 의존성과 초기화를 설정하도록 안내합니다.

**사용 전:** `{{SDK_VERSION}}`을 프로젝트에 제공된 실제 SDK 버전으로 교체하세요.

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
}

--------------------------------------------------
If using Groovy DSL:

repositories {
    maven { url "https://maven.anypoint.tv/repository/public-release" }
}

dependencies {
    implementation "flower-sdk:sdk-android-ott:{{SDK_VERSION}}"
}

Replace {{SDK_VERSION}} with the appropriate SDK version.

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
