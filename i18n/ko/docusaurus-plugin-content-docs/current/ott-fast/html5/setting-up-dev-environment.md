---
sidebar_position: 1
sidebar_label: 개발 환경 설정
---

# 개발 환경 설정

## Browser/Smart TV Support
Flower SDK는 아래의 브라우저 및 스마트 TV OS를 지원합니다.

| **Chrome** | **Firefox** | **Edge** | **Safari** | **webOS TV** | **Tizen OS TV** |
| ---| ---| ---| ---| ---| --- |
| \>=87 | \>=78 | \>=88 | \>=13 | \>=23 | \>=7.0 |

## 라이브러리 파일 로드
아래와 같이 Flower SDK 파일을 HTML에서 불러오도록 설정합니다. Flower SDK를 다른 어떤 라이브러리 파일보다 먼저 불러와야 합니다.

```xml
<html>
  <head>
    <!-- Flower SDK -->
    <script src="https://sdk.anypoint.tv/html5/flower-sdk-X.X.X.js"></script>
    ...
    <!-- Another library files -->
    <script src="https://.../.js"></script>
  </head>
  ...
</html>
```
