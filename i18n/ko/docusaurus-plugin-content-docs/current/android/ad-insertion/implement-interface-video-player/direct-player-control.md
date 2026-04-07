---
sidebar_position: 2
---

# 플레이어를 직접 제어하는 경우

플레이어를 직접 제어하거나 Flower SDK가 공식적으로 지원하지 않는 플레이어를 사용하는 경우, SDK가 제공하는 MediaPlayerAdapter 인터페이스를 구현하여 사용할 수 있습니다.

아래는 MediaPlayerAdapter 인터페이스 및 관련 데이터 구조에 대한 설명입니다.

## MediaPlayerAdapter 인터페이스 설명

### getCurrentMedia(): Media

현재 재생 중인 미디어의 URL, 전체 길이, 재생 경과 시간을 담고 있는 Media 객체를 반환합니다.

재생 경과 시간은 첫 번째 플레이리스트 응답의 처음부터 계산되어야 합니다. 플레이어가 항상 마지막 청크부터 재생하도록 설정된 경우, 재생 직후 초기값은 {첫 플레이리스트 길이 - 마지막 청크 길이}여야 합니다.

ExoPlayer를 사용한 구현 예시:

```kotlin
private val player: ExoPlayer
private var currentPlaylistUrl: String? = null
private var firstPeriodStartTimeMs = 0L

init {
    player.addListener(this)
}

override fun getCurrentMedia(): Media = runBlocking(Dispatchers.Main) {
    if (player.currentMediaItem == null) {
        return@runBlocking Media("", -1, -1)
    }

    val url = player.currentMediaItem!!.localConfiguration!!.uri.toString()
    val timeline = player.currentTimeline

    if (timeline.isEmpty) {
        return@runBlocking Media(url, -1, -1)
    }

    val window = Timeline.Window()
    timeline.getWindow(player.currentWindowIndex, window)

    val windowLoaded = window.durationMs != C.TIME_UNSET

    if (!windowLoaded) {
        return@runBlocking Media(url, -1, -1)
    }

    when (player.currentManifest) {
        is HlsManifest -> {
            val positionInFirstPeriodMs = window.positionInFirstPeriodMs

            Media(
                url,
                (positionInFirstPeriodMs + window.durationMs).toInt(),
                (positionInFirstPeriodMs + player.currentPosition).toInt(),
            )
        }
        is DashManifest -> {
            val positionInFirstPeriodMs = window.windowStartTimeMs - firstPeriodStartTimeMs

            val period = Timeline.Period()
            timeline.getPeriod(window.firstPeriodIndex, period)

            Media(
                url,
                (positionInFirstPeriodMs + window.durationMs).toInt(),
                (positionInFirstPeriodMs + player.currentPosition).toInt(),
            )
        }
        else -> Media(
            url,
            player.duration.toInt(),
            player.currentPosition.toInt(),
        )
    }
}

// Implementing Player.Listener
override fun onTimelineChanged(timeline: Timeline, reason: Int) {
    if (player.currentManifest !is DashManifest) {
        return
    }

    val playingUrl = player.currentMediaItem?.localConfiguration?.uri?.toString()

    if (playingUrl != null && currentPlaylistUrl != playingUrl) {
        player.removeListener(this)
        currentPlaylistUrl = playingUrl
        val timeline = player.currentTimeline
        val window = Timeline.Window().apply { timeline.getWindow(player.currentWindowIndex, this) }

        firstPeriodStartTimeMs = window.windowStartTimeMs - window.positionInFirstPeriodMs
    }
}
```

### getVolume(): Float

현재 오디오 볼륨 레벨을 반환합니다. 값의 범위는 0.0에서 1.0입니다.

ExoPlayer를 사용한 구현 예시:

```kotlin
private val player: ExoPlayer

override fun getVolume(): Float = runBlocking(Dispatchers.Main) {
    player.volume
}
```

### isPlaying(): Boolean

플레이어가 현재 재생 중인지 여부를 반환합니다.

ExoPlayer를 사용한 구현 예시:

```kotlin
private val player: ExoPlayer

override fun isPlaying(): Boolean = runBlocking(Dispatchers.Main) {
    player.isPlaying
}
```

### getHeight(): Int

현재 플레이어 뷰의 높이를 픽셀 단위로 반환합니다.
값을 알 수 없거나 사용할 수 없는 경우 0을 반환합니다.

ExoPlayer를 사용한 구현 예시:

```kotlin
private val player: ExoPlayer

override fun getHeight(): Int = runBlocking(Dispatchers.Main) {
    player.videoFormat?.height ?: 0
}
```

### pause()

플레이어를 일시정지합니다. 반환값은 없습니다.

ExoPlayer를 사용한 구현 예시:

```kotlin
private val player: ExoPlayer

override fun pause() {
    CoroutineScope(Dispatchers.Main).launch {
        if (player.isPlaying) {
            player.playWhenReady = false
        } else {
            player.pause()
        }
    }
}
```

### resume()

재생을 재개합니다. 반환값은 없습니다.

ExoPlayer를 사용한 구현 예시:

```kotlin
private val player: ExoPlayer

override fun resume() {
    CoroutineScope(Dispatchers.Main).launch {
        player.playWhenReady = true
    }
}
```

### enqueuePlayItem(playItem: PlayItem)

현재 항목이 끝나면 재생할 새로운 재생 항목을 큐에 추가합니다. 반환값은 없습니다.
리니어 TV에서 스킵 가능한 광고를 재생할 때 호출됩니다.

ExoPlayer를 사용한 구현 예시:

```kotlin
private val player: ExoPlayer

override fun enqueuePlayItem(playItem: PlayItem) {
    CoroutineScope(Dispatchers.Main).launch {
        val isPlaying = player.isPlaying

        player.addMediaItem(MediaItem.fromUri(playItem.url))

        if (isPlaying && !player.isPlaying) {
            player.playWhenReady = true
        }
    }
}
```

### removePlayItem(playItem: PlayItem)

큐에 있는 재생 항목을 제거합니다. 반환값은 없습니다.
리니어 TV에서 스킵 가능한 광고가 스킵되지 않고 끝까지 재생되었을 때 호출됩니다.

ExoPlayer를 사용한 구현 예시:

```kotlin
private val player: ExoPlayer

override fun removePlayItem(playItem: PlayItem) {
    CoroutineScope(Dispatchers.Main).launch {
        val mediaItems = Array(player.mediaItemCount) { index ->
            player.getMediaItemAt(index)
        }

        val targetIndex = mediaItems.indexOfFirst { it.localConfiguration?.uri.toString() == playItem.url }

        if (targetIndex != -1) {
            player.removeMediaItem(targetIndex)
        }
    }
}
```

### playNextItem()

큐의 다음 항목으로 건너뛰어 재생합니다. 반환값은 없습니다.
리니어 TV에서 스킵 가능한 광고를 스킵할 때 호출됩니다.

ExoPlayer를 사용한 구현 예시:

```kotlin
private val player: ExoPlayer
private var currentPlaylistUrl: String? = null
private var firstPeriodStartTimeMs = 0L

override fun playNextItem() {
    CoroutineScope(Dispatchers.Main).launch {
        // reset variables for getCurrentMedia()
        currentPlaylistUrl = null
        firstPeriodStartTimeMs = 0L
        player.addListener(this@ExoPlayerAdapter)
        player.seekToNext()
    }
}
```

### stop()

재생을 중지하고 리소스를 해제합니다. 반환값은 없습니다.

ExoPlayer를 사용한 구현 예시:

```kotlin
private val player: ExoPlayer

override fun stop() {
    CoroutineScope(Dispatchers.Main).launch {
        player.stop()
        player.clearMediaItems()
    }
}
```

### seekToPosition(absoluteStartTimeMs, relativeStartTimeMs, offsetMs, windowDurationMs, periodIndex)

사용 가능한 시간 값을 사용하여 지정된 위치로 이동합니다. SDK는 여러 시간 참조를 제공하므로 플레이어에서 사용 가능한 것을 사용합니다.

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| absoluteStartTimeMs | Double? | 절대 시간(밀리초) |
| relativeStartTimeMs | Double? | 첫 번째 윈도우로부터의 상대 시간(밀리초) |
| offsetMs | Double? | 현재 윈도우 내 오프셋(밀리초) |
| windowDurationMs | Double? | 현재 윈도우의 전체 길이(밀리초) |
| periodIndex | Int? | DASH MPD 실시간 스트림의 Period 인덱스 |

ExoPlayer를 사용한 구현 예시:

```kotlin
private val player: ExoPlayer

override fun seekToPosition(
    absoluteStartTimeMs: KotlinWrapped<Double>?,
    relativeStartTimeMs: KotlinWrapped<Double>?,
    offsetMs: KotlinWrapped<Double>?,
    windowDurationMs: KotlinWrapped<Double>?,
    periodIndex: Int?
) {
    CoroutineScope(Dispatchers.Main).launch {
        val targetMs = relativeStartTimeMs?.value?.toLong()
            ?: offsetMs?.value?.toLong()
            ?: absoluteStartTimeMs?.value?.toLong()
            ?: return@launch

        player.seekTo(player.currentMediaItemIndex, targetMs)
    }
}
```

### getCurrentAbsoluteTime(isPrintDetails): Double

현재 절대 재생 시간을 epoch 밀리초 단위로 반환합니다. 사용할 수 없는 경우 -1을 반환합니다.

| **매개변수** | **유형** | **설명** |
| ---| ---| --- |
| isPrintDetails | Boolean | 디버그 상세 정보를 출력할지 여부 |

ExoPlayer를 사용한 구현 예시:

```kotlin
private val player: ExoPlayer

override fun getCurrentAbsoluteTime(isPrintDetails: Boolean): KotlinWrapped<Double> =
    runBlocking(Dispatchers.Main) {
        val window = Timeline.Window()
        player.currentTimeline.getWindow(player.currentMediaItemIndex, window)

        val windowStartTimeMs = window.windowStartTimeMs
        val currentPositionMs = player.currentPosition

        KotlinWrapped(
            if (windowStartTimeMs != C.TIME_UNSET) {
                (windowStartTimeMs + currentPositionMs).toDouble()
            } else {
                -1.0
            }
        )
    }
```

### getPlayerType(): String?

플레이어 타입을 식별하는 문자열을 반환합니다. SDK 내부 분석에 사용됩니다. 해당되지 않는 경우 `null`을 반환합니다.

```kotlin
override fun getPlayerType(): String? {
    return "ExoPlayer"
}
```

### getPlayerVersion(): String?

플레이어 버전을 식별하는 문자열을 반환합니다. SDK 내부 분석에 사용됩니다. 해당되지 않는 경우 `null`을 반환합니다.

```kotlin
override fun getPlayerVersion(): String? {
    return null
}
```

## 보조 모델

MediaPlayerAdapter를 구현하는 데 필요한 모델들입니다.

### Media 클래스 설명

getCurrentMedia() 메소드에서 반환하는 미디어 정보 클래스입니다.

| **필드** | **유형** | **설명** |
| ---| ---| --- |
| urlOrId | String | 현재 재생 중인 스트림의 URL 또는 식별자. |
| duration | Long | 현재 재생 중인 스트림의 전체 길이.<br/>알 수 없거나 리니어 TV인 경우 -1 반환.<br/>단위: 밀리초. |
| position | Long | 초기 로드된 플레이리스트의 처음부터 계산된 재생 경과 시간.<br/>알 수 없는 경우 -1 반환.<br/>단위: 밀리초. |

### PlayItem 인터페이스 설명

enqueuePlayItem(playItem: PlayItem) 및 removePlayItem(playItem: PlayItem)에 전달되는 재생 항목 정보입니다.

| **필드** | **유형** | **설명** |
| ---| ---| --- |
| url | String | 다음 재생 항목의 URL. |
