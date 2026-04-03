---
sidebar_position: 8
---

# How to Test

To ensure the successful implementation of the ad operation feature within your TV app and confirm the successful playback of ad video files using the SDK, testing is required.

In order to conduct comprehensive testing, all system integrations—including CDN and channel list registration—in conjunction with the SDK implementation, must be completed.

This section outlines the procedures necessary to verify successful SDK implementation prior to full-scale testing.

## 1. Test Settings

Request ad configurations and testing parameters, having previously provided the necessary test conditions to the support team at [**helpdesk**](mailto:dev.support@anypointmedia.com).

| **Testing Conditions** | **Required Parameters** |
| ---| --- |
| Stream containing SCTE-35 | A prepared stream incorporating SCTE-35 metadata.<br/>• If recording is infeasible, provide the uniqueProgramId from the SCTE-35 data.<br/>The service ID of the channel designated for testing. |
| Stream lacking SCTE-35 | The service ID of the channel designated for testing. |

## 2. Installing and Executing Ad Agent

Following the environment setup by the support team, install the provided Ad Agent application on the target test device.

```bash
adb connect xxx.xxx.xxx.xxx
adb install -r "flower-app_v3.9.30(240729011)-release.apk"
```

Initiate the Ad Agent using the following command:

```bash
adb shell content query --uri content://tv.anypoint.monitor
```

## 3. Preparation

Upon successful environment configuration for the ad platform, manually synchronize the ad list to the set-top box.

For clarity, in a production environment, ad synchronization to the set-top box occurs automatically, considering factors such as CDN availability and backend system ad status.

```bash
adb shell am broadcast -a tv.anypoint.sdk.AD_SYNC
```

Verify successful synchronization via the `logcat` output.

Upon initial registration, a set-top box may require up to 5 minutes to receive the ad list. If synchronization does not complete within this timeframe, contact he [**helpdesk**](mailto:dev.support@anypointmedia.com).

A successful synchronization will yield a log entry similar to: `ready=true, status=OK`.

**Successful log example:**

```plain
11:16:08.530 AnypointAD_D     tv.anypoint.flower.app     I  [AddrAD][DefaultDispatcher-worker-3][AdManager.doSync][33] "synchronize ads... ==========================================================="
11:16:08.531 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-3][DeviceStorage.<init>][2] baseDir: /data/user/0/tv.anypoint.flower.app/files/assets
11:16:08.707 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-3][AdManager.logFetchedAds][17] fetched ads:
11:16:08.707 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-3][AdManager.logFetchedAds][59]   Ad(id=1000001, adRequest=null, asset=Asset(assetId=2000001, crc=1480872814, mediaUrl=https://...
11:16:08.707 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-3][AdManager.logFetchedAds][59]   Ad(id=1000002, adRequest=null, asset=Asset(assetId=2000002, crc=852735640, mediaUrl=https://...
11:16:11.593 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-3][FileExt.calcCrc32][104] completed to calcCrc32 - /data/user/0/tv.anypoint.flower.app/files/assets/2000001.ts
11:16:11.593 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-3][DownloadService.checkCompletion][94] change file permissions: file=/data/user/0/tv.anypoint.flower.app/files/assets/2000001.ts readable=true
11:16:11.593 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-3][AssetManager.download][103] existing file's crc is ok: 2000001.ts
11:16:13.601 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-3][FileExt.calcCrc32][104] completed to calcCrc32 - /data/user/0/tv.anypoint.flower.app/files/assets/2000002.ts
11:16:13.602 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-3][DownloadService.checkCompletion][94] change file permissions: file=/data/user/0/tv.anypoint.flower.app/files/assets/2000002.ts readable=true
11:16:13.602 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-3][AssetManager.download][103] existing file's crc is ok: 2000002.ts
11:16:19.118 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-3][AdManager.reportSyncedAds][113] report ad sync: [1000001, 1000002]
11:16:19.126 AnypointAD_D     tv.anypoint.flower.app     I  [AddrAD][DefaultDispatcher-worker-3][AdManager.doSync][165] "== target ads sync finished: ready=true, status=OK"
```

A failed synchronization will yield a log entry similar to: ready=false, status=ERROR, along with the associated error status.

**Failure log example:**

```plain
11:23:34.586 AnypointAD_D     tv.anypoint.flower.app     I  [AddrAD][DefaultDispatcher-worker-2][AdManager.doSync][39] "synchronize ads... ==========================================================="
11:23:34.587 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-2][DeviceStorage.<init>][23] baseDir: /data/user/0/tv.anypoint.flower.app/files/assets
11:23:34.732 AnypointAD_D     tv.anypoint.flower.app     I  [AddrAD][DefaultDispatcher-worker-2][AdManager.doSync][65] "== target ads sync finished: ready=false, status=ERROR"
```

An issue has been identified where an empty ad list may be assigned to a new device despite a successful status response. The following log excerpt illustrates this failure during ad list assignment:

**Failure log example \[Ad List Assignment Not Completed to a New Device\]:**

```plain
11:35:38.260 AnypointAD_D     tv.anypoint.uplus.tvg.app  I  [AddrAD][DefaultDispatcher-worker-1][AdManager.doSync][33] "synchronize ads... ==========================================================="
11:35:38.260 AnypointAD       tv.anypoint.uplus.tvg.app  I  [AddrAD][tDispatcher-worker-1][DeviceStorage.<init>][2] baseDir: /data/user/0/tv.anypoint.uplus.tvg.app/files/assets
11:35:38.263 AnypointAD_D     tv.anypoint.uplus.tvg.app  E  [AddrAD][DefaultDispatcher-worker-1][AdManager.logFetchedAds][87] fetched ads: []
11:35:38.263 AnypointAD       tv.anypoint.uplus.tvg.app  I  [AddrAD][tDispatcher-worker-1][AssetManager.deleteTsFiles][31] dir: /data/user/0/tv.anypoint.uplus.tvg.app/files/assets, retainAssetIds: []
11:35:38.264 AnypointAD_D     tv.anypoint.uplus.tvg.app  I  [AddrAD][DefaultDispatcher-worker-1][AdManager.doSync][165] "== target ads sync finished: ready=true, status=OK"
```

## 4. Manual Ad Cue Generation

With the environment properly configured, validate ad playback by manually generating an ad cue.

Follow the procedure outlined below:
1. Navigate to the channel designated for ad playback testing.
2. Generate an ad cue manually.
3. Upon completion of the environment setup by the support team, the specific ad cue generation command will be provided. The following command serves as an example:

```bash
adb shell am broadcast -a tv.anypoint.sdk.AD_REQUEST --es EXTRA_JSON '{currentPts\\:0\\,duration\\:60000\\,eventProgramId\\:-9999\\,spliceTime\\:810000\\,test\\:false}'
```
