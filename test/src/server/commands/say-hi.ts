import { Command, CommandContext, Commander } from "../../shared";

@Commander
export class SayHiCommand {
	@Command({
		name: "sayhi",
		description: "Say hi!",
		shortcuts: [[Enum.KeyCode.LeftAlt, Enum.KeyCode.H], Enum.KeyCode.H],
	})
	run(ctx: CommandContext) {
		print("Hi 🙂!");
	}
}
