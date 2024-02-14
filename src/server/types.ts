import { Path } from "../shared";
import { Options } from "../shared/options";

export interface ServerOptions extends Options {
	commandFilter?: (command: Path, player: Player) => boolean;
}
