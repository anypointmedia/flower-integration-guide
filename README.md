# FLOWER Integration Guide

FLOWER SDK integration documentation for Android, Web/Smart TV, and iOS platforms, built with [Docusaurus](https://docusaurus.io/).

**Live site:** https://flower-docs.anypoint.tv

## Prerequisites

- Node.js >= 24.0

## Local Development

```bash
npm install
npm start
```

Opens a local dev server at `http://localhost:3000/`. Changes are reflected live.

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

## Deployment

Automated via GitHub Actions. Pushing to `main` triggers the deploy workflow (`.github/workflows/deploy.yml`):

1. Installs dependencies and builds the site
2. Deploys to GitHub Pages
3. Served at https://flower-docs.anypoint.tv (custom domain via `static/CNAME`)

## Internationalization (i18n)

Korean translation is available under `i18n/ko/`. To start the dev server in Korean:

```bash
npm start -- --locale ko
```

Translation files:
- `i18n/ko/docusaurus-plugin-content-docs/current/` — translated docs (mirrors `docs/` structure)
- `i18n/ko/docusaurus-theme-classic/` — UI strings (navbar, footer)
- `i18n/ko/code.json` — custom component strings

## Validation & Testing

### Prompt Validation

```bash
npm run validate
```

Runs three validators in sequence:
- **validate-prompts** — placeholder consistency, step/integrated cross-reference, documentation coverage
- **validate-api-contract** — class/method references against `api-contract.json`, cross-platform leakage detection
- **validate-code-blocks** — brace balance, import usage, SDK method signature checks (per-platform)

### Branch Testing (LLM)

```bash
npm run test:branches:dry   # dry-run: check placeholder filling only
npm run test:branches        # full: sends prompts to claude CLI, validates output patterns
```

Fills each prompt template with parameter combinations from `test-matrix.json`, calls `claude -p`, and validates that expected patterns appear and forbidden patterns are absent.

Supports filtering by platform:

```bash
node scripts/run-branch-tests.mjs --platform ott-android
```

## Project Structure

```
docs/
├── intro.mdx                        # Landing page
├── sdk-architecture.md              # SDK architecture overview
├── supported-content-types.md       # Supported content types
├── android/                         # Android platform
│   ├── getting-started/             # Dev environment, initialization, logging, PiP
│   ├── ad-insertion/                # Ad integration guides
│   │   ├── linear-tv-fast/          # DTH/Multicast & Unicast
│   │   ├── vod/                     # VOD ad implementation
│   │   └── advanced-ad-formats/     # Inline ads, etc.
│   ├── api/                         # API reference
│   ├── prompts/                     # LLM-assisted integration prompts
│   │   ├── linear-tv/
│   │   └── vod/
│   └── release-notes/
├── ios/                             # iOS platform
│   ├── getting-started/
│   ├── ad-insertion/
│   │   ├── linear-tv-fast/
│   │   ├── vod/
│   │   └── advanced-ad-formats/
│   ├── api/
│   ├── prompts/
│   └── release-notes/
└── web-smart-tv/                    # Web / Smart TV platform (Tizen, webOS, etc.)
    ├── getting-started/
    ├── ad-insertion/
    │   ├── linear-tv-fast/
    │   ├── vod/
    │   └── advanced-ad-formats/
    ├── api/
    ├── prompts/
    └── release-notes/

i18n/ko/                             # Korean translation
├── code.json
├── docusaurus-plugin-content-docs/
│   └── current/                     # Mirrors docs/ structure
└── docusaurus-theme-classic/

scripts/
├── api-contract.json                # SDK public API contract (source of truth)
├── test-matrix.json                 # Parameter combinations for branch testing
├── validate-prompts.mjs             # Placeholder & cross-reference validation
├── validate-api-contract.mjs        # API contract conformance checks
├── validate-code-blocks.mjs         # Code block syntax & method signature checks
└── run-branch-tests.mjs             # LLM branch testing runner

tests/prompt-validation/fixtures/    # Test fixtures for prompt validation
├── linear-tv/                       # Linear TV scenarios
└── ott-fast/                        # OTT/FAST scenarios (android, ios, html5)

src/theme/                           # Custom theme components
└── CodeBlock/Buttons/
    └── ParameterCopyButton/         # Copy button with parameter substitution

static/
├── CNAME                            # Custom domain config
├── .nojekyll                        # Disable Jekyll processing
└── img/                             # Static assets (logo, favicon, doc images)
```
