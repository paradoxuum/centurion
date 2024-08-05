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
	construct: (ctor) => {
		const obj = setmetatable({}, ctor as never) as object;
		const result = (obj as { constructor(): unknown }).constructor();
		assert(
			result === undefined || result === obj,
			"Constructors are not allowed to return values.",
		);
		return obj;
	},
};
