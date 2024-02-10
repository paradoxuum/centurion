import { DEFAULT_OPTIONS } from "../shared/options";
import { ClientOptions } from "./types";

export const DEFAULT_CLIENT_OPTIONS: ClientOptions = {
	...DEFAULT_OPTIONS,
	historyLength: 1000,
};
