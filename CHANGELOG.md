# Centurion Changelog

## v2.0.0 centurion, centurion-ui (2026-10-14)

A full rewrite in Luau with a reworked API. Both packages are now available on Wally as well as npm.
See the [migration guide](https://centurion.paradoxum.dev/docs/guides/migration) for upgrading from 1.x.

### centurion

**Breaking changes**

- `Centurion.server()` and `Centurion.client()` are replaced by `setup_networking()`, called on both server and client.
- Commands are registered with `register_command(name, { ... })`. Decorators are still supported, but `@Register` and `registry.load()` are removed: require your command modules, then call `register_classes()` once.
- `CommandContext` is now `ExecutionContext`, and `ctx.text` is now `ctx.input`. `ctx.input` is the raw input string, including for commands run on the server from the client.
- Arguments are created with factory functions (`args.player("target", "The player")`) instead of objects with a `CenturionType`, and are returned from an `arguments` function.
- `optional`, `num_args` and `rest` are wrapper functions instead of argument fields. Any argument wrapped in `num_args` is passed to the callback as an array, even with a count of 1.
- Only `rest` arguments consume the remaining input. Previously the last argument was implicitly greedy; extra input is now rejected with an error.
- Custom types are registered with `register_type(name, { transform, suggestions })`, which returns an argument factory. `transform` returns a plain `Result`, and `TransformResult` and the `expensive` option are removed.
- Global guards are added with `add_global_guard`, which returns a function that removes the guard, instead of being passed through config.
- Guards must return `true` to pass. A guard that returns anything other than a boolean denies execution and logs a warning.
- The `shortcuts` command option is removed. Use `execute_command` with UserInputService instead.

**New**

- Built-in roles and permissions with inheritance (`create_role`, `delete_role`, `set_roles`, `add_roles`, `remove_roles`, `can_execute`, `has_permission`). A role that inherits from another gets its permissions and satisfies commands that require it. Default roles apply to every player on top of their assigned roles.
- Players are only synced the commands they're allowed to run, and stay up to date as commands or roles change.
- `args.vector2`, `args.vector3` and `args.rgb_color` argument types, plus `create_enum` and `register_list_type` for custom types.
- Command definitions are validated at registration, so unknown argument types, optional arguments before required ones, misplaced `rest` arguments, unknown guards, unknown roles and role restrictions on client-registered commands are load-time errors. Registering a role twice is also an error.
- `on_command_register`, `on_command_unregister`, `on_command_execute` and `on_roles_changed` events.
- Execute requests from clients are rate limited and size capped, configurable with `set_execute_limits`.
- `set_logger` to route warnings and errors elsewhere. Errors thrown by guards and commands are logged with a traceback.
- `unregister_command`, `unregister_guard`, `parse_text`, `resolve_command`, `transform_args`, `transform_arg` and `assign_args` are exported.
- TypeScript: arguments are typed as `Argument<T>`, where `T` is the value the callback receives, instead of as the value itself. `optional`, `num_args` and `rest` only accept arguments. `@Command` methods are type-checked against their `arguments`.

### centurion-ui

**Breaking changes**

- `CenturionUI.start(client)` is replaced by `CenturionUI.mount()`, which takes optional activation keys (`F2` by default). Options are set separately with `CenturionUI.configure()`, and built-in commands are registered with `CenturionUI.register_commands()`.

**New**

- Redesigned interface with open and close animations, and a built-in `theme` command.
- Syntax highlighting in the input, including invalid arguments.
- A full usage line for the current command with the current argument highlighted.
- Suggestion navigation, clickable suggestions and matched characters highlighted in suggestions.
- Subcommands are suggested alongside a command's first argument.
- A spinner and `Running <command>...` placeholder while a command yields.
- Click a history entry to reuse its command.
- Long output wraps, and history only scrolls to new output when already at the bottom.
- `open`, `close`, `toggle`, `is_open` and `clear` functions.

## v1.0.4 centurion-ui (2024-11-11)

- Only check arguments for non-empty argument inputs.
- Remove Charm in favor of Vide for global UI state, decreasing package size.

## v1.0.3 centurion-ui (2024-11-01)

- Fix yield error when retrieving text bounds.
- Fix command names always being lowercase in command suggestions.

## v1.0.1 centurion (2024-10-04)

- Force registry paths to be lowercase to fix issues with commands containing uppercase characters.
- Restrict command/group names to alphanumeric characters and underscores.
- `BaseRegistry#getChildPaths` is now case-insensitive.

## v1.0.2 centurion-ui (2024-09-29)

- Surround suggestions in quotes if the argument being typed begins with a quote.

## v1.0.1 centurion-ui (2024-09-28)

- Fix suggestions for invalid arguments.
- Fix suggestion traversal when the previous suggestion ends with a quote.

## v1.0.0 centurion-ui (2024-09-28)

- Initial release

## v1.0.0 centurion (2024-09-28)

- Initial release
