# FLOWER Integration Guide

FLOWER SDK integration documentation for Linear TV and OTT/FAST platforms, built with [Docusaurus](https://docusaurus.io/).

## Prerequisites

- Node.js >= 24.0

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
├── intro.mdx                    # Landing page
├── linear-tv/                   # Linear TV (Multicast, DTH)
│   ├── sdk-architecture.md
│   ├── project-settings.md
│   ├── preparing-to-use/
│   ├── inserting-ads/
│   ├── scte-35-decoder.md
│   ├── ad-player/
│   ├── how-to-test.md
│   ├── release-notes/
│   └── prompts/                 # LLM-assisted integration prompts
│       ├── how-to-use-prompts.md
│       ├── integrated-prompt.md
│       └── step-{1..4}-*.md
└── ott-fast/                    # OTT/FAST
    ├── supported-content-types.md
    ├── sdk-architecture.md
    ├── android/
    ├── ios/
    ├── html5/
    ├── release-notes/
    └── prompts/                 # LLM-assisted integration prompts
        ├── how-to-use-prompts.md
        ├── android/
        │   ├── integrated-prompt.md
        │   └── step-{1..4}-*.md
        ├── ios/
        │   ├── integrated-prompt.md
        │   └── step-{1..4}-*.md
        └── html5/
            ├── integrated-prompt.md
            └── step-{1..4}-*.md

scripts/
├── api-contract.json            # SDK public API contract (source of truth)
├── test-matrix.json             # Parameter combinations for branch testing
├── validate-prompts.mjs         # Placeholder & cross-reference validation
├── validate-api-contract.mjs    # API contract conformance checks
├── validate-code-blocks.mjs     # Code block syntax & method signature checks
└── run-branch-tests.mjs         # LLM branch testing runner
```
