import { Command, CommandContext, Commander, Guard } from "../../shared";

@Commander
export class SayHiCommand {
	@Command({
		name: "sayhi",
		description: "Say hi!",
		shortcuts: [
			[Enum.KeyCode.LeftAlt, Enum.KeyCode.H],
			{ actionName: "SayHi", activations: [Enum.PlayerActions.CharacterJump] },
		],
	})
	run(ctx: CommandContext) {
		print("Hi 🙂!");
	}
}
