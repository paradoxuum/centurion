import {
	CenturionType,
	Command,
	CommandContext,
	Register,
} from "@rbxts/centurion";

@Register()
export class EchoCommand {
	@Command({
		name: "echo",
		description: "Prints the given text",
		arguments: [
			{
				name: "text",
				description: "The text to print",
				type: CenturionType.String,
				suggestions: ["Hello, World!", "Some other spaced text", "Test"],
			},
		],
		aliases: ["print"],
	})
	run(_: CommandContext, text: string) {
		print(text);
	}
}
