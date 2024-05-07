export type ReadonlyDeep<T> = T extends (infer U)[]
	? ReadonlyDeepArray<U>
	: T extends Callback
		? T
		: T extends object
			? ReadonlyDeepObject<T>
			: T;

interface ReadonlyDeepArray<T> extends ReadonlyArray<ReadonlyDeep<T>> {}

export type ReadonlyDeepObject<T> = {
	readonly [P in keyof T]: ReadonlyDeep<T[P]>;
};

export namespace ArrayUtil {
	export function slice<T extends defined>(
		array: ReadonlyArray<T>,
		startPos = 0,
		endPos = array.size(),
	) {
		assert(startPos >= 0, "Start position must be non-negative");
		assert(endPos >= 0, "End position must be non-negative");

		return array.move(math.max(0, startPos), endPos - 1, 0, []);
	}

	export function equals(array1: unknown[], array2: unknown[]) {
		if (array1.size() !== array2.size()) return false;

		for (const i of $range(0, array1.size() - 1)) {
			if (array1[i] !== array2[i]) return false;
		}

		return true;
	}
}

export namespace ObjectUtil {
	export function copyDeep<T extends object>(dictionary: T) {
		const result = table.clone(dictionary);
		for (const [k, v] of pairs(dictionary)) {
			if (typeIs(v, "table")) {
				result[k as never] = copyDeep(v) as never;
			}
		}
		return result;
	}

	export function freezeDeep<T extends object>(
		dictionary: T,
	): ReadonlyDeepObject<T> {
		const result = table.freeze(dictionary);
		for (const [_, v] of pairs(dictionary)) {
			if (typeIs(v, "table")) {
				table.freeze(v);
			}
		}
		return result as ReadonlyDeepObject<T>;
	}
}
