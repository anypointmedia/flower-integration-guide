# FLOWER Integration Guide

FLOWER SDK integration documentation for Linear TV and OTT/FAST platforms, built with [Docusaurus](https://docusaurus.io/).

## Prerequisites

- Node.js >= 20.0

## Local Development

```bash
npm install
npm start
```

Opens a local dev server at `http://localhost:3000/flower-integration-guide/`. Changes are reflected live.

## Build

```bash
npm run build
```

Generates static files in the `build` directory.

## Preview Build

```bash
npm run serve
```

Serves the production build locally for testing.

## Project Structure

```
docs/
├── intro.mdx                  # Landing page
├── linear-tv/                 # For Linear TV (Multicast, DTH)
│   ├── sdk-architecture.md
│   ├── project-settings.md
│   ├── preparing-to-use/
│   ├── inserting-ads/
│   ├── scte-35-decoder.md
│   ├── ad-player/
│   ├── how-to-test.md
│   └── release-notes/
└── ott-fast/                  # For OTT/FAST
    ├── supported-content-types.md
    ├── sdk-architecture.md
    ├── android/
    ├── ios/
    ├── html5/
    └── release-notes/
```
