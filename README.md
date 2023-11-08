# Cmdx

⚠️ This project is currently work-in-progress. Many features are missing and existing features are likely to change.

Cmdx is a flexible and extensible command framework built for roblox-ts.

Commands are registered using a TypeScript feature: decorators. This allows for commands to be
defined in a readable and easy to maintain way.

Custom types can be registered, allowing the string arguments provided by the user to be transformed into new types. These
types also provide some extra functionality such as the ability to provide autocomplete suggestions.

A user interface is currently not implemented but will be implemented in the future.
The framework will be designed in a way that allows the default interface to easily be swapped out for another.

## Usage

All classes must best decorated with `@Cmdx` in order for their commands to be registered.

The command registry then looks for all methods annotated with `@Command` in this class.

In order to register commands, you must run `BaseRegistry#registerCommandsIn`.

A registry can be obtained by running `CmdxClient` or `CmdxServer` depending on which side the script is
being executed, for example:

```ts
CmdxServer.run((registry) => {
	// Get the Instance containing all of your commands
	const commandContainer = script.Parent.Commands;

	// Register them!
	registry.registerCommandsIn(commandContainer);

	// You can also provide a registry to any container you want using this method.
	// All ModuleScripts found in the container that return a function will
	// be called with the registry argument.
	registry.registerContainer(script.Parent.Types);
});
```

## Examples

A simple `ban` command with a `Player` argument:

```ts
@Cmdx()
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
@Cmdx({
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
