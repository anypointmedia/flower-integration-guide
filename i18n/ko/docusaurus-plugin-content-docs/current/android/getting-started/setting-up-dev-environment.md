---
sidebar_position: 1
---

# 개발 환경 설정

:::tip LLM 프롬프트 제공
LLM 기반 SDK 정합을 위해서는 [Android 프롬프트 섹션](../prompts/vod/how-to-use-prompts.md)을 참고하세요. 단계별 프롬프트와 통합 프롬프트를 사용할 수 있습니다.
:::

## Dependency 설정
FLOWER SDK를 Android 프로젝트에서 사용하려면 AnypointMedia의 Maven repository를 통해 Gradle dependencies에 라이브러리를 추가합니다.

```plain
repositories {
   maven(url = "https://maven.anypoint.tv/repository/public-release")
}

...

dependencies {
    implementation("flower-sdk:sdk-android-ott:X.X.X")
}
```

## Android Cleartext Traffic 예외 설정
FLOWER SDK를 사용할 때, SDK가 HTTP를 통해 올바르게 통신하려면 특정 도메인을 cleartext traffic 예외로 설정해야 합니다.
Android 9(API 레벨 28)부터 cleartext(HTTP) 트래픽이 기본적으로 차단됩니다.

아래 두 가지 방법 중 하나를 선택할 수 있습니다:
1. Network Security Config를 사용하여 특정 도메인에 대해서만 cleartext traffic 허용 (권장)
2. usesCleartextTraffic="true"를 사용하여 전체 cleartext traffic 허용

### 방법 1 (권장) — 특정 도메인만 허용

#### 1. Network Security Config 파일 생성

다음 파일을 생성합니다:

```plain
app/src/main/res/xml/network_security_config.xml
```

#### 2. 다음 설정 추가

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
→ 이 도메인에 대해서만 HTTP 트래픽을 허용합니다.

includeSubdomains="true"
→ 모든 하위 도메인도 허용합니다(필요 없는 경우 false로 설정).

### 3. AndroidManifest.xml에 적용

<application> 태그 안에 다음을 추가합니다:

```xml
<application
    android:name=".MyApplication"
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="false"
    ... >
```

이 방법은 지정된 도메인에만 HTTP 접근을 허용하므로 더 안전합니다.

### 방법 2 — 전체 Cleartext Traffic 허용 (권장하지 않음)

다음과 같이 설정하면 모든 도메인에 대해 HTTP를 허용할 수 있습니다:

```xml
<application
    android:name=".MyApplication"
    android:usesCleartextTraffic="true"
    ... >
```

주의 사항
*   모든 도메인에 대해 HTTP 트래픽이 허용됩니다.
*   이 경우 Network Security Config는 필요하지 않습니다.
*   보안 위험으로 인해 프로덕션 환경에서는 권장하지 않습니다.

### (참고) Android 버전별 동작

| Android 버전 | 동작 |
| ---| --- |
| API 28+ (Android 9+) | HTTP가 기본적으로 차단됨 |
| API 27 이하 | HTTP가 기본적으로 허용됨 |
