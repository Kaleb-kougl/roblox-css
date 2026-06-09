# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `InlineText` component for rendering text with inline images.
- Utility `parseInlineImages` to parse HTML-like `<img>` tags.
- Comprehensive unit tests for `MotionUIScale`, `ScrollBox`, `Text`, and hooks.

### Fixed
- Prevented text-specific CSS props from being applied to the `InlineText` Box container.

## [0.1.0] - 2026-06-05

### Added
- Core `webStyle()` translation engine with branded `WebStyleResult` type
- CSS property parsers: `colorParser` (hex, rgb, rgba, hsl, hsla, named), `dimensionParser` (px, %, vw, vh, calc, auto), `gradientParser` (linear-gradient)
- 148 CSS named colors
- 6 base primitives: `Box`, `Text`, `Button`, `Image`, `Input`, `ScrollBox`
- 5 motion primitives: `MotionBox`, `MotionText`, `MotionButton`, `MotionImage`, `MotionUIScale`
- `useVariantResolver` hook for Framer Motion-style variant animations via `@rbxts/ripple`
- `usePercentageConstraints` hook + `ParentSizeContext` for reactive percentage-based min/max sizing
- Configurable `SHADOW_ASSET_ID` for `boxShadow` rendering
- `TRANSITIONS` presets (default, pop, breathe, snap, shimmer)
- `setLogLevel()` / `LogLevel` for controlling middleware log output
- 1,419 test assertions across 24 spec files
