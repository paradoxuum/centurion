import { SharedConfig } from "./types";
import { CenturionLogLevel } from "./util/log";

export const DEFAULT_CONFIG: SharedConfig = {
	registerBuiltInTypes: true,
	logLevel: CenturionLogLevel.Warn,
	guards: [],
};
