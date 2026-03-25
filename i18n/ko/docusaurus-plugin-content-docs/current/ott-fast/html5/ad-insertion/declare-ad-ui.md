---
sidebar_position: 1
sidebar_label: 광고 UI 선언
---

# 광고 UI 선언

광고를 삽입하려는 곳에는 목적에 맞는 위치에 따라 광고 UI 뷰를 추가해야 합니다.

**_Single HTML File_**

```xml
<div id="video-container" style="position: relative;">
    <video id="video-element" style="position: absolute; top: 0px; right: 0px; bottom: 0px; left: 0px;"></video>
    <div id="ad-container" style="position: absolute; top: 0px; right: 0px; bottom: 0px; left: 0px; display: none;"></div>
</div>
<script>
    // TODO GUIDE: Create FlowerAdView instance
    const flowerAdView = new FlowerAdView(document.getElementById('ad-container'))
</script>
```

**_React_**

```javascript
const adContainerRef = useRef(null);
const flowerAdViewRef = useRef(null);

useEffect(() => {
    if (!adContainerRef.current) return;

    flowerAdViewRef.current = new window.FlowerAdView(adContainerRef.current);
}, [ adContainerRef ]);

return (
    <div ref={playerContainerRef} style={{ position: 'relative' }}>
        <video style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}></video>
        <div ref={adContainerRef} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'none' }}></div>
    </div>
);
```
