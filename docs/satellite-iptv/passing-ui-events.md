---
sidebar_position: 9
---

# Passing UI Events

For interactive ad formats — such as ads with a skip offset, ads with clickable elements like a "Learn More" button, or any creative that responds to viewer input — views inside `AnypointAdView` must be able to take focus from the TV app and receive key events (D-pad, OK, BACK).

This page explains how that focus transfer is performed by the SDK and how to troubleshoot common cases in which focus does not move to the ad view as expected.

## Purpose and Operating Principle

During normal playback, `AnypointAdView` does **not** take focus. All key events flow to the TV app's own UI (channel changer, EPG, settings, and so on), so the user experience is unaffected by the presence of the ad layer.

When the SDK detects that an interactive signal has begun — for example, when the IMA SDK fires `SKIPPABLE_STATE_CHANGED` — it switches the focusability of the relevant inner view on:

1. `setDescendantFocusability(FOCUS_AFTER_DESCENDANTS)` is applied so the inner view (e.g. `GoogleAdView`) is allowed to host focus.
2. `setFocusable(true)` and `setFocusableInTouchMode(true)` are applied.
3. `requestFocus()` is called so the view actually receives subsequent key events.

When the interactive segment ends, the focusability is reverted and focus is released back to the TV app.

> **Note:** The TV app does not need to call any API to make this happen — the SDK manages the focus transition internally. However, the TV app's layout and focus policy must allow focus to land on the ad view.

## Troubleshooting

The following sections describe situations in which the SDK has called `setFocusable(true)` and `requestFocus()`, but the inner view still does not actually take focus. In each case, the root cause is in the surrounding TV app, not in the SDK.

### 1. A Parent ViewGroup is Blocking Focus

Any ancestor `ViewGroup` whose `descendantFocusability` is `FOCUS_BLOCK_DESCENDANTS` prevents focus from reaching `AnypointAdView`, regardless of what the SDK does. This is common when the TV app's root layout, video container, or fragment host has been hardened to keep focus on the main UI.

**How to identify the blocker**

When the ad becomes interactive, walk up the parent chain and log each `ViewGroup`'s descendant focusability:

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

**How to fix**

Change any ancestor that prints `BLOCK` to either `FOCUS_BEFORE_DESCENDANTS` or `FOCUS_AFTER_DESCENDANTS`. If the blocking is intentional for other parts of the screen, move the ad layer out from under the blocking parent.

### 2. The View Has No Size or Is Not Visible

A view that is `GONE` or `INVISIBLE`, or whose measured width or height is zero, cannot take focus. Any ancestor in those states has the same effect. This frequently occurs when the interactive signal fires **before the ad view's layout pass has completed** — for example, immediately after channel entry or during a fast pre-roll start.

**How to identify it**

Log the relevant state on the next frame after the SDK has requested focus:

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

**How to fix**

- Ensure that `AnypointAdView`'s `layoutParams` resolve to a non-zero size. The standard pattern of using `MATCH_PARENT` against a properly sized parent is shown in [Adding an Ad Layer](./adding-an-ad-layer.md).
- Do not toggle `AnypointAdView` to `GONE`/`INVISIBLE` while ads may be playing. Keep it within the visible layer hierarchy at all times.
- If the ad layer is added dynamically, add it before ads begin so that the layout pass is complete by the time any interactive signal can arrive.

### 3. Another View is Holding Focus

Even when the ad view is fully eligible to take focus, focus does not move automatically. If another view in the activity currently holds focus **and** rejects the SDK's `requestFocus()` — through conflicting `nextFocusXxx` attributes, key-event interceptors, or an `onFocusChangeListener` that re-grabs focus — the ad view remains unfocused.

Common offenders on a TV app are the live player view, the channel banner, the EPG, and global key listeners on the activity root.

**How to identify it**

Check which view currently holds focus immediately after the SDK transition:

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

If `currentFocus` keeps resolving to one of your TV-app views, that view is winning the focus contest.

**How to fix**

- Remove any `onFocusChangeListener` on the focus holder that calls `requestFocus()` back on itself.
- Audit `android:nextFocusForward`, `nextFocusDown`, `nextFocusUp`, `nextFocusLeft`, and `nextFocusRight` on the focus holder. None of them should explicitly route focus away from the ad layer.
- If the activity intercepts `dispatchKeyEvent` or `onKeyDown` and unconditionally consumes key events, make it pass them through to descendants while the ad layer reports `hasFocus()`.
- As a defensive measure, the TV app can listen for the ad becoming interactive through [Receiving Ad Events](./receiving-ad-events.md) and call `getCurrentFocus().clearFocus()` at that point to release the holder's focus.
