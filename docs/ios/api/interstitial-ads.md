---
sidebar_position: 3
---

# Interstitial Ads

## Methods

### FlowerAdsManager.requestAd

The function above allows you to insert interstitial ads. The parameters are described below:.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| adTagUrl | string | Ad tag URL issued by an ad server |
| extraParams | map | Extra information which is agreed upon for targeting (null for no extra information) |
| adTagHeaders | map | (Optional) HTTP header information to be added when requesting an ad |

### FlowerAdsManager.stop

This method ends ad playback. There are no parameters.

## Work Process

1. Insert replacement ads at a correct timing, consulting “Ad UI Declaration”. For interstitial ads, ensure the AdView covers the entire screen.
2. Implement _FlowerAdsManagerListener_ interface, consulting “Implement an Interface for Receiving Ad Events”.
3. Finally, request ads trough _FlowerAdsManager_._requestAd_.

```swift
// TODO GUIDE: request ad
// arg0: adTagUrl, url from flower system
//       You must file a request to Anypoint Media to receive a adTagUrl.
// arg1: extraParams, values you can provide for targeting
// arg2: adTagHeaders, (Optional) values included in headers for ad request
flowerAdView.adsManager.requestAd(
    adTagUrl: "https://ad_request",
    extraParams: [String: String](),
    adTagHeaders: ["custom-ad-header": "custom-ad-header-value"]
);
```
