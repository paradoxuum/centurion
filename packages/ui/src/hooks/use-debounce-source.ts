import { DebounceOptions, debounce } from "@rbxts/set-timeout";
import { cleanup, source } from "@rbxts/vide";

export interface UseDebounceOptions extends DebounceOptions {
	/**
	 * The amount of time to wait before the first call.
	 */
	wait?: number;
}

export function useDebounceSource<T>(
	initialValue: T,
	options: UseDebounceOptions = {},
) {
	const state = source(initialValue);
	const update = debounce(state, options.wait, options);

	cleanup(() => {
		update.cancel();
	});

	return {
		get: () => state(),
		set: (value: T) => update(value),
	};
}
