---
sidebar_position: 1
---

# Setting up Development Environment

## Browser/Smart TV Support
The Flower SDK supports the following browsers and smart TV operating systems:

| **Chrome** | **Firefox** | **Edge** | **Safari** | **webOS TV** | **Tizen OS TV** |
| ---| ---| ---| ---| ---| --- |
| \>=87 | \>=78 | \>=88 | \>=13 | \>=23 | \>=7.0 |

## Loading Library Files
Set up the Flower SDK file to be loaded from HTML as shown below. The Flower SDK must be loaded _before_ any other library files.

```xml
<html>
  <head>
    <!-- Flower SDK -->
    <script src="https://sdk.anypoint.tv/html5/flower-sdk-X.X.X.js"></script>
    ...
    <!-- Another library files -->
    <script src="https://.../.js"></script>
  </head>
  ...
</html>
```
