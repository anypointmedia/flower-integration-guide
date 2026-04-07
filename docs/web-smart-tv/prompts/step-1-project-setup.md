---
sidebar_position: 1
---

# Step 1: Project Setup & SDK Initialization

This prompt guides LLM to set up Flower SDK loading and initialization in an HTML5/Web project.

**Before using:** Replace `{{SDK_VERSION}}` with the actual SDK version.

```plain
We are integrating the FLOWER SDK into our HTML5/Web project.

========================================
STEP 1 — Load the SDK
========================================

The Flower SDK must be loaded BEFORE any other library files.

Single HTML File:

<html>
  <head>
    <!-- Flower SDK — must be loaded first -->
    <script src="https://sdk.anypoint.tv/html5/flower-sdk-{{SDK_VERSION}}.js"></script>
    <!-- Other library files (hls.js, dash.js, Bitmovin, etc.) -->
    <script src="https://cdn.jsdelivr.net/npm/hls.js"></script>
  </head>
  ...
</html>

React (if SDK is loaded via script tag in public/index.html):

// Access via window global
window.FlowerSdk.setEnv('local');
window.FlowerSdk.init();

========================================
STEP 2 — Initialize SDK
========================================

Environment modes:
- "local": Local environment, default log level Verbose
- "dev": Development environment, error logs saved to server, default log level Info
- "prod": Production environment, error logs saved to server, default log level Warn

Single HTML:

<script type="text/javascript">
    FlowerSdk.setEnv("local");  // Change to "dev" or "prod" as appropriate
    FlowerSdk.init();
    FlowerSdk.setLogLevel("Verbose");  // Optional: Verbose, Debug, Info, Warn, Error, Off
</script>

React:

window.FlowerSdk.setEnv('local');
window.FlowerSdk.init();
window.FlowerSdk.setLogLevel('Verbose');

========================================
STEP 3 — Content Security Policy (if applicable)
========================================

If your website enforces CSP via HTTP headers or <meta> tag,
you must allow the following domain:

  img-src reds-tr.anypoint.tv;

========================================
CONSTRAINTS
========================================

- HTML5 SDK does NOT require an explicit release/destroy call.
- The SDK script must be loaded before any player library scripts.
- In React, access SDK via window.FlowerSdk (not import).

Supported browsers/platforms:
- Chrome >= 87, Firefox >= 78, Edge >= 88, Safari >= 13
- webOS TV >= 23, Tizen OS TV >= 7.0
```
