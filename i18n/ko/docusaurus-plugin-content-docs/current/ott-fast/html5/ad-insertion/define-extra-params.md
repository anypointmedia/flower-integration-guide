---
sidebar_position: 6
sidebar_label: extraParams 정의
---

# extraParams 정의

Flower SDK를 사용하여 광고를 요청하는 시점에 추가적인 매개변수를 전달하면, SDK에서 가장 적합한 광고를 제공하는데 도움이 됩니다.

모바일 웹 앱의 경우 SDK 스스로 광고 제공 컨텍스트를 판단할 수 없으므로, 광고 요청 시 이러한 매개변수를 SDK에 반드시 전달해주어야 합니다.

실시간 방송의 경우 스트림 도중에 `extraParams`를 교체할 수 있습니다.

## List of Parameters

| **Key**<br/>(_Note: All keys marked with an asterisk (\*_) are required.) | **Value** | **Example** |
| ---| ---| --- |
| serviceId\* | 앱의 패키지 이름 | "tv.anypoint.service" |
| os\* | 앱이 실행되는 기기의 OS | "iOS" 또는 "Android" |
| adId\* | 앱이 실행되는 기기의 광고 식별자 | iOS: 애플의 IDFA 값<br/>Android: 구글의 GAID 값 |

| **Key (example)** | **Value (example)** |
| ---| --- |
| title | My Summer Vacation |
| genre | horror |
| contentRating | PG-13 |
