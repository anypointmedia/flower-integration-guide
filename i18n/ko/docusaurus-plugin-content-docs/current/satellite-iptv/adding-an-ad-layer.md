---
sidebar_position: 5
---

# 광고 레이어 추가

**[설계](./design#비디오-레이어의-구조)** 페이지의 비디오 레이어 구조를 참고하여 실시간 방송 레이어와 TV UI 레이어 사이에 `tv.anypoint.api.ads.AnypointAdView`를 추가합니다.

XML을 사용하는 방법과 코드에서 동적으로 추가하는 방법의 코드 예시입니다.

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
