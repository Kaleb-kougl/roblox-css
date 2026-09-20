# Contributing to roblox-css

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [roblox-ts](https://roblox-ts.com) (`npm install -g roblox-ts`)
- [Rojo](https://rojo.space/) (v7.6+, installed via [Rokit](https://github.com/rojo-rbx/rokit))
- [Roblox Studio](https://create.roblox.com/)
- The `@rbxts/jest` Roblox Studio plugin

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Kaleb-kougl/roblox-css.git
   cd roblox-css
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build:
   ```bash
   npx rbxtsc
   ```

## Running Tests

Tests execute natively inside Roblox Studio (not via npm):

1. Build the project: `npx rbxtsc`
2. Start Rojo: `rojo serve test-runner.project.json`
3. Open Roblox Studio and connect via the Rojo plugin
4. Run the `@rbxts/jest` test plugin

All 1,966 assertions should pass — that figure counts the eight duplicated
spec sources under `src/tests/` twice, which is 1,338 distinct assertions
across 12 distinct files. See "Running Tests" in the README.

## Code Style

- **TypeScript strict mode** is enforced
- Use **tabs** for indentation
- Run `npx rbxtsc` before submitting — the project must compile with zero errors

## Pull Request Process

1. Fork the repository and create a feature branch
2. Make your changes
3. Ensure all tests pass
4. Submit a PR with a clear description of what changed and why

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the middleware is structured.

## License

By contributing, you agree that your contributions will be licensed under the LGPL-3.0-only license.
