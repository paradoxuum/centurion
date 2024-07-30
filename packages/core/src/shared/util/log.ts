export enum CenturionLogLevel {
	Debug = 0,
	Info = 1,
	Warn = 2,
	Error = 3,
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
		print(this.prefix, ...message);
	}

	info(...message: unknown[]) {
		if (this.level > CenturionLogLevel.Info) return;
		print(this.prefix, ...message);
	}

	warn(...message: unknown[]) {
		if (this.level > CenturionLogLevel.Warn) return;
		warn(this.prefix, ...message);
	}

	error(message: unknown) {
		error(`${this.prefix} ${message}`);
	}

	assert<T>(condition: T, message: unknown): asserts condition {
		if (!condition) {
			this.error(message);
		}
	}
}
