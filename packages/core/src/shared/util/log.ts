import { inspect } from "./inspect";

export enum CenturionLogLevel {
	Debug = 0,
	Info = 1,
	Warn = 2,
	Error = 3,
}

function parseMessage(count: number, message: unknown[]) {
	const parsed = [];
	for (const i of $range(0, count - 1)) {
		const val = message[i];
		if (typeIs(val, "string")) {
			parsed[i] = val;
			continue;
		}
		parsed[i] = inspect(val);
	}
	return parsed;
}

export class CenturionLogger {
	private readonly prefix?: string;

	constructor(
		readonly level: CenturionLogLevel,
		prefix?: string,
	) {
		this.prefix =
			prefix !== undefined ? `[Centurion/${prefix}]` : "[Centurion]";
	}

	debug(...message: unknown[]) {
		if (this.level > CenturionLogLevel.Debug) return;
		this.log(print, ...message);
	}

	info(...message: unknown[]) {
		if (this.level > CenturionLogLevel.Info) return;
		this.log(print, ...message);
	}

	warn(...message: unknown[]) {
		if (this.level > CenturionLogLevel.Warn) return;
		this.log(warn, ...message);
	}

	error(...message: unknown[]) {
		this.log(error, ...message);
	}

	assert<T>(condition: T, message: unknown): asserts condition {
		if (!condition) {
			this.error(message);
		}
	}

	private log(func: (message: string) => void, ...message: unknown[]) {
		const count = select("#", ...message);
		const msg = parseMessage(count, message).join(" ");
		func(`${this.prefix} ${msg}`);
	}
}
