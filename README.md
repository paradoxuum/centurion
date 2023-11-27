# Commander

⚠️ This project is currently work-in-progress. Many features are missing and existing features are likely to change.

Commander is a flexible and extensible command framework built for roblox-ts.

Commands are registered using decorators. This allows for commands to be
defined in a readable and easy to maintain manner.

Custom types can be registered, allowing the string arguments provided by the user to be transformed into new types. These types also provide some extra functionality such as the ability to provide autocomplete suggestions.

Commander also comes with an optional default user interface that can easily be swapped out for a custom one.

## Usage

All classes containing commands must be decorated with `@Commander` in order for their commands to be registered.

In order to register commands, you must run `BaseRegistry#registerCommandsIn`. This `require`s all `ModuleScripts` in the
provided `Instance` and will register all methods annotated with `@Command` inside classes annotated with `@Commander`.

A registry can be obtained by running `CommanderClient` or `CommanderServer` depending on which side the script is
being executed, for example:

```ts
CommanderServer.run((registry) => {
	// Get the Instance containing your commands
	const commandContainer = script.Parent.Commands;

	// Register them!
	registry.registerCommandsIn(commandContainer);

	// You can also provide a registry to any container you want using this method.
	// All ModuleScripts (that return a function) in the container will
	// be called with the registry argument.
	registry.registerContainer(script.Parent.Types);
});
```

## Examples

A simple `ban` command with a `Player` argument:

```ts
@Commander()
class BanCommand {
	@Command({
		name: "ban",
		arguments: [
			{
				name: "player",
				description: "Player to ban",
				type: BuiltInTypes.Player,
			},
		],
	})
	ban(executor: Player, player: Player) {}
}
```

A command that uses the group feature:

```ts
// Groups must be defined in this annotation in order to be used.
// At the moment, only the root group can have children.
// This allows for 2 layers of groups. This may be changed in the future!
@Commander({
	groups: [
		{
			name: "info",
			description: "View info about a user or the server",
		},
		{
			name: "user",
			description: "View info about a user",
			root: "info",
		},
		{
			name: "server",
			description: "View info about the server",
			root: "info",
		},
	],

	// Global groups are groups assigned to all commands
	// defined in this class.
	globalGroups: ["info"],
})
class InfoCommand {
	// This command will be executable through "info user view" once registered!
	@Command({
		name: "view",
		arguments: [
			{
				name: "player",
				description: "Player to display information about",
				type: BuiltInTypes.Player,
			},
		],
	})
	@Group("user") // You can also define groups like this: @Group("info", "user")
	userView(executor: Player, player: Player) {}

	// This command can have the same name as the above command, because it
	// is grouped under "server" instead.
	// This command will be executable through "info server view" once registered!
	@Command({
		name: "view",
	})
	@Group("server")
	serverView(executor: Player) {}
}
```

# Attributions

-   [Cmdr](https://github.com/evaera/Cmdr): String utilities ([see usage](src/shared/util/string.ts))

-   [Flamework](https://github.com/rbxts-flamework/core): Metadata reflection API ([see usage](src/shared/util/reflect.ts))

-   [Slither](https://github.com/littensy/slither): Basic UI components and hooks
