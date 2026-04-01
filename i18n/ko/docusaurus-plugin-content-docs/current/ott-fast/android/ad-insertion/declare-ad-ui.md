---
sidebar_position: 1
---

# 광고 UI 선언

광고를 표시하려면 목적에 맞는 위치에 AdView를 앱의 레이아웃에 추가해야 합니다.

## _PlaybackActivity.xml_
```plain
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout
       xmlns:android="http://schemas.android.com/apk/res/android"
       xmlns:tools="http://schemas.android.com/tools"
       android:layout_width="match_parent"
       android:layout_height="match_parent">

    ...

    <!-- Video player view -->
    <YourPlayerView
            android:id="@+id/playerView"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
    />
    <tv.anypoint.flower.android.sdk.api.FlowerAdView
            android:id="@+id/flowerAdView"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:visibility="gone"
    />

    ...

</RelativeLayout>
```

## _Java_
```java
public class PlaybackActivity extends Activity {
    private FlowerAdView flowerAdView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // TODO GUIDE: Create FlowerAdView instance
        flowerAdView = (FlowerAdView) findViewById(R.id.flowerAdView);
    }
}
```

## _Kotlin_
```kotlin
class PlaybackActivity : Activity() {
    private lateinit var flowerAdView: FlowerAdView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);

        // TODO GUIDE: Create FlowerAdView instance
        flowerAdView = findViewById(R.id.flowerAdView)
    }
}
```
