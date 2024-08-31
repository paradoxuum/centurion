export enum MetadataKey {
	Register = "register",
	Type = "type",
	Command = "command",
	Group = "group",
	Guard = "guard",
}

/**
 * Reflection/metadata API
 *
 * @see https://github.com/rbxts-flamework/core/blob/20683a7f7eb1f8844f7f75e643d764222d06ef24/src/reflect.ts
 */
export namespace DecoratorMetadata {
	// object -> property -> key -> value
	export const metadata = new Map<
		object,
		Map<string | typeof NO_PROP_MARKER, Map<string, unknown>>
	>();
	export const idToObj = new Map<string, object>();
	export const objToId = new Map<object, string>();

	const NO_PROP_MARKER = {} as { _nominal_Marker: never };

	function getObjMetadata(
		obj: object,
		prop: string | undefined,
		create: true,
	): Map<string, unknown>;
	function getObjMetadata(
		obj: object,
		prop?: string,
	): Map<string, unknown> | undefined;

	function getObjMetadata(obj: object, prop?: string, create?: boolean) {
		const realProp = prop ?? NO_PROP_MARKER;
		if (create) {
			let objMetadata = metadata.get(obj);
			if (!objMetadata) {
				objMetadata = new Map();
				metadata.set(obj, objMetadata);
			}

			let propMetadata = objMetadata.get(realProp);
			if (!propMetadata) {
				propMetadata = new Map();
				objMetadata.set(realProp, propMetadata);
			}

			return propMetadata;
		}

		return metadata.get(obj)?.get(realProp);
	}

	function getParentConstructor(obj: object) {
		const metatable = getmetatable(obj) as { __index?: object };
		if (metatable && typeIs(metatable, "table")) {
			return rawget(metatable, "__index") as object;
		}
	}

	/**
	 * Apply metadata onto this object.
	 */
	export function defineMetadata(
		obj: object,
		key: MetadataKey,
		value: unknown,
		property?: string,
	) {
		const metadata = getObjMetadata(obj, property, true);
		metadata.set(key, value);
	}

	/**
	 * Apply metadata in batch onto this object.
	 */
	export function defineMetadataBatch(
		obj: object,
		list: { [key: string]: unknown },
		property?: string,
	) {
		const metadata = getObjMetadata(obj, property, true);

		for (const [key, value] of pairs(list)) {
			metadata.set(key as string, value);
		}
	}

	/**
	 * Delete metadata from this object.
	 */
	export function deleteMetadata(obj: object, key: string, property?: string) {
		const metadata = getObjMetadata(obj, property);
		metadata?.delete(key);
	}

	/**
	 * Get metadata from this object.
	 * Type parameter is an assertion.
	 */
	export function getOwnMetadata<T>(
		obj: object,
		key: string,
		property?: string,
	): T | undefined {
		const metadata = getObjMetadata(obj, property);
		return metadata?.get(key) as T;
	}

	/**
	 * Check if this object has the specified metadata key.
	 */
	export function hasOwnMetadata(obj: object, key: string, property?: string) {
		const metadata = getObjMetadata(obj, property);
		return metadata?.has(key) ?? false;
	}

	/**
	 * Retrieve all metadata keys for this object.
	 */
	export function getOwnMetadataKeys(obj: object, property?: string) {
		const metadata = getObjMetadata(obj, property);
		const keys = new Array<string>();

		if (metadata !== undefined) {
			for (const [key] of metadata) {
				keys.push(key);
			}
		}

		return keys;
	}

	/**
	 * Retrieves all properties (that contain metadata) on this object.
	 */
	export function getOwnProperties(obj: object) {
		const properties = metadata.get(obj);
		if (!properties) return [];

		const keys = new Array<string>();
		for (const [key] of properties) {
			if (key !== NO_PROP_MARKER) {
				keys.push(key as string);
			}
		}
		return keys;
	}

	/**
	 * Retrieve all values for the specified key from the object and its parents.
	 * Type parameter is an assertion.
	 */
	export function getMetadatas<T extends defined>(
		obj: object,
		key: string,
		property?: string,
	): T[] {
		const values = new Array<T>();

		const value = getOwnMetadata(obj, key, property);
		if (value !== undefined) {
			values.push(value as T);
		}

		const parent = getParentConstructor(obj);
		if (parent) {
			for (const value of getMetadatas<T>(parent, key, property)) {
				values.push(value);
			}
		}

		return values;
	}

	/**
	 * Get metadata from this object or its parents.
	 * Type parameter is an assertion.
	 */
	export function getMetadata<T>(
		obj: object,
		key: string,
		property?: string,
	): T | undefined {
		const value = getOwnMetadata(obj, key, property);
		if (value !== undefined) {
			return value as T;
		}

		const parent = getParentConstructor(obj);
		if (parent) {
			return getMetadata(parent, key, property);
		}
	}

	/**
	 * Check if this object or any of its parents has the specified metadata key.
	 */
	export function hasMetadata(
		obj: object,
		key: string,
		property?: string,
	): boolean {
		const value = hasOwnMetadata(obj, key, property);
		if (value) {
			return value;
		}

		const parent = getParentConstructor(obj);
		if (parent) {
			return hasMetadata(parent, key, property);
		}

		return false;
	}

	/**
	 * Retrieve all metadata keys for this object and its parents.
	 */
	export function getMetadataKeys(obj: object, property?: string): string[] {
		const keys = new Set<string>(getOwnMetadataKeys(obj, property));

		const parent = getParentConstructor(obj);
		if (parent) {
			for (const key of getMetadataKeys(parent, property)) {
				keys.add(key);
			}
		}

		return [...keys];
	}

	/**
	 * Retrieves all properties (that contain metadata) on this object and its parents.
	 */
	export function getProperties(obj: object) {
		const keys = new Set<string>(getOwnProperties(obj));

		const parent = getParentConstructor(obj);
		if (parent) {
			for (const key of getProperties(parent)) {
				keys.add(key);
			}
		}

		return [...keys];
	}
}
