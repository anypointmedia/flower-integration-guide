# CLAUDE.md

This repository is a Docusaurus-based documentation site for the Flower SDK integration guide.

## Documentation Editing Rules

### Always edit Korean and English together (required)

When editing documentation content, you must **always update both the English source and the Korean translation together**. Updating only one side is not allowed.

- **English source**: under `docs/` (e.g. `docs/web-smart-tv/getting-started/initialization-and-release.md`)
- **Korean translation**: under `i18n/ko/docusaurus-plugin-content-docs/current/` at the same relative path (e.g. `i18n/ko/docusaurus-plugin-content-docs/current/web-smart-tv/getting-started/initialization-and-release.md`)

In other words, whenever you edit `docs/<path>`, you must also edit `i18n/ko/docusaurus-plugin-content-docs/current/<path>` with the equivalent content. When adding a new document, create it in both locations.

After editing, verify that both files reflect the change.
