# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial Quartz community plugin template.

### Fixed

- LocaleSwitcher now seeds its own bundle's options singleton from the
  constructor arg. tsup bundles `util/state.ts` into every entry point, so
  options set by the transformer in `dist/index.js` were invisible to the
  component in `dist/components/index.js`, making `buildLocaleList` see only
  the default locale and the switcher render `null`.
