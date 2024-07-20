import { Centurion, Command } from "../../../shared";
import { CenturionClient } from "../../core";

@Centurion
export class ClearCommand {
	@Command({
		name: "clear",
		description: "Clear the terminal",
		disableDefaultReply: true,
	})
	clear() {
		CenturionClient.dispatcher().clearHistory();
	}
}
