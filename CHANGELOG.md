# Changelog

Notable changes to ZephyrToast are documented in this file.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and intends to use [Semantic Versioning](https://semver.org/). Entries are grouped by release; unreleased changes remain under **Unreleased** until a version is published.

## [Unreleased]

### Added

- Modular source architecture for configuration, rendering, notification lifecycle, and public entry points.
- TypeScript declarations for the notification API, options, themes, animations, and icon configurations.
- Automated tests covering configuration validation, notification lifecycle, timers, cleanup, public API behavior, and security-sensitive rendering.
- Browser compatibility test page for manual and automated browser checks.
- Interactive notification playground with generated code, configurable appearance, and isolated iframe preview.
- GitHub Actions configuration for automated project validation.
- Standalone [API reference](API.md) with detailed options and usage examples.
- npm package export paths for the ES module, browser bundle, and stylesheets.

### Changed

- Refactored the notification implementation into reusable modules while retaining the `ZephyrToast` class API.
- Improved independent instance defaults and type definitions.
- Improved validation for notification options, custom icons, animations, and themes.
- Improved notification dismissal, hover pause/resume, progress timing, and timer cleanup.
- Updated documentation, build tooling, code formatting, and package verification.
- Reworked the GitHub Pages demo build to publish the generated website under `docs/`.

### Security

- Validated inline SVG markup against restricted elements and attributes.
- Restricted image icon URLs to HTTP(S) and relative URLs resolving to HTTP(S).
- Used plain-text message rendering by default; HTML rendering remains explicitly opt-in via `allowHtml`.

### Fixed

- Improved consistency between notification exit animations and dismissal timing.
- Prevented notification container position changes when rendering fails.
- Improved robustness of notification cleanup after dismissal.

## Release notes policy

- This changelog does not designate the refactoring work as a published release yet.
- The `package.json` currently identifies version `1.5.0`, but the first npm publication version has not been finalized.
- Before publishing, move the appropriate items from **Unreleased** to a dated version heading such as `## [X.Y.Z] - YYYY-MM-DD`, after confirming the chosen version and actual release date.
- Avoid retroactively assigning publication dates or version history without supporting release records.

[Unreleased]: https://github.com/sarwaralamini/zephyr-toast/compare/main...refactor/v2-architecture
