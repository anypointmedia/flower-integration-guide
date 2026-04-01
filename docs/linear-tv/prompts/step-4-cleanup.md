---
sidebar_position: 4
---

# Step 4: Cleanup & Release

This prompt guides LLM to implement proper resource cleanup for Linear TV SDK.

```plain
We are integrating the FLOWER Linear TV SDK into our Android STB project.
This step implements proper cleanup.

========================================
PART 1 — SDK Release (Application Level)
========================================

In your Application class onTerminate:

Java:
@Override
public void onTerminate() {
    super.onTerminate();
    AnypointSdk.destroy();
}

Kotlin:
override fun onTerminate() {
    super.onTerminate()
    AnypointSdk.destroy()
}

========================================
PART 2 — Custom Ad Player Release (if applicable)
========================================

If using a custom ad player, implement the release() method:

@Override
public void release() {
    // Free all player resources
    player.release();
    callbacks.clear();
}

The SDK calls release() when it's done with the ad player.

========================================
PART 3 — Check SDK Status
========================================

Before using SDK features, verify initialization:

if (AnypointSdk.isInitialized()) {
    // Safe to use SDK
}

========================================
CONSTRAINTS
========================================

- AnypointSdk.destroy() should be called in Application.onTerminate().
- Do NOT call destroy() in individual Activity/Fragment lifecycle.
- The SDK manages its own ad player lifecycle — do not manually release the built-in player.
- Custom ad player's release() is called by the SDK, not by your application code directly.
```
