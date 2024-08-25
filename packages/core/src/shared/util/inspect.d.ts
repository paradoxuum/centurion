interface InspectOptions {
	depth: number;
	newline: string;
	indent: string;
	process: (item: unknown, path: unknown[]) => unknown;
}

export function inspect(
	value: unknown,
	options?: Partial<InspectOptions>,
): string;
