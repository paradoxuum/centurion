import { DEFAULT_SHARED_OPTIONS } from "../shared/options";
import { ClientOptions } from "./types";

export const DEFAULT_CLIENT_OPTIONS: ClientOptions = {
	...DEFAULT_SHARED_OPTIONS,
	historyLength: 1000,
	shortcutsEnabled: false,
};
