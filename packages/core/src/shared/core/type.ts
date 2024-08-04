import { t } from "@rbxts/t";
import { ListArgumentType, SingleArgumentType } from "../types";
import { DecoratorMetadata, MetadataKey } from "./metadata";

export namespace TransformResult {
	export type Object<T> = { ok: true; value: T } | { ok: false; value: string };

	/**
	 * Creates a successful result object, indicating a transformation was successful.
	 *
	 * @param value - The transformed value.
	 * @returns A {@link TransformResult.Object} object.
	 */
	export function ok<T>(value: T): Object<T> {
		return {
			ok: true,
			value,
		};
	}

	/**
	 * Creates an error result object, indicating a transformation was not successful.
	 *
	 * @param text - The error message
	 * @returns A {@link TransformResult.Object} object.
	 */
	export function err<T>(text: string): Object<T> {
		return {
			ok: false,
			value: text,
		};
	}
}

/**
 * A helper class for building argument types.
 */
export class TypeBuilder<T> {
	private expensive = false;
	private marked = false;
	private validationFn?: t.check<T>;
	private transformFn?: SingleArgumentType<T>["transform"];
	private suggestionFn?: SingleArgumentType<T>["suggestions"];

	protected constructor(protected readonly name: string) {}

	/**
	 * Instantiates a {@link TypeBuilder} with the given name.
	 *
	 *
	 * @param name - The name of the type.
	 * @returns A {@link TypeBuilder} instance.
	 */
	static create<T>(name: string) {
		return new TypeBuilder<T>(name);
	}

	/**
	 * Creates a new `TypeBuilder` with the given name, extending
	 * from the provided type.
	 *
	 * @param name - The name of the type.
	 * @param argumentType - The type to extend from.
	 * @returns A {@link TypeBuilder} instance.
	 */
	static extend<T>(name: string, argumentType: SingleArgumentType<T>) {
		const builder = new TypeBuilder<T>(name);
		builder.expensive = argumentType.expensive;
		builder.validationFn = argumentType.validate;
		builder.transformFn = argumentType.transform;
		builder.suggestionFn = argumentType.suggestions;
		return builder;
	}

	/**
	 * Sets the validation function for this type.
	 *
	 * @param fn - The validation function.
	 * @returns The {@link TypeBuilder} instance.
	 */
	validate(fn: t.check<T>) {
		this.validationFn = fn;
		return this;
	}

	/**
	 * Sets the transformation function for this type.
	 *
	 * If the `expensive` parameter is `true`, it indicates the transformation
	 * function is expensive to compute. If the default interface is used, type-checking
	 * will be disabled while typing an argument.
	 *
	 * @param fn - The transformation function.
	 * @param expensive - Whether the function is expensive.
	 * @returns The {@link TypeBuilder} instance.
	 */
	transform(fn: SingleArgumentType<T>["transform"], expensive = false) {
		this.transformFn = fn;
		this.expensive = expensive;
		return this;
	}

	/**
	 * Sets the suggestion function for this type.
	 *
	 * This function provides a list of suggestions for the type.
	 *
	 * @param fn - The suggestions function.
	 * @returns The {@link TypeBuilder} instance.
	 */
	suggestions(fn: SingleArgumentType<T>["suggestions"]) {
		this.suggestionFn = fn;
		return this;
	}

	/**
	 * Marks the type for registration.
	 *
	 * @returns The {@link TypeBuilder} instance.
	 */
	markForRegistration() {
		this.marked = true;
		return this;
	}

	/**
	 * Builds the type, returning a {@link SingleArgumentType} object.
	 *
	 * If the type has been marked for registration through {@link markForRegistration}, it will be added to
	 * the list of objects that will be registered when `register()` is called.
	 *
	 * @throws Will throw an error if the required functions were not defined
	 * @returns A {@link SingleArgumentType} object.
	 */
	build(): SingleArgumentType<T> {
		assert(this.validationFn !== undefined, "Validation function is required");
		assert(this.transformFn !== undefined, "Transform function is required");

		const argType = {
			kind: "single",
			name: this.name,
			expensive: this.expensive,
			validate: this.validationFn,
			transform: this.transformFn,
			suggestions: this.suggestionFn,
		} satisfies SingleArgumentType<T>;

		if (this.marked) {
			DecoratorMetadata.defineMetadata(argType, MetadataKey.Type, true);
		}

		return argType;
	}
}

/**
 * A helper class for building list argument types.
 */
export class ListTypeBuilder<T extends defined[]> {
	private expensive = false;
	private marked = false;
	private validationFn?: t.check<T>;
	private transformFn?: ListArgumentType<T>["transform"];
	private suggestionFn?: ListArgumentType<T>["suggestions"];

	private constructor(protected readonly name: string) {}

	/**
	 * Instantiates a {@link ListTypeBuilder} with the given name.
	 *
	 *
	 * @param name - The name of the type.
	 * @returns A {@link ListTypeBuilder} instance.
	 */
	static create<T extends defined[]>(name: string) {
		return new ListTypeBuilder<T>(name);
	}

	/**
	 * Creates a new {@link ListTypeBuilder} with the given name, extending
	 * from the provided type.
	 *
	 * @param name - The name of the type.
	 * @param argumentType - The type to extend from.
	 * @returns A {@link ListTypeBuilder} instance.
	 */
	static extend<T extends defined[]>(
		name: string,
		argumentType: ListArgumentType<T>,
	) {
		const builder = new ListTypeBuilder<T>(name);
		builder.expensive = argumentType.expensive;
		builder.validationFn = argumentType.validate;
		builder.transformFn = argumentType.transform;
		builder.suggestionFn = argumentType.suggestions;
		return builder;
	}

	/**
	 * Sets the validation function for this type.
	 *
	 * @param fn - The validation function.
	 * @returns The {@link ListTypeBuilder} instance.
	 */
	validate(fn: t.check<T>) {
		this.validationFn = fn;
		return this;
	}

	/**
	 * Sets the transformation function for this type.
	 *
	 * If the `expensive` parameter is `true`, it indicates the transformation
	 * function is expensive to compute. If the default interface is used, type-checking
	 * will be disabled while typing an argument.
	 *
	 * @param fn - The transformation function.
	 * @param expensive - Whether the function is expensive.
	 * @returns The {@link ListTypeBuilder} instance.
	 */
	transform(fn: ListArgumentType<T>["transform"], expensive = false) {
		this.transformFn = fn;
		this.expensive = expensive;
		return this;
	}

	/**
	 * Sets the suggestion function for this type.
	 *
	 * This function provides a list of suggestions for the type.
	 *
	 * @param fn - The suggestions function.
	 * @returns The {@link ListTypeBuilder} instance.
	 */
	suggestions(fn: ListArgumentType<T>["suggestions"]) {
		this.suggestionFn = fn;
		return this;
	}

	/**
	 * Marks the type for registration.
	 *
	 * @returns The {@link ListTypeBuilder} instance.
	 */
	markForRegistration() {
		this.marked = true;
		return this;
	}

	/**
	 * Builds the type, returning a {@link ListArgumentType} object.
	 *
	 * If the type has been marked for registration through {@link markForRegistration}, it will be added to
	 * the list of objects that will be registered when `register()` is called.
	 *
	 * @throws Will throw an error if the required functions were not defined
	 * @returns A {@link ListArgumentType} object.
	 */
	build(): ListArgumentType<T> {
		assert(this.validationFn !== undefined, "Validation function is required");
		assert(this.transformFn !== undefined, "Transform function is required");

		const argType = {
			kind: "list",
			name: this.name,
			expensive: this.expensive,
			validate: this.validationFn,
			transform: this.transformFn,
			suggestions: this.suggestionFn,
		} satisfies ListArgumentType<T>;

		if (this.marked) {
			DecoratorMetadata.defineMetadata(argType, MetadataKey.Type, true);
		}

		return argType;
	}
}
