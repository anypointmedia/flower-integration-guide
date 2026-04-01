---
sidebar_position: 5
---

# AdInfo

Flower 이벤트에서 응답되는 광고 메타데이터 인터페이스입니다.

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| id | string? | VAST 응답에 지정된 광고 ID |
| duration | number | 광고 재생 시간(밀리초) |
| isSkippable | boolean | 광고 건너뛰기 가능 여부 |
| mediaUrl | string | 재생할 광고 크리에이티브 URL |
| extensions | `Map<string, string>` | 각 원본 {`<Ad />`} 요소의 파싱된 VAST 확장 |

## 관련 API

*   [FlowerAdsManagerListener](flower-ads-manager-listener)
