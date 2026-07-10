---
sidebar_position: 2
---

# Initialization and Release

> Content Security Policy (CSP) Notice  
> If your website enforces a `Content-Security-Policy (CSP) via HTTP headers` or `<meta http-equiv="Content-Security-Policy">` , you must explicitly allow the following domains in your policy configuration. These domains are required for proper SDK operation.

| Directive | Domain | Purpose |
| --- | --- | --- |
| `img-src` | [`reds-tr.anypoint.tv`](http://reds-tr.anypoint.tv) | Ad tracking and reporting |
| `script-src` | `https://imasdk.googleapis.com` | Google PAL SDK (`pal.js`) loading |

For example, you may need to include the following directives:

```text
img-src reds-tr.anypoint.tv;
script-src https://imasdk.googleapis.com;
```

**About the Google PAL SDK requirement**

The Flower SDK loads the Google PAL (Programmatic Access Library) SDK from `https://imasdk.googleapis.com/pal/sdkloader/pal.js` to generate the nonce required for ad requests. If `imasdk.googleapis.com` is not allowed under `script-src`, you will see a console error like the following and ads will not be served correctly:

```text
Loading the script 'https://imasdk.googleapis.com/pal/sdkloader/pal.js' violates the following Content Security Policy directive: "script-src 'self' ...". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback. The action has been blocked.
```

Because `script-src-elem` falls back to `script-src` when `script-src-elem` is not explicitly set, adding `https://imasdk.googleapis.com` to `script-src` (or to `script-src-elem` if you define it) resolves this error.

Before using any features of the SDK, you must initialize it in your OTT app's startup process. Set the operating environment mode to either _local_, _dev_, or _prod_ as described below.
*   **_local_:** This mode can be used in a local environment and the default log level is _Verbose_.
*   **_dev_:** This mode can be used in a development environment and in this mode, the error log that is generated in the SDK is saved in the server. The default log level is _Info_.
*   **_prod_:** This mode can be used in a commercial environment and in this mode, the error log that is generated in the SDK is saved in the server. The default log level is _Warn_.
In HTML5 environments, you do not need to explicitly call a release function when your OTT app terminates.

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
