import { CommandPath } from "../shared";

export interface ServerOptions {
	commandFilter?: (command: CommandPath, player: Player) => boolean;
}
