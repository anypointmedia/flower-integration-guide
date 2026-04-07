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

### 2. Receiving Ad Events - `FlowerAdsManagerListener`

> To handle inline ad insertion at the appropriate ad start and end points, the SDK provides the ad event reception interface `FlowerAdsManagerListener`. Below is an implementation example.

```kotlin
val adsManagerListener = object : FlowerAdsManagerListener {
    override fun onPrepare(adDurationMs: Int) {
        flowerAdView.adsManager.play()
    }
    override fun onPlay() {
        // TODO GUIDE: need nothing for interstitial ad
    }
    override fun onCompleted() {
        // TODO GUIDE: stop FlowerAdsManager
        flowerAdView.adsManager.stop()
        flowerAdView.adsManager.removeListener(adsManagerListener)
    }
    override fun onError(error: FlowerError?) {
        // TODO GUIDE: stop FlowerAdsManager
        flowerAdView.adsManager.stop()
        flowerAdView.adsManager.removeListener(adsManagerListener)
    }
}
flowerAdView.adsManager.addListener(adsManagerListener)
```

### 3. Additional Parameters for Ad Requests - `extraParams`

> When requesting ads using the Flower SDK, passing additional parameters helps the SDK provide the most suitable ads. For mobile web apps, since the SDK cannot determine the ad serving context on its own, these parameters must be passed to the SDK when requesting ads.

#### Parameter List

| Key<br/>(\* indicates web app required) | Value | Example |
| ---| ---| --- |
| serviceId\* | App package name | "tv.anypoint.service" |
| os\* | OS of the device running the app | "Android" |
| adId\* | Ad identifier of the device running the app | Android: Google's GAID value |

### 4. Inline Ad API

#### FlowerAdsManager.requestAd()

Function used to request inline ads. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | Ad tag URL issued by Flower backend system.<br/>You must file a request to Anypoint Media to receive a adTagUrl. |
| extraParams | map | (Optional) Additional information pre-agreed for targeting. |
| adTagHeaders | map | (Optional) HTTP header information to add for ad requests. |

#### FlowerAdsManager.stop()

Call this API to terminate inline ads. No parameters required.

## Inline Ad Request Example

```kotlin
// TODO GUIDE: request inline ad
// arg0: adTagUrl, url from flower system.
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: extraParams, values you can provide for targeting
// arg2: adTagHeaders, (Optional) values included in headers for ad request
flowerAdView.adsManager.requestAd(
    "https://ad_request",
    mapOf(),
    mapOf("custom-ad-header" to "custom-ad-header-value")
)
```
