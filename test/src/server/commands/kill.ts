import { Cmdx, Command } from "@rbxts/cmdx";

@Cmdx({
	groups: [
		{
			name: "kill",
			description: "Kills a player",
		},
	],
})
class InfoCommand {
	@Command({ name: "kill" })
	kill(player: Player) {
		print(player);
	}
}
