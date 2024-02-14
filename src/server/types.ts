import { Path } from "../shared";
import { SharedOptions } from "../shared/options";

export interface ServerOptions extends SharedOptions {
	commandFilter?: (command: Path, player: Player) => boolean;
}
