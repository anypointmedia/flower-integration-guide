---
sidebar_position: 11
---

# Using the SCTE-35 Decoder

If SCTE-35 packets are inserted into a linear channel stream, you can register and use the built-in decoder that parses those packets.

## Reference
*   [SCTE-35 Specification](https://drive.google.com/open?id=1hpfcNmSwjV5eKovxblChf3KRCi8G1a17) (SCTE-35 2019, 9.6 Splice Info Section)
*   [Program-specific information](https://en.wikipedia.org/wiki/Program-specific_information#Elementary_stream_types)

## Supported `SpliceInfoCommand` Types
*   `SpliceNull`
*   `SpliceInsert`
*   `SpliceSchedule`
*   `TimeSignal`

## Handling a Cancel Cue and End Cue
In `SpliceInsert` and `SpliceSchedule` commands, if the `spliceEventCancelIndicator` value is true, it's called a Cancel Cue. In this case, the currently playing ad is stopped. If the ad has already started playing, the Cancel Cue is ignored.

If the `outOfNetworkIndicator` value is false, it's called an End Cue. In this case, handle it as follows:
*   If `spliceImmediateFlag` is true or `splicePts` is earlier than `currentPts,` stop the currently playing ad immediately.
*   Otherwise, stop the currently playing ad at `splicePts`.

> **Players that process channel streams extract SCTE-35 packets by default. Therefore, you must continue processing the channel stream after ad playback starts and pass any detected SCTE-35 packets to the SDK.**

## Using the SCTE-35 Packet Decoder
Pass the SCTE-35 packets with a `stream_type` of `0x86` (as defined in the Program Map Table or PMT) to the SDK's built-in decoder.

Below are the examples:

**_Java_**

```java
AnypointAdView adView = (AnypointAdView) findViewById(R.id.adPlayerView);
Scte35Decoder scte35Decoder = adView.useScte35Decoder();
...
if (streamType == 0x86) {
    long currentPts = 0; // current PTS
    
    // When sending TS packets
    byte[] tsPackets = new byte[188]; 
    scte35Decoder.decode(tsPackets, currentPts);
    
    // When sending a hexadecimal string
    String hexText = “0x0834ab84…..”;
    scte35Decoder.decodeHex(hexText, currentPts);
    
    // When sending a Base64 string
    String base64Text = “MTM0dHF0aHJ0aA==....”;
    scte35Decoder.decodeBase64(base64Text, currentPts);
}
```

**_Kotlin_**

```kotlin
val adView = findViewById<AnypointAdView>(R.id.adPlayerView)
val scte35Decoder = adView.useScte35Decoder()
...
if (streamType == 0x86) {
    val currentPts: Long = 0 // current PTS
    
    // When sending TS packets
    val tsPackets = ByteArray(188)
    scte35Decoder.decode(tsPackets, currentPts)
    
    // When sending a hexadecimal string
    val hexText = "0x0834ab84....."
    scte35Decoder.decodeHex(hexText, currentPts)
    
    // When sending a Base64 string
    val base64Text = "MTM0dHF0aHJ0aA==...."
    scte35Decoder.decodeBase64(base64Text, currentPts)
}
```
