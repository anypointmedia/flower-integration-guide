---
sidebar_position: 2
sidebar_label: 초기화 및 해제
---

# 초기화 및 해제

> Content Security Policy (CSP) 안내
> 웹사이트에서 `Content-Security-Policy (CSP) via HTTP headers` 또는 `<meta http-equiv="Content-Security-Policy">`를 적용하는 경우, 정책 설정에 아래 도메인들을 명시적으로 허용해야 합니다. 이 도메인들은 SDK의 정상적인 동작에 필요합니다.

| 지시문(Directive) | 도메인 | 용도 |
| --- | --- | --- |
| `img-src` | [`reds-tr.anypoint.tv`](http://reds-tr.anypoint.tv) | 광고 트래킹 및 리포팅 |
| `script-src` | `https://imasdk.googleapis.com` | Google PAL SDK(`pal.js`) 로딩 |

예를 들어, 다음 지시문을 포함해야 할 수 있습니다:

```text
img-src reds-tr.anypoint.tv;
script-src https://imasdk.googleapis.com;
```

**Google PAL SDK 관련 안내**

Flower SDK는 광고 요청에 필요한 nonce를 생성하기 위해 `https://imasdk.googleapis.com/pal/sdkloader/pal.js`에서 Google PAL(Programmatic Access Library) SDK를 로드합니다. `script-src`에 `imasdk.googleapis.com`이 허용되어 있지 않으면 아래와 같은 콘솔 에러가 발생하며 광고가 정상적으로 노출되지 않습니다:

```text
Loading the script 'https://imasdk.googleapis.com/pal/sdkloader/pal.js' violates the following Content Security Policy directive: "script-src 'self' ...". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback. The action has been blocked.
```

`script-src-elem`이 명시적으로 설정되지 않은 경우 `script-src`로 폴백되므로, `https://imasdk.googleapis.com`을 `script-src`(또는 `script-src-elem`을 정의하는 경우 해당 지시문)에 추가하면 이 에러가 해결됩니다.

OTT 앱이 시작될 때 SDK의 초기화 함수를 호출해야 합니다. 이 때 동작 환경 정보를 아래와 같이 _local_, _dev_, _prod_ 중 하나로 설정합니다.
*   **_local_:** 로컬 환경에서 개발할 때 사용 가능하며 기본 로그 레벨이 *Verbose*로 설정됩니다.
*   **_dev_:** 개발 환경에서 사용 가능하고 SDK에서 발생하는 에러 로그가 서버로 수집됩니다. 기본 로그 레벨은 *Info*로 설정됩니다.
*   **_prod_:** 상용 환경에서 사용 가능하고 SDK에서 발생하는 에러 로그가 서버로 수집됩니다. 기본 로그 레벨은 *Warn*으로 설정됩니다.
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
