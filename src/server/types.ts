import { CommandPath } from "../shared";
import { Options } from "../shared/options";

export interface ServerOptions extends Options {
	commandFilter?: (command: CommandPath, player: Player) => boolean;
}
