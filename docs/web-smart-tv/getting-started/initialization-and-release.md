---
sidebar_position: 2
---

# Initialization and Release

> Content Security Policy (CSP) Notice  
> If your website enforces a `Content-Security-Policy (CSP) via HTTP headers` or `<meta http-equiv="Content-Security-Policy">` , you must explicitly allow the domain [reds-tr.anypoint.tv](http://reds-tr.anypoint.tv/) in your policy configuration. This domain is required for proper SDK operation.  
> For example, you may need to include the following directive:  
> `img-src` [`reds-tr.anypoint.tv`](http://reds-tr.anypoint.tv)`;`

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
