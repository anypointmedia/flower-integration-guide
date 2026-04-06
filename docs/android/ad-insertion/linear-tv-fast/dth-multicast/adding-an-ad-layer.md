---
sidebar_position: 5
---

# Adding an Ad Layer

As shown in **SDK Architecture > Video Layer Arrangement**, add `tv.anypoint.api.ads.AnypointAdView` between the real-time broadcast layer and the TV UI layer.

Below are code examples demonstrating how to add it using XML and how to add it dynamically in code.

**_XML_**

```xml
// YourActivity.xml

...
<tv.anypoint.api.ads.AnypointAdView
      android:id="@+id/linearTvAdView"
      android:layout_width="match_parent"
      android:layout_height="match_parent"
/>
...
```

**_Java_**

```java
import tv.anypoint.api.ads.AnypointAdView;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        RelativeLayout rootLayout = findViewById(R.id.rootLayout);

        AnypointAdView adView = new AnypointAdView(this);
        adView.setId(View.generateViewId());

        RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT
        );
        adView.setLayoutParams(layoutParams);

        rootLayout.addView(adView);
    }
}
```

**_Kotlin_**

```kotlin
import tv.anypoint.api.ads.AnypointAdView

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val rootLayout = findViewById<RelativeLayout>(R.id.rootLayout)

        val adView = AnypointAdView(this).apply {
            id = View.generateViewId()
            layoutParams = RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT
            )
        }

        rootLayout.addView(adView)
    }
}
```
