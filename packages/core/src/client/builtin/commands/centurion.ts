import { $package } from "rbxts-transform-debug";
import { Centurion, Command, CommandContext, Group } from "../../../shared";

const VERSION = $package.version;

@Centurion
@Group("centurion")
export class CenturionCommand {
	@Command({
		name: "version",
		description: "Display the current version of Centurion",
	})
	version(ctx: CommandContext) {
		ctx.reply(`Centurion v${VERSION}`);
	}
}
