---
sidebar_position: 2
---

# 프로젝트 설정

## build.gradle
```groovy
repositories {
	maven {
		url "https://maven.anypoint.tv/repository/public-release/"
	}
}
def sdkVersion = "X.X.X" // Replace with the SDK version provided to your project
dependencies {
    // 구글 광고를 사용할 경우 설정
	implementation "tv.anypoint:sdk-multicast-ima:$sdkVersion"
    // SDK 내장 광고 플레이어를 사용할 경우 설정
	implementation "tv.anypoint:sdk-multicast-exoplayer:$sdkVersion"
    // 구글 광고와 SDK 내장 플레이어를 모두 사용하지 않고,
    // 멀티캐스트 SDK만 사용할 경우 설정
    implementation "tv.anypoint:sdk-multicast:$sdkVersion"
    // 내장 플레이어와 자체 플레이어를 모두 사용하지 않고,
    // 채널앱과 분리된 별도의 TV앱이 존재하는 경우
    implementation "tv.anypoint:sdk-ad-ui:$sdkVersion"
}
```

*   **ad-ui를 사용하거나 위의 방식으로 수용이 안 되는 경우** [**Helpdesk**](mailto:dev-support@anypointmedia.com)**로 별도 문의**

## [proguard-rules.pro](http://proguard-rules.pro)

```plain
-keep class tv.anypoint.sdk.comm.** { *; }
```

## AndroidManifest.xml
`2.0.7` 미만 버전은 아래 설정을 추가해야 하며, 이보다 높거나 동일한 버전은 아래 설정 생략

Query 설정

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
...
    <!-- Ad Agent의 Package를 등록한다 -->
    <queries>
        <package android:name="tv.anypoint.flower.app"/>
    </queries>
...
</manifest>
```
