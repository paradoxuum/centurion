import { RegistryPath } from "../shared";
import { SharedOptions } from "../shared/options";

export interface ServerOptions extends SharedOptions {
	commandFilter?: (command: RegistryPath, player: Player) => boolean;
}
