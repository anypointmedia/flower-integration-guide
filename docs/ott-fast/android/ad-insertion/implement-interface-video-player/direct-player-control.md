---
sidebar_position: 2
---

# In Case of Direct Player Control

If you want to directly control the player or use a player that is not officially supported by the Flower SDK, you can implement the MediaPlayerAdapter interface provided by the SDK.

Below is a description of the MediaPlayerAdapter interface and the related data structures.

## MediaPlayerAdapter Interface Description

### getCurrentMedia(): Media

Returns a Media object containing the URL of the currently playing media, its total duration, and the amount of playback elapsed.

Playback elapsed time must be calculated from the very first playlist response. If the player is configured to always start from the last chunk, the initial value should be {first playlist length - last chunk length} immediately after playback begins.

Example implementation using ExoPlayer:

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

Returns the current audio volume level. The value ranges from 0.0 to 1.0.

Example implementation using ExoPlayer:

```kotlin
private val player: ExoPlayer

override fun getVolume(): Float = runBlocking(Dispatchers.Main) {
    player.volume
}
```

### isPlaying(): Boolean

Returns whether the player is currently playing.

Example implementation using ExoPlayer:

```kotlin
private val player: ExoPlayer

override fun isPlaying(): Boolean = runBlocking(Dispatchers.Main) {
    player.isPlaying
}
```

### getHeight(): Int

Returns the height of the current player view in pixels.
Returns 0 if the value is unknown or unavailable.

Example implementation using ExoPlayer:

```kotlin
private val player: ExoPlayer

override fun getHeight(): Int = runBlocking(Dispatchers.Main) {
    player.videoFormat?.height ?: 0
}
```

### pause()

Pauses the player. No return value.

Example implementation using ExoPlayer:

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

Resumes playback. No return value.

Example implementation using ExoPlayer:

```kotlin
private val player: ExoPlayer

override fun resume() {
    CoroutineScope(Dispatchers.Main).launch {
        player.playWhenReady = true
    }
}
```

### enqueuePlayItem(playItem: PlayItem)

Queues a new play item to be played once the current item finishes. No return value.
Called when a skippable ad is played in Linear TV.

Example implementation using ExoPlayer:

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

Removes a queued play item. No return value.
Called when a skippable ad in Linear TV finishes without being skipped.

Example implementation using ExoPlayer:

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

Skips to and plays the next queued item. No return value.
Called when a skippable ad is skipped in Linear TV.

Example implementation using ExoPlayer:

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

Stops the playback and releases resources. No return value.

Example implementation using ExoPlayer:

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

Seeks to the specified position using available time values. The SDK provides multiple time references — use whichever is available for your player.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| absoluteStartTimeMs | Double? | Absolute time in milliseconds |
| relativeStartTimeMs | Double? | Relative time from the first window in milliseconds |
| offsetMs | Double? | Offset within the current window in milliseconds |
| windowDurationMs | Double? | Total length of the current window in milliseconds |
| periodIndex | Int? | Period index for DASH MPD live streams |

Example implementation using ExoPlayer:

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

Returns the current absolute playback time in epoch milliseconds. Returns -1 if unavailable.

| **Parameter** | **Type** | **Description** |
| ---| ---| --- |
| isPrintDetails | Boolean | Whether to print debug details |

Example implementation using ExoPlayer:

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

Returns a string identifying the player type. Used for SDK internal analytics. Return `null` if not applicable.

```kotlin
override fun getPlayerType(): String? {
    return "ExoPlayer"
}
```

### getPlayerVersion(): String?

Returns a string identifying the player version. Used for SDK internal analytics. Return `null` if not applicable.

```kotlin
override fun getPlayerVersion(): String? {
    return null
}
```

## Supporting Models

The following models are required when implementing MediaPlayerAdapter.

### Media Class Description

Represents media information returned by the getCurrentMedia() method.

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| urlOrId | String | URL or identifier of the currently playing stream. |
| duration | Long | Total duration of the currently playing stream.<br/>Returns -1 if unknown or if the stream is Linear TV.<br/>Unit: milliseconds. |
| position | Long | Elapsed playback time calculated from the beginning of the initially loaded playlist.<br/>Returns -1 if unknown.<br/>Unit: milliseconds. |

### PlayItem Interface Description

Represents a play item passed to enqueuePlayItem(playItem: PlayItem) and removePlayItem(playItem: PlayItem).

| **Field** | **Type** | **Description** |
| ---| ---| --- |
| url | String | URL of the next play item. |
