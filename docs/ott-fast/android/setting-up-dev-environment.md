---
sidebar_position: 1
---

# Setting up Development Environment

## Prompt for Coding Agent

**Important:**
Before running the prompt below, replace X.X.X with the actual FLOWER SDK version provided to your project.

```plain
We are integrating the FLOWER SDK into our Android project.

========================================
STEP 1 — Add FLOWER SDK Dependency
========================================

Use AnypointMedia's Maven repository:

Repository URL:
https://maven.anypoint.tv/repository/public

Support both Kotlin DSL and Groovy DSL.

--------------------------------------------------
If using Kotlin DSL (AGP 8+ preferred in settings.gradle.kts):

dependencyResolutionManagement {
    repositories {
        maven("https://maven.anypoint.tv/repository/public")
    }
}

dependencies {
    implementation("flower-sdk:sdk-android-ott:X.X.X")
}

--------------------------------------------------
If using Groovy DSL:

repositories {
    maven { url "https://maven.anypoint.tv/repository/public" }
}

dependencies {
    implementation "flower-sdk:sdk-android-ott:X.X.X"
}

Replace X.X.X with the appropriate SDK version.

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

----------------------------------------
CONSTRAINTS
----------------------------------------

- Do NOT enable global cleartext traffic.
- Do NOT remove existing domain configurations.
- Do NOT overwrite unrelated security rules.
- Keep the implementation minimal and production-safe.
- Maintain compatibility with modern Android Gradle Plugin versions.
```

## Dependency Setting
To use the FLOWER SDK in your Android project, add the library to Gradle dependencies through AnypointMedia's Maven repository.

```plain
repositories {
   maven(url = "https://maven.anypoint.tv/repository/public")
}

...

dependencies {
    implementation("flower-sdk:sdk-android-ott:X.X.X")
}
```

## Android Cleartext Traffic Exception Configuration
When using the FLOWER SDK, a specific domain must be configured as a cleartext traffic exception in order for the SDK to communicate properly over HTTP.
Starting from Android 9 (API level 28), cleartext (HTTP) traffic is blocked by default.

You can choose one of the two methods below:
1. Allow cleartext traffic for a specific domain using Network Security Config (Recommended)
2. Enable cleartext traffic globally using usesCleartextTraffic="true"

### Method 1 (Recommended) — Allow Only a Specific Domain

#### 1. Create Network Security Config File

Create the following file:

```plain
app/src/main/res/xml/network_security_config.xml
```

#### 2. Add the Following Configuration

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">
            prod-reds-device-ad-distributor.ap-northeast-2.elasticbeanstalk.com
        </domain>
    </domain-config>
</network-security-config>
```

cleartextTrafficPermitted="true"
→ Allows HTTP traffic only for this domain.

includeSubdomains="true"
→ Also allows all subdomains (set to false if not needed).

### 3. Apply It in AndroidManifest.xml

Add the following inside the <application> tag:

```xml
<application
    android:name=".MyApplication"
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="false"
    ... >
```

This approach limits HTTP access to the specified domain only and is more secure.

### Method 2 — Allow Cleartext Traffic Globally (Not Recommended)

You can enable HTTP for all domains by setting:

```xml
<application
    android:name=".MyApplication"
    android:usesCleartextTraffic="true"
    ... >
```

Important Notes
*   This allows HTTP traffic for all domains.
*   In this case, Network Security Config is not required.
*   This approach is not recommended for production environments due to security risks.

### (Reference) Android Version Behavior

| Android Version | Behavior |
| ---| --- |
| API 28+ (Android 9+) | HTTP blocked by default |
| API 27 and below | HTTP allowed by default |
