# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CI/CD workflow for Node 18, 20, 22
- ESLint setup
- Babel config for Jest ESM support

### Changed
- Upgraded `@inquirer/prompts` to v8.x (ESM-only)

### Fixed
- Various lint issues
- Windows path separator handling
- Edge cases in dependency resolution

## [1.1.12] - 2024

Initial public release with interactive/command-line modes, project linking, version manager, and multi-package support.

[Unreleased]: https://github.com/Zaeper/pkgm/compare/v1.1.12...HEAD
[1.1.12]: https://github.com/Zaeper/pkgm/releases/tag/v1.1.12
