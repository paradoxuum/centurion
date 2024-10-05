# Centurion Changelog

## Core

### v1.0.1 (2024-10-04)

- Force registry paths to be lowercase to fix issues with commands containing uppercase characters.
- Restrict command/group names to alphanumeric characters and underscores.
- `BaseRegistry#getChildPaths` is now case-insensitive.

### v1.0.0 (2024-09-28)

- Initial release

## UI

### v1.0.2 (2024-09-29)

- Surround suggestions in quotes if the argument being typed begins with a quote.

### v1.0.1 (2024-09-28)

- Fix suggestions for invalid arguments.
- Fix suggestion traversal when the previous suggestion ends with a quote.

### v1.0.0 (2024-09-28)

- Initial release
