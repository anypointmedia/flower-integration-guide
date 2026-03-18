---
sidebar_position: 4
---

# Inline Ad Implementation

This guide walks you through the complete process of inserting inline ads into content areas within web pages using the Flower SDK. Ad integration follows these steps:
1. **Declare the Ad UI:** Place `FlowerAdView` on the screen to display the ad.
2. **Implement Ad Event Reception:** Implement `FlowerAdsManagerListener` to handle logic at ad playback and completion points.
3. **Configure Additional Parameters (****`extraParams`****):** Set up additional information required for ad targeting.
4. **Request Inline Ads (****`requestAd`****):** Request inline ads by passing information such as the ad tag URL.
5. **Perform Cleanup:** Call `stop()` and `removeListener()` after ad completion to clean up resources.

## Step-by-Step Details

### 1. Declare the Ad UI

> Please refer to the Ad Insertion menu > Declare the Ad UI section for ad UI declaration.

### 2. Receiving Ad Events – `FlowerAdsManagerListener`

> To handle inline ad insertion at the appropriate ad start and end points, the SDK provides the ad event reception interface `FlowerAdsManagerListener`. Below is an implementation example.

```javascript
const adsManagerListener = {
    onPrepare(adDurationMs) {
        flowerAdView.adsManager.play();
    },
    onPlay() {
        // TODO GUIDE: need nothing for interstitial ad
    },
    onCompleted() {
        // TODO GUIDE: stop FlowerAdsManager
        flowerAdView.adsManager.stop();
        flowerAdView.adsManager.removeListener(adsManagerListener);
    },
    onError(error) {
        // TODO GUIDE: stop FlowerAdsManager
        flowerAdView.adsManager.stop();
        flowerAdView.adsManager.removeListener(adsManagerListener);
    }
};
flowerAdView.adsManager.addListener(adsManagerListener);
```

### 3. Additional Parameters for Ad Requests – `extraParams`

> When requesting ads using the Flower SDK, passing additional parameters helps the SDK provide the most suitable ads. For web apps, since the SDK cannot determine the ad serving context on its own, these parameters must be passed to the SDK when requesting ads.

#### Parameter List

| Key<br/>(\* indicates required for web apps) | Value | Example |
| ---| ---| --- |
| serviceId\* | App package name | "tv.anypoint.service" |
| os\* | OS of the device running the app | "Web" |
| adId\* | Ad identifier of the device running the app | Web: User identifier or session ID |

### 4. Inline Ad API

#### FlowerAdsManager.requestAd()

Function used to request inline ads. The following describes the parameters:

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | Ad tag URL issued by the ad server |
| extraParams | map | Additional pre-agreed information for targeting (empty map if none) |
| adTagHeaders | map | (Optional) HTTP header information to add when requesting ads |

#### FlowerAdsManager.stop()

API used to terminate inline ads. No parameters.

## Inline Ad Request Example

### _Plain HTML/JavaScript_

```javascript
// Initialize SDK
FlowerSdk.init();
FlowerSdk.setLogLevel('Debug');

// Get FlowerAdView instance
const flowerAdView = document.getElementById('flower-ad-view');

// TODO GUIDE: Implement FlowerAdsManagerListener
const adsManagerListener = {
    onPrepare(adDurationMs) {
        flowerAdView.adsManager.play();
    },
    onPlay() {
        // OPTIONAL GUIDE: Implement custom actions for when the ad playback starts
    },
    onCompleted() {
        // TODO GUIDE: stop FlowerAdsManager
        flowerAdView.adsManager.stop();
        flowerAdView.adsManager.removeListener(adsManagerListener);
    },
    onError(error) {
        console.error('Error from Flower SDK: ', error);
        // TODO GUIDE: stop FlowerAdsManager
        flowerAdView.adsManager.stop();
        flowerAdView.adsManager.removeListener(adsManagerListener);
    }
};

// Register listener
flowerAdView.adsManager.addListener(adsManagerListener);

// TODO GUIDE: request inline ad
// arg0: adTagUrl, url from flower system.
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: extraParams, values you can provide for targeting
// arg2: adTagHeaders, (Optional) values included in headers for ad request
flowerAdView.adsManager.requestAd(
    'https://ad_request',
    { 'custom-param': 'custom-param-value' },
    { 'custom-ad-header': 'custom-ad-header-value' }
);
```
