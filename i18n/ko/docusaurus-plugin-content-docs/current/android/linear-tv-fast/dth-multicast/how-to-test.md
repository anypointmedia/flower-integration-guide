---
sidebar_position: 8
---

# 테스트 방법

광고 SDK를 사용하여 작업을 마친 후 정상적으로 구현이 되었는지 확인하기 위해서는 테스트가 필요합니다.

하지만 이를 위해서는 SDK 정합뿐만 아니라 모든 시스템 통합이 완료되어야 합니다. (예를 들어 CDN 통합, 채널 리스트 등록 등이 있습니다.)

따라서 통합 테스트를 하기 전에 아래와 같은 절차를 기반으로 광고 SDK의 정합 상태를 확인할 수 있습니다.

## 1. 환경 구성

사전에 [**helpdesk**](mailto:dev.support@anypointmedia.com)에 테스트하려는 환경을 전달한 후 광고 및 테스트 설정을 요청합니다.

| **테스트 환경** | **필수 전달 항목** |
| ---| --- |
| SCTE-35를 포함한 스트림이 준비된 경우 | SCTE-35가 있는 스트림을 녹화하여 공유<br/>• 녹화가 불가능한 경우, SCTE-35 데이터의 uniqueProgramId를 전달<br/>테스트로 사용할 채널의 service ID를 전달 |
| 스트림에 SCTE-35가 없는 경우 | 테스트로 사용할 채널의 service ID를 전달 |

## 2. 광고 에이전트 설치 및 실행

helpdesk에 환경 설정 후 전달받은 광고 에이전트 앱을 테스트하려는 디바이스에 설치합니다.

```bash
adb connect xxx.xxx.xxx.xxx
adb install -r "flower-app_v3.9.30(240729011)-release.apk"
```

아래 커맨드를 통해 에이전트를 강제 실행시킵니다.

```bash
adb shell content query --uri content://tv.anypoint.monitor
```

## 3. 광고 사전 준비

광고 플랫폼에 필요한 환경이 구성되었다면 수동으로 셋탑에 광고를 동기화합니다.

참고로 운영 환경에서는 백엔드 시스템에서 CDN, 광고 현황 등 여러 가지를 고려하여 셋탑에 광고를 동기화합니다.

```bash
adb shell am broadcast -a tv.anypoint.sdk.AD_SYNC
```

아래 `logcat` 로그를 통해 동기화 성공 여부를 확인 가능합니다.

셋탑이 신규로 등록되었을 때에는 목록을 받기까지 5분 정도의 시간이 필요합니다. 만약 오랫동안 동기화가 성공되지 않는다면 [**helpdesk**](mailto:dev.support@anypointmedia.com)에 문의 부탁 드립니다.

성공했을 때에는 `ready=true, status=OK`와 같은 로그가 나옵니다.

**성공 로그 예시:**

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

실패했을 때에는 `ready=false, status=ERROR`와 같은 로그가 나오며 status에 유형이 함께 나옵니다.

**실패 로그 예시:**

```plain
11:23:34.586 AnypointAD_D     tv.anypoint.flower.app     I  [AddrAD][DefaultDispatcher-worker-2][AdManager.doSync][39] "synchronize ads... ==========================================================="
11:23:34.587 AnypointAD       tv.anypoint.flower.app     I  [AddrAD][tDispatcher-worker-2][DeviceStorage.<init>][23] baseDir: /data/user/0/tv.anypoint.flower.app/files/assets
11:23:34.732 AnypointAD_D     tv.anypoint.flower.app     I  [AddrAD][DefaultDispatcher-worker-2][AdManager.doSync][65] "== target ads sync finished: ready=false, status=ERROR"
```

신규 디바이스에 광고 목록을 배정하는 동안에는, `status=OK`와 함께 광고 목록이 비어서 올 수도 있습니다.

**실패 로그 예시 \[신규 디바이스에 광고 배정 진행 중\]:**

```plain
11:35:38.260 AnypointAD_D     tv.anypoint.uplus.tvg.app  I  [AddrAD][DefaultDispatcher-worker-1][AdManager.doSync][33] "synchronize ads... ==========================================================="
11:35:38.260 AnypointAD       tv.anypoint.uplus.tvg.app  I  [AddrAD][tDispatcher-worker-1][DeviceStorage.<init>][2] baseDir: /data/user/0/tv.anypoint.uplus.tvg.app/files/assets
11:35:38.263 AnypointAD_D     tv.anypoint.uplus.tvg.app  E  [AddrAD][DefaultDispatcher-worker-1][AdManager.logFetchedAds][87] fetched ads: []
11:35:38.263 AnypointAD       tv.anypoint.uplus.tvg.app  I  [AddrAD][tDispatcher-worker-1][AssetManager.deleteTsFiles][31] dir: /data/user/0/tv.anypoint.uplus.tvg.app/files/assets, retainAssetIds: []
11:35:38.264 AnypointAD_D     tv.anypoint.uplus.tvg.app  I  [AddrAD][DefaultDispatcher-worker-1][AdManager.doSync][165] "== target ads sync finished: ready=true, status=OK"
```

## 4. 광고 큐 임의 발생

이제 모든 준비가 완료되었으니 수동으로 광고 큐를 발생시켜 광고의 재생 여부를 확인할 수 있습니다.

아래와 같은 절차로 테스트 가능합니다.
1. 테스트할 채널로 변경
2. 수동 광고 큐 전송
3. helpdesk에서 환경 구성이 완료되면 아래와 같은 유형의 광고 큐 발생 명령어를 공유합니다. 아래 명령어는 참고용입니다.

```bash
adb shell am broadcast -a tv.anypoint.sdk.AD_REQUEST --es EXTRA_JSON '{currentPts\\:0\\,duration\\:60000\\,eventProgramId\\:-9999\\,spliceTime\\:810000\\,test\\:false}'
```
