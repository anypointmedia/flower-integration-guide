---
sidebar_position: 1
title: OTT Linear TV (incl. FAST) 광고
---

# OTT Linear TV (incl. FAST) 광고

이 SDK는 시청자가 Live HLS/DASH 콘텐츠에 진입했을 때 광고를 재생하거나, 광고 마커를 사용하여 재생목록 매니페스트(m3u8 또는 mpd)를 가공하여 광고로 대체 할 수 있습니다.

## 광고 유형

### 본 스트림 대체 광고

광고 마커(예: SCTE-35)를 사용하여 본 콘텐츠 스트림을 대체하는 광고 유형입니다. 대체 광고가 재생되거나 종료될 때 SDK는 호스트 서비스에 이벤트를 전송합니다.

### 채널 진입 광고

시청자가 본 콘텐츠 스트림에 진입하기 전에 재생되는 광고입니다. 시청자가 실시간 콘텐츠를 시청하려고 하면 먼저 진입 광고가 표시됩니다. 진입 광고가 끝나면 시청자는 본 콘텐츠 스트림으로 자연스럽게 전환됩니다.
단, 채널 진입 광고를 사용하는 경우에는 진입 광고가 끝난 후 자동으로 본 콘텐츠 스트림을 시작하기 때문에 앱에서 직접 재생을 시작할 필요가 없습니다. 오히려 직접 재생을 시작하는 경우에는 본 콘텐츠 영상이 일부 노출될 수 있어서 UX를 저하시킬 수 있습니다.

## View Layer 구조

*AdView*는 메인 플레이어가 위치한 뷰와 동일한 크기여야 하며 해당 뷰를 완전히 덮어야 합니다.

*AdView*는 기본적으로 투명하게 표시되며, 필요에 따라 "더보기"나 "건너뛰기" 버튼 또는 오버레이 광고가 표시될 수 있습니다.

![](/img/docs/32f9fd50-3022-4d1c-90af-cab02c1713e2.png)

## 애플리케이션 구조도

플레이어는 SDK를 통해 변경된 미디어 스트림주소를 사용하여 재생하게 되면 SDK가 본 콘텐츠를 광고로 대체하여 전달하게 됩니다. 따라서 플레이어에 특별한 다른 설정을 할 필요가 없습니다.

```mermaid
flowchart LR
  subgraph App["Service Application"]
    Player["Player"]
    SDK["SDK"]
  end
  CDN["CDN"]

  CDN -- "Original\nM3U8/MPD" --> SDK
  SDK -- "Manipulated M3U8/MPD\nwith targeted Ads" --> Player
  CDN -- "chunked ts/mp4" --> Player
```

## 프리롤 광고

채널 프리롤은 위에서 설명한 [채널 진입 광고](#채널-진입-광고)입니다. `changeChannelUrl`에 `prerollAdTagUrl`을 전달하면 활성화되며, 본 스트림 대체 광고와는 독립적으로 동작하며, *AdView* 안에서 재생됩니다.

```mermaid
flowchart TD
  A["FlowerAdsManager.changeChannelUrl\n(with prerollAdTagUrl)"]:::appCall
  B["Request Pre-roll AD"]
  C{"Ad available?"}
  D["FlowerAdsManagerListener.onPrepare & onPlay"]:::sdkEvent
  E["Play Pre-roll AD on the SDK ad player\n(content player paused)"]
  F["FlowerAdsManagerListener.onCompleted"]:::sdkEvent
  G["Content player resumed"]
  H["Original Stream In Progress\n(main stream replacement ads)"]

  A --> B --> C
  C -- "Yes" --> D --> E
  E -- "Finished or failed" --> F
  C -- "No ad / request failed" --> F
  F --> G --> H

  classDef appCall fill:#d0e8ff,stroke:#5b9bd5,color:#000
  classDef sdkEvent fill:#ffd0d0,stroke:#e06060,color:#000
```

- **흐름**: `changeChannelUrl`은 채널과 함께 프리롤을 요청하고, 평소처럼 미디어 스트림 주소를 반환합니다. 프리롤이 준비되면 SDK가 직접 재생을 시작하며(앱은 프리롤을 위해 `play`를 호출하지 않습니다), 재생되는 동안 콘텐츠 플레이어를 일시정지합니다. 프리롤이 끝나면 SDK는 `onCompleted`를 발생시키고 콘텐츠 플레이어를 재개합니다.
- **광고가 없거나 실패한 경우**: 프리롤 태그가 광고를 반환하지 않거나 요청이 실패하면 SDK는 `onCompleted`를 발생시키고 채널이 평소처럼 시작됩니다. `changeChannelUrl`에서는 재생에 실패한 프리롤도 `onError`가 아니라 `onCompleted`로 끝납니다.
- **앱이 재생을 시작하는 시점**: 앱이 `changeChannelUrl`을 직접 호출하는 경우, 반환된 주소를 보관했다가 `onCompleted`에서 플레이어에 설정합니다. 그래야 프리롤 전에 본 콘텐츠가 잠깐 노출되지 않습니다. SDK의 플레이어 연동이 채널을 관리하는 경우(예: SDK가 제공하는 플레이어)에는 플레이어가 채널을 직접 붙잡아 둡니다. 플랫폼별 Linear TV 가이드를 따르세요.
- **채널 전환**: `changeChannelUrl`을 호출할 때마다 진행 중인 프리롤을 포함해 현재 세션을 먼저 중지한 뒤, 새 호출의 프리롤을 요청합니다. 새 채널의 프리롤을 재생하려면 그 채널의 `prerollAdTagUrl`을 전달하세요.
- **`onError` 이후 재시작**: 앱은 처음 호출을 `prerollAdTagUrl`까지 그대로 다시 호출합니다. 채널 변경이 없으면 프리롤을 생략하고, 광고가 없는 프리롤처럼 `onCompleted`를 발생시킵니다. `stop()`은 채널 변경으로 보지 않고, VOD 또는 인라인 광고를 요청하면 채널 변경으로 보므로 A → B → A나 A → VOD → A에서는 A의 프리롤이 다시 재생됩니다.
- **사용자가 앱을 떠난 경우**: 기본 설정에서 프리롤은 앱이 사용자가 앱을 떠났다고 알리면(`notifyUserLeftApp(true)`) 일시정지되고, 사용자가 돌아오면 재개됩니다. VOD 광고와 같은 방식입니다. 본 스트림 대체 광고는 계속 재생됩니다.

## Lifecycle

광고 이벤트 리스너를 등록하여 본 콘텐츠를 재생하면서 광고가 대체되는 모든 과정을 표현하는 순서도입니다.

```mermaid
flowchart TD
  A["FlowerAdView.FlowerAdsManager.addListener"]:::appCall
  B["FlowerAdView.FlowerAdsManager.changeChannelUrl"]:::appCall
  C["ContentPlayer.setMediaUrl"]:::appCall
  C2["ContentPlayer.play"]:::appCall
  D{"With prerollAdTagUrl?"}
  E["Playing Pre-roll AD ⭐"]
  H["FlowerAdsManagerListener.onPrepare"]:::sdkEvent
  H2["FlowerAdsManagerListener.onPlay"]:::sdkEvent
  H3["FlowerAdsManagerListener.onPrepare & onPlay & onCompleted"]:::sdkEvent
  J["FlowerAdsManagerListener.onCompleted"]:::sdkEvent
  F["Original Stream In Progress"]
  G["Ad Marker Occurrence"]
  G2["Prepare AD"]
  I["Manifest(Playlist) Manipulation"]
  K["ContentPlayer.stop"]:::appCall
  L["FlowerAdView.FlowerAdsManager.stop"]:::appCall

  A --> B --> C --> D
  D -- "Yes" --> E --> H3
  E --> C2
  D -- "No" --> C2 --> F
  F --> G --> G2 --> H
  G2 -- "Ad MediaSegment Started" --> I
  I --> H2
  I -- "All Ad MediaSegment Played" --> J
  C --> K --> L
  C2 --> K

  classDef appCall fill:#d0e8ff,stroke:#5b9bd5,color:#000
  classDef sdkEvent fill:#ffd0d0,stroke:#e06060,color:#000
```

> **범례**  
> <span style="background-color:#d0e8ff;padding:2px 8px;border:1px solid #5b9bd5"> </span>&nbsp;앱에서 호출하는 함수
> <span style="background-color:#ffd0d0;padding:2px 8px;border:1px solid #e06060"></span>&nbsp;SDK가 발생시키는 이벤트
> ⭐ 선택사항
