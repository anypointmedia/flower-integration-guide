---
sidebar_position: 3
---

# Custom Ad Player Examples

> While we generally don't recommend implementing your own custom ad player or `AnypointAdPlayer` class, this approach may be necessary in certain situations. For example, you might need a custom player if your TV app already has a built-in video player, if you need to optimize for specific hardware limitations, or if you want to create a unique user experience.

**_Java_**

```java
import android.content.Context;
import android.media.MediaPlayer;
import android.util.Log;
import android.view.SurfaceView;
import androidx.core.net.Uri;
import tv.anypoint.api.ads.AnypointAdPlayer;
import tv.anypoint.api.ads.AnypointAdPlayer.AdProgress;
import tv.anypoint.api.ads.AnypointAdPlayer.AnypointAdPlayerCallback;
import tv.anypoint.sdk.comm.PlaySet;

import java.util.ArrayList;
import java.util.List;

class CustomAdPlayer implements AnypointAdPlayer {
    private final Context context;
    private final List<PlaySet> playSets;
    private final List<AnypointAdPlayerCallback> callbacks;
    private final List<String> mediaUrls;
    private long adTotalDuration;
    private int currentPlayIndex;

    private final MediaPlayer mediaPlayer;

    public CustomAdPlayer(SurfaceView surfaceView) {
        this.context = surfaceView.getContext();
        this.playSets = new ArrayList<>();
        this.callbacks = new ArrayList<>();
        this.mediaUrls = new ArrayList<>();
        this.adTotalDuration = 0L;
        this.currentPlayIndex = -1;

        this.mediaPlayer = new MediaPlayer();
        mediaPlayer.setDisplay(surfaceView.getHolder());
        mediaPlayer.setOnCompletionListener(mp -> playNext());
    }

    private boolean playNext() {
        currentPlayIndex++;
        if (currentPlayIndex < mediaUrls.size()) {
            mediaPlayer.reset();
            mediaPlayer.setDataSource(context, Uri.parse(currentMediaUrl()));
            mediaPlayer.prepare();
            mediaPlayer.start();
            return true;
        }
        return false;
    }

    @Override
    public void load(PlaySet playSet) {
        playSets.clear();
        mediaUrls.clear();

        playSets.add(playSet);
        mediaUrls.addAll(playSet.toMediaUrls());
        adTotalDuration = playSet.getDuration();

        currentPlayIndex = -1;
        mediaPlayer.setDataSource(context, Uri.parse(playSet.firstUrl()));
        mediaPlayer.prepare();

        for (AnypointAdPlayerCallback callback : callbacks) {
            callback.onLoaded(playSet.firstUrl());
        }
    }

    @Override
    public void append(PlaySet playSet) {
        mediaUrls.addAll(playSet.toMediaUrls());
        playSets.add(playSet);
        adTotalDuration += playSet.getDuration();
    }

    @Override
    public void play() {
        currentPlayIndex++;
        mediaPlayer.start();
        for (AnypointAdPlayerCallback callback : callbacks) {
            callback.onPlay(currentMediaUrl());
        }
    }

    @Override
    public void pause() {
        mediaPlayer.pause();
        for (AnypointAdPlayerCallback callback : callbacks) {
            callback.onPause(currentMediaUrl());
        }
    }

    @Override
    public void resume() {
        mediaPlayer.start();
        for (AnypointAdPlayerCallback callback : callbacks) {
            callback.onResume(currentMediaUrl());
        }
    }

    @Override
    public void stop() {
        mediaPlayer.stop();
        for (AnypointAdPlayerCallback callback : callbacks) {
            callback.onStopped();
        }
    }

    @Override
    public void release() {
        mediaPlayer.release();
    }

    @Override
    public void addCallback(AnypointAdPlayerCallback callback) {
        if (!callbacks.contains(callback)) {
            callbacks.add(callback);
        }
    }

    @Override
    public void removeCallback(AnypointAdPlayerCallback callback) {
        callbacks.remove(callback);
    }

    @Override
    public AdProgress getProgress() {
        if (isAdPlaying()) {
            // Current PlaySet's playtime, total duration of PlaySet, current playback position within the playing media 
            long currentMediaPlayTime = mediaPlayer.getCurrentPosition();
            long totalPlayTime = playSets.stream()
                    .flatMap(playSet -> playSet.mediaUnits.stream())
                    .limit(currentPlayIndex + 1)
                    .mapToLong(unit -> unit.getDuration())
                    .sum() + currentMediaPlayTime;
            return new AdProgress(totalPlayTime, adTotalDuration, currentMediaPlayTime);
        } else {
            return AdProgress.NOT_READY;
        }
    }

    @Override
    public float getVolume() {
        return 1f;
    }

    @Override
    public String currentMediaUrl() {
        return mediaUrls.get(currentPlayIndex);
    }

    @Override
    public boolean isAdPlaying() {
        return mediaPlayer.isPlaying();
    }

    @Override
    public int getCurrentMediaUnitIndex() {
        return currentPlayIndex;
    }

    @Override
    public boolean skipAd() {
        mediaPlayer.stop();
        return playNext();
    }
}
```

**_Kotlin_**

```kotlin
import android.content.Context
import android.media.MediaPlayer
import android.util.Log
import android.view.SurfaceView
import androidx.core.net.toUri
import tv.anypoint.api.ads.AnypointAdPlayer
import tv.anypoint.api.ads.AnypointAdPlayer.AdProgress
import tv.anypoint.api.ads.AnypointAdPlayer.AnypointAdPlayerCallback
import tv.anypoint.sdk.comm.PlaySet

class CustomAdPlayer(surfaceView: SurfaceView) : AnypointAdPlayer {
    private val context: Context = surfaceView.context
    private val playSets: MutableList<PlaySet> = mutableListOf()
    private val callbacks: MutableList<AnypointAdPlayerCallback> = mutableListOf()
    private val mediaUrls: MutableList<String> = mutableListOf()
    private var adTotalDuration: Long = 0L
    private var currentPlayIndex = -1

    private val player: MediaPlayer = MediaPlayer()

    init {
        player.setDisplay(surfaceView.holder)
        player.setOnCompletionListener {
            playNext()
        }
    }

    private fun playNext() : Boolean {
        currentPlayIndex++
        if (currentPlayIndex < mediaUrls.size) {
            player.reset()
            player.setDataSource(context, currentMediaUrl().toUri())
            player.prepare()
            player.start()
            return true
        }
        return false
    }

    override fun load(playSet: PlaySet) {
        playSets.clear()
        mediaUrls.clear()

        playSets.add(playSet)
        mediaUrls.addAll(playSet.toMediaUrls())
        adTotalDuration = playSet.duration

        currentPlayIndex = -1
        player.setDataSource(context, playSet.firstUrl().toUri())
        player.prepare()

        callbacks.forEach { it.onLoaded(playSet.firstUrl()) }
    }

    override fun append(playSet: PlaySet) {
        mediaUrls.addAll(playSet.toMediaUrls())
        playSets.add(playSet)
        adTotalDuration += playSet.duration
    }

    override fun play() {
        currentPlayIndex++
        player.start()
        callbacks.forEach { it.onPlay(currentMediaUrl()) }
    }

    override fun pause() {
        player.pause()
        callbacks.forEach { it.onPause(currentMediaUrl())}
    }

    override fun resume() {
        player.start()
        callbacks.forEach { it.onResume(currentMediaUrl()) }
    }

    override fun stop() {
        player.stop()
        callbacks.forEach { it.onStopped() }
    }

    override fun release() {
        player.release()
    }

    override fun addCallback(callback: AnypointAdPlayerCallback) {
        if (!callbacks.contains(callback))
            callbacks.add(callback)
    }

    override fun removeCallback(callback: AnypointAdPlayerCallback) {
        callbacks.remove(callback)
    }

    override fun getProgress(): AdProgress {
        return if (isAdPlaying) {
            // Current PlaySet's playtime, total duration of PlaySet, current playback position within the playing media
            val currentMediaPlayTime = player.timestamp!!.anchorMediaTimeUs
            val totalPlayTime = playSets.flatMap { playSet -> playSet.mediaUnits }.slice(0..currentPlayIndex).sumOf { unit->unit.duration } + currentMediaPlayTime
            AdProgress(totalPlayTime, adTotalDuration, currentMediaPlayTime)
        } else {
            AdProgress.NOT_READY
        }
    }

    override fun getVolume(): Float {
        return 1f
    }

    override fun currentMediaUrl(): String {
        return mediaUrls[currentPlayIndex]
    }

    override fun isAdPlaying(): Boolean {
        return player.isPlaying
    }

    override fun getCurrentMediaUnitIndex(): Int {
        return currentPlayIndex
    }

    override fun skipAd(): Boolean {
        player.stop()
        return playNext()
    }
}
```
