---
sidebar_position: 2
sidebar_label: 초기화 및 해제
---

# 초기화 및 해제

> Content Security Policy (CSP) 안내
> 웹사이트에서 `Content-Security-Policy (CSP) via HTTP headers` 또는 `<meta http-equiv="Content-Security-Policy">`를 적용하는 경우, 정책 설정에 [reds-tr.anypoint.tv](http://reds-tr.anypoint.tv/) 도메인을 명시적으로 허용해야 합니다. 이 도메인은 SDK의 정상적인 동작에 필요합니다.
> 예를 들어, 다음 지시문을 포함해야 할 수 있습니다:
> `img-src` [`reds-tr.anypoint.tv`](http://reds-tr.anypoint.tv)`;`

OTT 앱이 시작될 때 SDK의 초기화 함수를 호출해야 합니다. 이 때 동작 환경 정보를 아래와 같이 _local_, _dev_, _prod_ 중 하나로 설정합니다.
*   **_local_****:** 로컬 환경에서 개발할 때 사용 가능하며 기본 로그 레벨이 *Verbose*로 설정됩니다.
*   **_dev_****:** 개발 환경에서 사용 가능하고 SDK에서 발생하는 에러 로그가 서버로 수집됩니다. 기본 로그 레벨은 *Info*로 설정됩니다.
*   **_prod_****:** 상용 환경에서 사용 가능하고 SDK에서 발생하는 에러 로그가 서버로 수집됩니다. 기본 로그 레벨은 *Warn*으로 설정됩니다.
HTML5 환경에서는 해제 API를 호출할 필요가 없습니다.

**_Single HTML File_**

```xml
<html>
    <head>
        <!-- Flower SDK -->
        <script src="https://sdk.anypoint.tv/html5/flower-sdk-1.0.0.js"></script>
        ...
        <!-- Another library files -->
        <script src="https://.../.js"></script>
        <script type="text/javascript">
            // TODO GUIDE: initialize SDK
            FlowerSdk.setEnv("local")
            FlowerSdk.init()
        </script>
    </head>
    ...
</html>
```

**_React_**

```javascript
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// TODO GUIDE: initialize SDK
// env must be one of local, dev, prod
window.FlowerSdk.setEnv('local');
window.FlowerSdk.init();
// Log level must be one of Verbose, Debug, Info, Warn, Error, Off
window.FlowerSdk.setLogLevel('Verbose');
```
