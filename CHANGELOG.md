# Centurion Changelog

## Core

### Unreleased

- Full rewrite in Luau
- Revamped API

### v1.0.1 (2024-10-04)

- Force registry paths to be lowercase to fix issues with commands containing uppercase characters.
- Restrict command/group names to alphanumeric characters and underscores.
- `BaseRegistry#getChildPaths` is now case-insensitive.

### v1.0.0 (2024-09-28)

- Initial release

## UI

### v1.0.4 (2024-11-11)

- Only check arguments for non-empty argument inputs.
- Remove Charm in favor of Vide for global UI state, decreasing package size.

### v1.0.3 (2024-11-01)

- Fix yield error when retrieving text bounds.
- Fix command names always being lowercase in command suggestions.

### v1.0.2 (2024-09-29)

- Surround suggestions in quotes if the argument being typed begins with a quote.

### v1.0.1 (2024-09-28)

- Fix suggestions for invalid arguments.
- Fix suggestion traversal when the previous suggestion ends with a quote.

### v1.0.0 (2024-09-28)

- Initial release
