---
sidebar_position: 1
---

# Inline Ad Implementation

This guide walks you through the complete process of inserting inline ads into content areas within web pages or apps using the Flower SDK. Ad integration follows these steps:
1. **Declare the Ad UI:** Place `FlowerAdView` on the screen to display the ad.
2. **Implement Ad Event Reception:** Implement `FlowerAdsManagerListener` to handle logic at ad playback and completion points.
3. **Configure Additional Parameters (`extraParams`):** Set up additional information required for ad targeting.
4. **Request Inline Ads (`requestAd`):** Request inline ads by passing information such as the ad tag URL.
5. **Perform Cleanup:** Call `stop()` and `removeListener()` after ad completion to clean up resources.

## Step-by-Step Details

### 1. Declare the Ad UI

> Please refer to the Ad Insertion menu > Declare the Ad UI section for ad UI declaration.

### 2. Receiving Ad Events – `FlowerAdsManagerListener`

> To handle inline ad insertion at the appropriate ad start and end points, the SDK provides the ad event reception interface `FlowerAdsManagerListener`. Below is an implementation example.

#### _SwiftUI_
```swift
class FlowerAdsManagerListenerImpl: FlowerAdsManagerListener {
    var inlineAdView: InlineAdView

    init(_ inlineAdView: InlineAdView) {
        self.inlineAdView = inlineAdView
    }

    func onPrepare(adDurationMs: Int32) {
        inlineAdView.flowerAdView.adsManager.play()
    }

    func onPlay() {
        // TODO GUIDE: need nothing for interstitial ad
    }

    func onCompleted() {
        // TODO GUIDE: stop FlowerAdsManager
        inlineAdView.flowerAdView.adsManager.stop()
        inlineAdView.flowerAdView.adsManager.removeListener(adsManagerListener: self)
    }

    func onError(error: FlowerError?) {
        // TODO GUIDE: stop FlowerAdsManager
        inlineAdView.flowerAdView.adsManager.stop()
        inlineAdView.flowerAdView.adsManager.removeListener(adsManagerListener: self)
    }
}

let adsManagerListener = FlowerAdsManagerListenerImpl(self)
flowerAdView.adsManager.addListener(adsManagerListener: adsManagerListener)
```

#### _UIKit_
```swift
// TODO GUIDE: Implement FlowerAdsManagerListener
extension InlineAdViewController: FlowerAdsManagerListener {
    func onPrepare(adDurationMs: Int32) {
        flowerAdView.adsManager.play()
    }

    func onPlay() {
        // TODO GUIDE: need nothing for interstitial ad
    }

    func onCompleted() {
        // TODO GUIDE: stop FlowerAdsManager
        flowerAdView.adsManager.stop()
        flowerAdView.adsManager.removeListener(adsManagerListener: self)
    }

    func onError(error: FlowerError?) {
        // TODO GUIDE: stop FlowerAdsManager
        flowerAdView.adsManager.stop()
        flowerAdView.adsManager.removeListener(adsManagerListener: self)
    }
}
flowerAdView.adsManager.addListener(adsManagerListener: self)
```

### 3. Additional Parameters for Ad Requests – `extraParams`

> When requesting ads using the Flower SDK, passing additional parameters helps the SDK provide the most suitable ads. For mobile apps, since the SDK cannot determine the ad serving context on its own, these parameters must be passed to the SDK when requesting ads.

#### Parameter List

| Key<br/>(\* indicates mobile app required) | Value | Example |
| ---| ---| --- |
| serviceId\* | App package name | "tv.anypoint.service" |
| os\* | OS of the device running the app | "iOS" |
| adId\* | Ad identifier of the device running the app | iOS: Apple's IDFA value |

### 4. Inline Ad API

#### FlowerAdsManager.requestAd()

Function used to request inline ads. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | String | Ad tag URL issued by the ad server |
| extraParams | \[String: String\] | Additional pre-agreed information for targeting (empty dictionary if none) |
| adTagHeaders | \[String: String\] | (Optional) HTTP header information to add when requesting ads |

#### FlowerAdsManager.stop()

API used to terminate inline ads. No parameters.

## Inline Ad Request Example

```swift
// TODO GUIDE: request inline ad
// arg0: adTagUrl, url from flower system.
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: extraParams, values you can provide for targeting
// arg2: adTagHeaders, (Optional) values included in headers for ad request
flowerAdView.adsManager.requestAd(
    adTagUrl: "https://ad_request",
    extraParams: [String: String](),
    adTagHeaders: ["custom-ad-header": "custom-ad-header-value"]
)
```
