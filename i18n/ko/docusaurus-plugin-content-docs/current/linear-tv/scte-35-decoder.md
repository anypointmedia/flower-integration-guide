---
sidebar_position: 6
---

# SCTE-35 디코더 사용

실시간 채널 스트림에 SCTE-35 패킷이 삽입되는 경우, 해당 패킷을 파싱하는 내장된 디코더를 등록하여 사용할 수 있습니다.

## 참고
*   [SCTE-35 Specification](https://drive.google.com/open?id=1hpfcNmSwjV5eKovxblChf3KRCi8G1a17) (SCTE-35 2019, 9.6 Splice Info Section)
*   [Program-specific information](https://en.wikipedia.org/wiki/Program-specific_information#Elementary_stream_types)

## 지원되는 `SpliceInfoCommand` 유형
*   `SpliceNull`
*   `SpliceInsert`
*   `SpliceSchedule`
*   `TimeSignal`

## Cancel Cue 및 End Cue 처리
`SpliceInsert` 및 `SpliceSchedule`에서 `spliceEventCancelIndicator` 값이 true인 경우를 Cancel Cue라고 하며, 이 경우 재생 대기 중인 광고를 종료 처리합니다. 광고 재생이 이미 시작된 경우에는 Cancel Cue가 무시됩니다.

`outOfNetworkIndicator` 값이 false인 경우를 End Cue라고 하며, 이 경우 아래와 같이 처리하면 됩니다.
*   `spliceImmediateFlag`가 true이거나 `splicePts`가 `currentPts`보다 작은 경우, 재생 중인 광고를 즉시 종료합니다.
*   이외의 경우, 재생 중인 광고를 `splicePts` 시점에 종료합니다.

> **기본적으로 채널 스트림을 처리하는 플레이어가 SCTE-35 패킷을 추출하므로, 광고 재생이 시작된 후에도 채널 스트림을 계속 처리하면서 감지되는 SCTE-35 패킷을 SDK로 전달해야 합니다.**

## SCTE-35 패킷 디코더 사용
PMT(Program Map Table)의 `stream_type`이 `0x86`인 SCTE-35 패킷을 SDK에 내장된 디코더에 전달합니다.

코드 예시는 다음과 같습니다.

**_Java_**

```java
AnypointAdView adView = (AnypointAdView) findViewById(R.id.adPlayerView);
Scte35Decoder scte35Decoder = adView.useScte35Decoder();
...
if (streamType == 0x86) {
    long currentPts = 0; // 현재 PTS

    // TS 패킷을 보내는 경우
    byte[] tsPackets = new byte[188];
    scte35Decoder.decode(tsPackets, currentPts);

    // Hexadecimal 문자열로 변환해서 보내는 경우
    String hexText = "0x0834ab84…..";
    scte35Decoder.decodeHex(hexText, currentPts);

    // Base64 문자열로 변환해서 보내는 경우
    String base64Text = "MTM0dHF0aHJ0aA==....";
    scte35Decoder.decodeBase64(base64Text, currentPts);
}
```

**_Kotlin_**

```kotlin
val adView = findViewById<AnypointAdView>(R.id.adPlayerView)
val scte35Decoder = adView.useScte35Decoder()
...
if (streamType == 0x86) {
    val currentPts: Long = 0 // 현재 PTS

    // TS 패킷을 보내는 경우
    val tsPackets = ByteArray(188)
    scte35Decoder.decode(tsPackets, currentPts)

    // Hexadecimal 문자열로 변환해서 보내는 경우
    val hexText = "0x0834ab84....."
    scte35Decoder.decodeHex(hexText, currentPts)

    // Base64 문자열로 변환해서 보내는 경우
    val base64Text = "MTM0dHF0aHJ0aA==...."
    scte35Decoder.decodeBase64(base64Text, currentPts)
}
```
