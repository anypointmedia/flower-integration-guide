---
sidebar_position: 6
---

# FlowerMedia3ExoPlayer

Media3 ExoPlayer를 확장한 Flower 플레이어 클래스입니다.

## 메소드

### addAdListener

플레이어에 광고 이벤트 리스너를 추가합니다. 이미 등록된 리스너인 경우 아무 동작도 하지 않습니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| listener | FlowerAdsManagerListener | 추가할 광고 이벤트 리스너 |

### removeAdListener

플레이어에서 광고 이벤트 리스너를 제거합니다. 등록되지 않은 리스너인 경우 아무 동작도 하지 않습니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| listener | FlowerAdsManagerListener | 제거할 광고 이벤트 리스너 |

### setMediaItem

FlowerAdConfig 매개변수를 추가하여 기본 클래스의 메소드를 오버로드합니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| mediaItem | MediaItem | 기본 클래스의 원본 매개변수 |
| adConfig | FlowerAdConfig | 광고 삽입에 필요한 정보 |

### setMediaItem

FlowerAdConfig 매개변수를 추가하여 기본 클래스의 메소드를 오버로드합니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| mediaItem | MediaItem | 기본 클래스의 원본 매개변수 |
| resetPosition | Boolean | 기본 클래스의 원본 매개변수 |
| adConfig | FlowerAdConfig | 광고 삽입에 필요한 정보 |

### setMediaItem

FlowerAdConfig 매개변수를 추가하여 기본 클래스의 메소드를 오버로드합니다.

매개변수는 아래와 같습니다:

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| mediaItem | MediaItem | 기본 클래스의 원본 매개변수 |
| startPositionMs | Long | 기본 클래스의 원본 매개변수 |
| adConfig | FlowerAdConfig | 광고 삽입에 필요한 정보 |

## 관련 API

*   [FlowerAdConfig](flower-ad-config)
