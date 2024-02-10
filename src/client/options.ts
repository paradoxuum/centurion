import { DEFAULT_OPTIONS } from "../shared/options";
import { ClientOptions } from "./types";

export const DEFAULT_CLIENT_OPTIONS: ClientOptions = {
	...DEFAULT_OPTIONS,
	hideOnLostFocus: true,
	historyLength: 1000,
	activationKeys: [Enum.KeyCode.F2],
};
