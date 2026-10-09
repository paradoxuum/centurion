# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Centurion is a flexible command framework for Roblox (roblox-ts). It consists of two npm packages:
- `@rbxts/centurion` (`pkgs/centurion/`) — Core command registry, argument types, guards, roles, permissions, and client-server sync
- `@rbxts/centurion-ui` (`pkgs/centurion-ui/`) — Terminal UI with suggestions and tab completion, built on Vide (reactive UI library)

The codebase is primarily Luau (Roblox's Lua dialect) with TypeScript type definitions and decorator wrappers in `src/ts/`. The `docs/` site uses Tanstack Start + Fumadocs.

## Commands

```bash
# Install dependencies
pnpm install

# Format Luau files (CI runs `stylua --check .`)
stylua .

# Lint Luau files (runs in CI)
selene .

# Run unit tests (runs in CI)
luau test/unit/tests.luau

# Sync test place to Roblox Studio (for manual testing)
rojo serve

# Docs dev server
pnpm --filter docs dev

# Build docs (runs in CI on PRs to main that touch docs/)
pnpm --filter docs build

# Lint/format docs (Biome is only set up in docs/)
pnpm --filter docs lint
pnpm --filter docs format
```

Unit tests live in `test/unit/`. Integration testing is done manually by syncing to Roblox Studio via Rojo and running the test place in `test/`.

Tools (rojo, stylua, selene, lune, zap, luau) are managed by [Rokit](https://github.com/rojo-rbx/rokit) — install with `rokit install` if not available.

## Architecture

### Core (`pkgs/centurion/src/`)

- **`command.luau`** — Registry: stores commands, handles registration/unregistration callbacks, dispatches execution with context
- **`parse.luau`** — Tokenizes command input strings into structured tokens
- **`argument/`** — Extensible type system: built-in types (string, number, integer, boolean, player, players, color, duration, team, vector), list type support (`num_args = "rest"`), and suggestion generation
- **`guard.luau`** — Named guards registered globally or per-command; can return boolean or throw
- **`permission.luau`** — Role-based access control with priority levels and per-player assignments
- **`sync/`** — Client-server synchronization of the command registry via patch-based updates and a network handler abstraction
- **`context.luau`** — `ExecutionContext` type: executor, command name, raw input, parsed arguments, `reply()` / `error()` helpers
- **`result.luau`** — `Result<T>` type for typed error returns
- **`ts/init.luau`** — TypeScript decorator wrappers (`@Command`, `@Guard`, `@Role`, `@Permission`, `@Group`) and `register_classes()` for class-based command registration

### UI (`pkgs/centurion-ui/src/`)

- **`state.luau`** — Vide-based reactive state: UI visibility, activation keys, theme, history, suggestions
- **`app/`** — Top-level UI component, command history, suggestion list logic
- **`analyse/`** — Suggestion generation with Levenshtein distance fuzzy matching (`leventine.luau`, `suggest.luau`)
- **`components/`** — Primitive Vide UI components (background, text, textbox, flex, padding, etc.)
- **`theme.luau`** / **`px.luau`** — Theme system and pixel unit helpers for responsive layout

### Test Place (`test/`)

- `test/server/init.server.luau` — Server-side command registrations demonstrating arguments, guards, roles
- `test/client/init.client.luau` — Client UI mounting
- `test/*/network.luau` — Zap-generated networking code

## Key Conventions

- **Luau strict mode** (`.luaurc` sets `languageMode = "strict"`)
- **StyLua formatting**: `call_parentheses = "Input"` — preserve the user's parentheses style; don't add/remove them
- **Selene**: `mixed_table = "allow"`
- The `luau` branch contains the current active development (full rewrite); `main` is the latest stable release
