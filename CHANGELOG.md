# Changelog

All notable changes to ZephyrToast are documented in this file.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

No changes documented yet.

## [1.6.0] - 2026-10-11

A major internal refactoring of ZephyrToast, improving maintainability, reliability, security, documentation, and package distribution while preserving the existing public notification API.

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

### Compatibility

- Preserved the existing `ZephyrToast` class and its primary notification methods.
- Maintained support for standalone browser integration.
- Added ES module distribution and TypeScript declarations for modern development environments.

## [1.5.0] - 2025-04-16

### Added

- `pauseOnHover` option, enabled by default, to pause automatic dismissal when hovering over a notification.
- `allowHtml` option, disabled by default, to enable HTML message rendering.

### Changed

- Updated documentation for the new configuration options.
- Improved the notification generator to support the additional settings.

### Compatibility

- No breaking changes reported relative to v1.4.0.

---

[Unreleased]: https://github.com/sarwaralamini/zephyr-toast/compare/v1.6.0...HEAD
[1.6.0]: https://github.com/sarwaralamini/zephyr-toast/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/sarwaralamini/zephyr-toast/releases/tag/v1.5.0
