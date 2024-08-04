import { SharedConfig } from "./types";
import { CenturionLogLevel } from "./util/log";

export const DEFAULT_CONFIG: SharedConfig = {
	registerBuiltInTypes: true,
	logLevel: CenturionLogLevel.Warn,
	guards: [],
	messages: {
		default: "Command executed.",
		error: "An error occurred.",
		notFound: "Command not found.",
	},
};
