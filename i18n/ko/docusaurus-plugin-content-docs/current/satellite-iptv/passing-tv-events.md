---
sidebar_position: 8
---

# TV 이벤트 전달

SDK가 TV 앱의 현재 상태에 따라 적절히 대응할 수 있도록 TV 앱은 자신의 상태가 변경될 때마다 해당 상태에 맞는 이벤트를 SDK에 반드시 전달해야 합니다. 예를 들어 개인화 광고 재생 도중에 재생을 중단하는 경우 또는 시청자가 실시간 TV 시청을 종료하는 경우가 여기에 해당합니다.

## 초기 TV 이벤트 전달
TV 앱 구동이 완료되면 사전 정의된 TV 이벤트 중 초기 상태와 일치하는 이벤트를 SDK에 전달해야 합니다.

**_Java_**

```java
public class YourApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        // SDK 초기화
        // TODO: Your SDK initialize code here

        int sid = ... // 초기 채널의 sid
        TvEventPublisher tvEventPublisher = AnypointSdk.createTvEventPublisher();
        tvEventPublisher.publish(TvEvent.CHANNEL_CHANGE, sid);
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

      var sid = ... // 초기 채널의 sid
      val tvEventPublisher = AnypointSdk.createTvEventPublisher()
      tvEventPublisher.publish(TvEvent.CHANNEL_CHANGE, sid)
    }
}
```

## 사전 정의된 TV 이벤트
사전 정의된 TV 이벤트는 다음과 같습니다.

### _CHANNEL\_CHANGE_
실시간 TV 시청 중에 다른 TV 채널로 전환되었음을 의미합니다.

**실시간 채널로 최초 진입 시 현재의 채널 아이디를 함께 전달해야 합니다.** IPTV 환경의 경우 추가 인자로 멀티캐스트 URL을 선택적으로 전달할 수 있습니다.

### _VOD\_START_
VOD 시청이 시작되었음을 의미합니다. VOD 타이틀을 확인하여 전달할 수 없는 경우 `MISC` 이벤트를 대신 사용할 수 있습니다.

**VOD 타이틀을 전달하면 고도화된 광고 타겟팅을 지원하여 광고 단가를 높이는 데 도움이 됩니다.**

### _APP\_START_
디바이스에서 다른 앱이 시작되었음을 의미합니다. 앱 패키지 이름을 확인하여 전달할 수 없는 경우 `MISC` 이벤트를 대신 사용할 수 있습니다.

**앱 패키지 이름을 전달하면 고도화된 광고 타겟팅을 지원하여 광고 단가를 높이는 데 도움이 됩니다.**

### _SLEEP\_MODE\_START_
대기 모드로 전환되었음을 의미합니다.

### _MISC_
광고 소재가 재생되지 않아야 하는 기타 모든 상황을 의미합니다. `CHANNEL_CHANGE`의 파라미터가 현재 채널의 service ID인 경우를 제외하면, `MISC` 이벤트는 모든 이벤트를 **포함**할 수 있습니다.

**_Java_**

```java
import tv.anypoint.sdk.comm.TvEvent;
import tv.anypoint.api.tv.TvEventPublisher;

// TV 이벤트 퍼블리셔 생성
TvEventPublisher tvEventPublisher = AnypointSdk.createTvEventPublisher();
// 실시간 TV 시청 중에 채널 변경
int sid = ... // 변경된 채널의 service id, 최초 TV 이벤트 전달시에는 현재 채널의 sid
tvEventPublisher.publish(TvEvent.CHANNEL_CHANGE, sid);
// VOD 진입시, VOD 제목과 함께 상태 전달
tvEventPublisher.publish(TvEvent.VOD_START, "겨울 왕국 2");
// APP 실행시, 앱 ID 와 함께 상태 전달
tvEventPublisher.publish(TvEvent.APP_START, "com.google.android.youtube");
// 슬립 모드 진입 시
tvEventPublisher.publish(TvEvent.SLEEP_MODE_START);
// 광고 소재가 재생되지 않아야 할때 전달
tvEventPublisher.publish(TvEvent.MISC);
```

**_Kotlin_**

```kotlin
import tv.anypoint.sdk.comm.TvEvent
import tv.anypoint.api.tv.TvEventPublisher

// TV 이벤트 퍼블리셔 생성
val tvEventPublisher = AnypointSdk.createTvEventPublisher()
// 실시간 TV 시청 중에 채널 변경
var sid = ... // 변경된 채널의 service id, 최초 TV 이벤트 전달시에는 현재 채널의 sid
tvEventPublisher.publish(TvEvent.CHANNEL_CHANGE, sid)
// VOD 진입시, VOD 제목과 함께 상태 전달
tvEventPublisher.publish(TvEvent.VOD_START, "겨울 왕국 2")
// APP 실행시, 앱 ID 와 함께 상태 전달
tvEventPublisher.publish(TvEvent.APP_START, "com.google.android.youtube")
// 슬립 모드 진입 시
tvEventPublisher.publish(TvEvent.SLEEP_MODE_START)
// 광고 소재가 재생되지 않아야 할때 전달
tvEventPublisher.publish(TvEvent.MISC)
```
