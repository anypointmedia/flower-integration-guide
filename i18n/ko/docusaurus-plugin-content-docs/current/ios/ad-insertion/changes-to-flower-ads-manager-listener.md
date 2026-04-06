---
sidebar_position: 7
---

# FlowerAdsManagerListener 변경 사항

FlowerAdsManagerListener의 메소드 시그니처 업데이트로 인해, 기존 리스너 코드에 다음과 같은 빈 메소드 구현을 추가해야 합니다.

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

## 관련 API

*   [FlowerAdsManagerListener](../api/flower-ads-manager-listener)
