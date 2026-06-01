---
sidebar_position: 9
---

# UI 이벤트 전달

스킵 오프셋이 적용된 광고, "더 알아보기"와 같은 클릭 가능한 요소가 포함된 광고 등 시청자 입력에 반응하는 인터랙티브 광고 포맷은 `AnypointAdView` 내부의 뷰들이 TV 앱으로부터 포커스를 가져와서 키 이벤트(D-pad, OK, BACK)를 받을 수 있어야 정상 동작합니다.

이 페이지는 SDK가 포커스 전환을 어떻게 처리하는지, 그리고 광고 뷰가 기대대로 포커스를 받지 못할 때 점검할 사항을 설명합니다.

## 목적과 동작 원리

일반 재생 중에는 `AnypointAdView`가 포커스를 가져가지 **않습니다**. 모든 키 이벤트는 TV 앱 본래의 UI(채널 변경, EPG, 설정 등)로 전달되므로 광고 레이어가 추가되어도 사용자 경험에는 영향이 없습니다.

SDK가 인터랙티브 시그널의 시작을 감지하면(예: IMA SDK의 `SKIPPABLE_STATE_CHANGED`), 해당 내부 뷰의 포커스 정책을 다음과 같이 전환합니다.

1. `setDescendantFocusability(FOCUS_AFTER_DESCENDANTS)`를 적용하여 내부 뷰(예: `GoogleAdView`)가 포커스를 가질 수 있도록 합니다.
2. `setFocusable(true)`와 `setFocusableInTouchMode(true)`를 적용합니다.
3. `requestFocus()`를 호출하여 실제로 키 이벤트를 받는 상태로 만듭니다.

인터랙티브 구간이 종료되면 포커스 정책을 원복하고, 포커스를 다시 TV 앱으로 반환합니다.

> **참고:** 이 동작을 위해 TV 앱이 별도의 API를 호출할 필요는 없습니다. SDK 내부에서 포커스 전환을 처리합니다. 다만 TV 앱의 레이아웃과 포커스 정책이 광고 뷰로의 포커스 이동을 막지 않아야 합니다.

## 트러블슈팅

다음 항목들은 SDK가 `setFocusable(true)`와 `requestFocus()`를 호출했음에도 내부 뷰가 실제로 포커스를 받지 못하는 상황을 다룹니다. 원인은 모두 SDK 외부, 즉 TV 앱 측 구성에 있습니다.

### 1. 상위 ViewGroup이 포커스를 차단

`descendantFocusability`가 `FOCUS_BLOCK_DESCENDANTS`로 설정된 조상이 하나라도 있으면 SDK가 어떤 호출을 하든 `AnypointAdView`로 포커스가 도달하지 못합니다. 메인 UI에 포커스를 강하게 묶어 두기 위해 TV 앱 루트 레이아웃, 영상 컨테이너, 또는 프래그먼트 호스트에서 이렇게 설정한 경우가 흔합니다.

**원인 식별 방법**

광고가 인터랙티브 상태로 전환되는 시점에 부모 체인을 따라 올라가며 각 `ViewGroup`의 `descendantFocusability`를 로깅합니다.

**_Java_**

```java
ViewParent parent = anypointAdView.getParent();
while (parent instanceof ViewGroup) {
    ViewGroup vg = (ViewGroup) parent;
    String mode;
    switch (vg.getDescendantFocusability()) {
        case ViewGroup.FOCUS_BEFORE_DESCENDANTS: mode = "BEFORE"; break;
        case ViewGroup.FOCUS_AFTER_DESCENDANTS:  mode = "AFTER";  break;
        case ViewGroup.FOCUS_BLOCK_DESCENDANTS:  mode = "BLOCK";  break;
        default: mode = "UNKNOWN";
    }
    Log.d("AdFocus", "Parent " + vg.getClass().getSimpleName() + " = " + mode);
    parent = vg.getParent();
}
```

**_Kotlin_**

```kotlin
var parent: ViewParent? = anypointAdView.parent
while (parent is ViewGroup) {
    val mode = when (parent.descendantFocusability) {
        ViewGroup.FOCUS_BEFORE_DESCENDANTS -> "BEFORE"
        ViewGroup.FOCUS_AFTER_DESCENDANTS  -> "AFTER"
        ViewGroup.FOCUS_BLOCK_DESCENDANTS  -> "BLOCK"
        else -> "UNKNOWN"
    }
    Log.d("AdFocus", "Parent ${parent.javaClass.simpleName} = $mode")
    parent = parent.parent
}
```

**해결 방법**

`BLOCK`이 출력되는 조상의 `descendantFocusability`를 `FOCUS_BEFORE_DESCENDANTS` 또는 `FOCUS_AFTER_DESCENDANTS`로 변경합니다. 화면의 다른 영역을 위해 차단이 필요한 경우라면 광고 레이어를 해당 조상 밖으로 배치하는 것을 검토합니다.

### 2. 뷰의 크기가 0이거나 보이지 않는 상태

뷰가 `GONE`/`INVISIBLE`이거나 측정된 너비 또는 높이가 0이면 포커스를 받을 수 없습니다. 어떤 조상이라도 같은 상태이면 동일한 결과가 발생합니다. 인터랙티브 시그널이 **광고 뷰의 레이아웃 패스가 완료되기 전에** 발생하는 경우(예: 채널 진입 직후, 빠른 PreRoll 광고 시작 시)에 자주 나타납니다.

**원인 식별 방법**

SDK가 포커스를 요청한 다음 프레임에서 상태를 로깅합니다.

**_Java_**

```java
anypointAdView.post(() -> {
    Log.d("AdFocus",
        "visible=" + (anypointAdView.getVisibility() == View.VISIBLE)
        + " size=" + anypointAdView.getWidth() + "x" + anypointAdView.getHeight()
        + " enabled=" + anypointAdView.isEnabled());
});
```

**_Kotlin_**

```kotlin
anypointAdView.post {
    Log.d("AdFocus",
        "visible=${anypointAdView.visibility == View.VISIBLE}" +
        " size=${anypointAdView.width}x${anypointAdView.height}" +
        " enabled=${anypointAdView.isEnabled}")
}
```

**해결 방법**

- `AnypointAdView`의 `layoutParams`가 0이 아닌 크기로 해석되도록 합니다. 적절한 크기의 부모에 대해 `MATCH_PARENT`를 적용하는 표준 패턴은 [광고 레이어 추가](./adding-an-ad-layer.md)에 안내되어 있습니다.
- 광고가 재생될 가능성이 있는 동안 `AnypointAdView`를 `GONE`/`INVISIBLE`로 전환하지 마세요. 항상 가시 레이어 계층에 두는 것을 권장합니다.
- 광고 레이어를 동적으로 추가하는 경우, 광고 시작 이전에 추가하여 레이아웃 패스가 완료된 뒤에 인터랙티브 시그널이 도착하도록 합니다.

### 3. 다른 뷰가 포커스를 점유

광고 뷰가 포커스를 받을 수 있는 자격을 모두 갖춘 경우에도 포커스는 자동으로 이동하지 않습니다. 액티비티 내 다른 뷰가 현재 포커스를 가지고 있고, 그 뷰가 SDK의 `requestFocus()`를 거부하도록 동작한다면(`nextFocusXxx` 속성, 키 이벤트 인터셉터, 자기 자신에게 다시 `requestFocus()`를 호출하는 `onFocusChangeListener` 등) 광고 뷰는 포커스를 받지 못합니다.

TV 앱에서 흔한 점유자는 실시간 플레이어 뷰, 채널 배너, EPG, 액티비티 루트에 설정된 글로벌 키 리스너 등입니다.

**원인 식별 방법**

SDK 전환 직후 현재 포커스를 가진 뷰가 누구인지 확인합니다.

**_Java_**

```java
View current = ((Activity) getContext()).getCurrentFocus();
Log.d("AdFocus", "currentFocus=" + (current == null ? "null" : current.getClass().getSimpleName())
    + " adHasFocus=" + anypointAdView.hasFocus());
```

**_Kotlin_**

```kotlin
val current = (context as Activity).currentFocus
Log.d("AdFocus", "currentFocus=${current?.javaClass?.simpleName ?: "null"}" +
    " adHasFocus=${anypointAdView.hasFocus()}")
```

`currentFocus`가 계속 TV 앱의 특정 뷰로 돌아온다면, 해당 뷰가 포커스 경쟁에서 이기고 있는 상태입니다.

**해결 방법**

- 포커스 점유 뷰의 `onFocusChangeListener`가 자기 자신에게 `requestFocus()`를 다시 호출하는 로직이 있다면 제거합니다.
- 점유 뷰의 `android:nextFocusForward`, `nextFocusDown`, `nextFocusUp`, `nextFocusLeft`, `nextFocusRight`를 점검합니다. 이 중 어떤 것도 광고 레이어를 명시적으로 우회하도록 지정되어선 안 됩니다.
- 액티비티가 `dispatchKeyEvent`나 `onKeyDown`에서 키 이벤트를 무조건 소비하는 구조라면, 광고 레이어가 `hasFocus()` 상태일 때는 하위로 전달되도록 조건을 추가합니다.
- 방어적인 처리로, TV 앱에서 [광고 이벤트 수신](./receiving-ad-events.md)을 통해 인터랙티브 진입 시점을 감지한 뒤 `getCurrentFocus().clearFocus()`를 호출하여 점유 뷰의 포커스를 능동적으로 해제할 수 있습니다.
