---
sidebar_position: 7
---

# Changes to FlowerAdsManagerListener

Due to updates in the method signatures of FlowerAdsManagerListener, you must add the following empty method implementation to your existing listener code.

## v2.2.1 -> v2.3.0

```javascript
const adsManagerListener = {
    /* Original Code
    onPrepare(adDurationMs) {
        ...
    }
    ...
    */

    onAdBreakPrepare(adInfos) {}
}
```

## Related APIs

*   [FlowerAdsManagerListener](api/flower-ads-manager-listener)
