---
sidebar_position: 2
---

# 초기화 및 해제

SDK의 기능을 사용하기 전에 OTT 앱의 시작 과정에서 초기화를 수행해야 합니다. 동작 환경 모드를 아래 설명에 따라 _local_, _dev_, _prod_ 중 하나로 설정합니다.
*   **_local_:** 로컬 환경에서 사용할 수 있으며 기본 로그 레벨은 *Verbose*입니다.
*   **_dev_:** 개발 환경에서 사용할 수 있으며 SDK에서 발생하는 에러 로그가 서버에 저장됩니다. 기본 로그 레벨은 *Info*입니다.
*   **_prod_:** 상용 환경에서 사용할 수 있으며 SDK에서 발생하는 에러 로그가 서버에 저장됩니다. 기본 로그 레벨은 *Warn*입니다.

적절한 리소스 관리와 잠재적 메모리 누수를 방지하기 위해 OTT 앱이 종료될 때 반드시 SDK 해제 함수를 호출해야 합니다.

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
<summary><strong>광고 스킵 기능 비활성화</strong></summary>

Flower 이외의 애드 서빙 시스템을 Flower SDK와 함께 사용하는 경우, 광고 스킵 기능이 오동작할 수 있습니다. 이 경우 아래와 같이 FLOWER SDK의 광고 스킵 기능을 비활성화하는 API를 호출해야 합니다.

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
