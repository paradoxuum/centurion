import {
	CenturionType,
	Command,
	CommandContext,
	Register,
} from "@rbxts/centurion";

@Register
export class EchoCommand {
	@Command({
		name: "echo",
		description: "Prints the given text",
		arguments: [
			{
				name: "text",
				description: "The text to print",
				type: CenturionType.String,
				optional: true,
			},
		],
		shortcuts: [
			Enum.KeyCode.H,
			{
				keys: [Enum.KeyCode.LeftAlt, Enum.KeyCode.H],
				arguments: ["Alt + H pressed"],
			},
		],
		aliases: ["print"],
	})
	run(_: CommandContext, text?: string) {
		if (text !== undefined) {
			print(text);
		} else {
			print("Hello World!");
		}
	}
}
