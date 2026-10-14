---
sidebar_position: 4
---

# FlowerAdConfig

Flower Player 클래스에서 사용하는 광고 설정 클래스입니다.

## FlowerLinearTvAdConfig

실시간 방송의 광고 삽입에 필요한 정보를 지정하는 클래스입니다.

### constructor

생성자 매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | String | Flower 백엔드 시스템에서 발급된 광고 태그 URL<br/>adTagUrl을 받으려면 Anypoint Media에 요청해야 합니다. |
| prerollAdTagUrl | String? | (Optional) Flower 백엔드 시스템에서 발급된 프리롤 광고 태그 URL<br/>prerollAdTagUrl을 받으려면 Anypoint Media에 요청해야 합니다. |
| channelId | String | 고유 채널 ID<br/>Flower 백엔드 시스템에 등록되어야 합니다. |
| extraParams | Map<String, String> | (Optional) 타겟팅을 위해 사전 협의된 추가 정보 |
| adTagHeaders | Map<String, String> | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
| channelStreamHeaders | Map<String, String> | (Optional) 원본 스트림 요청 시 추가할 HTTP 헤더 정보 |

## FlowerVodAdConfig

VOD 콘텐츠의 광고 삽입에 필요한 정보를 지정하는 클래스입니다.

### constructor

생성자 매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| adTagUrl | String | Flower 백엔드 시스템에서 발급된 광고 태그 URL<br/>adTagUrl을 받으려면 Anypoint Media에 요청해야 합니다. |
| contentId | String | 고유 콘텐츠 ID<br/>Flower 백엔드 시스템에 등록되어야 합니다. |
| contentDuration | Long | VOD 콘텐츠의 재생 시간(밀리초) |
| requestTimeout | Long | (Optional) VOD 광고 요청 시 최소 타임아웃 시간(밀리초)<br/>기본값은 5000입니다. |
| minPrepareDuration | Long | (Optional) 광고 준비를 위한 사전 시간(밀리초). Mid-roll 광고는 Mid-roll 위치보다 `requestTimeout + minPrepareDuration`만큼 먼저 요청되며, `onPrepare`는 본편이 해당 위치에 도달했을 때 호출됩니다.<br/>기본값은 5000입니다. |
| rewindDuration | Long | (Optional) Mid-roll 광고 구간 종료 시 콘텐츠를 되감는 시간(밀리초). 본편은 중단된 위치보다 이 시간만큼 앞에서 재개됩니다. 되감기로 인해 같은 Mid-roll이 다시 재생되지는 않습니다.<br/>기본값은 5000입니다. |
| extraParams | Map<String, String> | (Optional) 타겟팅을 위해 사전 협의된 추가 정보 |
| adTagHeaders | Map<String, String> | (Optional) 광고 요청 시 추가할 HTTP 헤더 정보 |
