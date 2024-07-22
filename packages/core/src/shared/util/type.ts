import { t } from "@rbxts/t";
import { MetadataKey } from "../core/decorators";
import { ArgumentType } from "../types";
import { MetadataReflect } from "./reflect";

type TransformFn<T> = ArgumentType<T>["transform"];
type SuggestionFn<T> = ArgumentType<T>["suggestions"];

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
	protected expensive = false;
	protected marked = false;
	protected validationFn?: t.check<T>;
	protected transformFn?: TransformFn<T>;
	protected suggestionFn?: SuggestionFn<T>;

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
	static extend<T>(name: string, argumentType: ArgumentType<T>) {
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
	transform(fn: TransformFn<T>, expensive = false) {
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
	suggestions(fn: SuggestionFn<T>) {
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
	 * Builds the type, returning an {@link ArgumentType} object.
	 *
	 * If the type has been marked for registration through {@link markForRegistration}, it will be added to
	 * the list of objects that will be registered when `register()` is called.
	 *
	 * @throws Will throw an error if the required functions were not defined
	 * @returns An {@link ArgumentType} object.
	 */
	build(): ArgumentType<T> {
		assert(this.validationFn !== undefined, "Validation function is required");
		assert(this.transformFn !== undefined, "Transform function is required");

		const argType = {
			name: this.name,
			expensive: this.expensive,
			validate: this.validationFn,
			transform: this.transformFn,
			suggestions: this.suggestionFn,
		} as ArgumentType<T>;

		if (this.marked) {
			MetadataReflect.defineMetadata(argType, MetadataKey.Type, true);
		}

		return argType;
	}
}
