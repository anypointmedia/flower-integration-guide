---
sidebar_position: 7
---

# Changes to FlowerAdsManagerListener

Due to updates in the method signatures of FlowerAdsManagerListener, you must add the following empty method implementation to your existing listener code.

## v2.2.2 -> v2.3.0

```swift
class FlowerAdsManagerListenerImpl: FlowerAdsManagerListener {
    /* Original Code
    func onPrepare(adDurationMs: Int32) {
        ...
    }
    ...
    */

    func onAdBreakPrepare(adInfos: NSMutableArray) {}
}
```

## Related APIs

*   [FlowerAdsManagerListener](api/flower-ads-manager-listener)
