<div align="center">
  <a href="https://centurion.paradoxum.dev/" target="_blank">
    <img src="https://raw.githubusercontent.com/paradoxuum/centurion/main/docs/public/logo.svg" width="150" />
  </a>

  <h1>Centurion</h1>

  <p><strong>A flexible and extensible command framework for Roblox</strong></p>

  [![CI status][ci-badge]][ci-url]
  [![npm latest version][npm-latest-badge]][npm-latest-url]
  [![MIT License][license-badge]][license-url]

  [npm-latest-badge]: https://img.shields.io/npm/v/@rbxts/centurion.svg?style=for-the-badge&logo=npm
  [npm-latest-url]: https://www.npmjs.com/package/@rbxts/centurion/v/latest
  [ci-badge]: https://img.shields.io/github/actions/workflow/status/paradoxuum/centurion/ci.yml?style=for-the-badge&branch=main&logo=github
  [ci-url]: https://github.com/paradoxuum/centurion/actions/workflows/ci.yml
  [license-badge]: https://img.shields.io/github/license/paradoxuum/centurion?style=for-the-badge
  [license-url]: https://github.com/paradoxuum/centurion/blob/main/LICENSE.md

  <img src="https://raw.githubusercontent.com/paradoxuum/centurion/main/docs/public/example.webp" alt="Example" style="border-radius: 4px;" />

  [📖 **Documentation →**](https://centurion.paradoxum.dev/)
</div>

## ✨ Features

- 🌙 **Luau and roblox-ts.** Written in Luau with full TypeScript typings, and available on both Wally and npm.

- ✏️ **Simple to define.** Register commands with a plain table, or use decorators and classes in roblox-ts.

- 🧩 **Typed arguments.** Built-in types for players, teams, numbers, colors, durations, vectors and more, with optional, multi-value and rest arguments. Register your own types with custom suggestions.

- 🔐 **Guards and permissions.** Guard commands with reusable checks, and control access with inheritable roles and permissions.

- 🔄 **Client-server sync.** Players only receive the commands they're allowed to run, and stay up to date as commands or roles change.

- 💻 **Optional terminal UI.** A clean console with suggestions, fuzzy matching, tab completion, syntax highlighting and history. Use it as-is, theme it, or build your own.

## 📦 Installation

```toml
# wally.toml
[dependencies]
centurion = "paradoxuum/centurion@2.0.0"
centurion-ui = "paradoxuum/centurion-ui@2.0.0"
```

```bash
# roblox-ts
npm install @rbxts/centurion @rbxts/centurion-ui
```

See the [documentation](https://centurion.paradoxum.dev/) to get started.

## 💖 Attributions

- [🍀 Charm](https://github.com/littensy/charm): Inspiration for command syncing

- [💻 Conch](https://github.com/alicesaidhi/conch): UI utility components and text box state handling

- [🌿 Vide](https://github.com/centau/vide): Reactive UI library powering the terminal UI

---

<p align="center">
This project is released under the <a href="https://github.com/paradoxuum/centurion/blob/main/LICENSE.md">MIT License</a>.
</p>

<div align="center">

[![MIT License](https://img.shields.io/github/license/paradoxuum/centurion?style=for-the-badge)](https://github.com/paradoxuum/centurion/blob/main/LICENSE.md)

</div>
