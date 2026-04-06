---
sidebar_position: 1
---

# Declare the Ad UI

Before you can display ads, you need to add the AdView to your app's layout according to the position that suits the purpose.

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
