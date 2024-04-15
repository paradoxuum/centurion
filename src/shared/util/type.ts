import { t } from "@rbxts/t";
import { ArgumentType } from "../types";

type TransformFn<T extends defined> = ArgumentType<T>["transform"];
type SuggestionFn = ArgumentType<defined>["suggestions"];

export namespace TransformResult {
	export type Object<T> = { ok: true; value: T } | { ok: false; value: string };

	/**
	 * Produces a successful `Result`, indicating that a transformation was successful.
	 *
	 * @param value - The resulting value of the transformation
	 */
	export function ok<T extends defined>(value: T): Object<T> {
		return {
			ok: true,
			value,
		};
	}

	/**
	 * Produces a failed `Result`, indicating that a transformation was not successful.
	 *
	 * @param text - The error message
	 */
	export function err<T extends defined>(text: string): Object<T> {
		return {
			ok: false,
			value: text,
		};
	}
}

export class TypeBuilder<T extends defined> {
	protected expensive = false;
	protected validationFn?: t.check<T>;
	protected transformFn?: TransformFn<T>;
	protected suggestionFn?: SuggestionFn;

	protected constructor(protected readonly name: string) {}

	/**
	 * Creates a {@link TypeBuilder}.
	 *
	 * @param name - The name of the type
	 * @returns A type builder
	 */
	static create<T extends defined>(name: string) {
		return new TypeBuilder<T>(name);
	}

	/**
	 * @param name - The name of the type
	 * @param options - The type to extend from
	 * @returns A builder extended from the given type
	 */
	static extend<T extends defined>(name: string, options: ArgumentType<T>) {
		const builder = new TypeBuilder<T>(name);
		builder.expensive = options.expensive;
		builder.validationFn = options.validate;
		builder.transformFn = options.transform;
		builder.suggestionFn = options.suggestions;
		return builder;
	}

	/**
	 * Sets the validation function for this type.
	 *
	 * @param validationFn - The type guard used to validate this type
	 * @returns The type builder
	 */
	validate(validationFn: t.check<T>) {
		this.validationFn = validationFn;
		return this;
	}

	/**
	 * Sets the transformation function for this type.
	 *
	 * If the `expensive` parameter is set to true, it indicates that
	 * the transform function will be expensive to compute. If the default
	 * interface is being used in this case, it will disable real-time
	 * checking while the user is typing the command.
	 *
	 * @param callback - The transformation function for this type
	 * @param expensive - Whether the function is expensive to compute
	 * @returns The type builder
	 */
	transform(callback: TransformFn<T>, expensive = false) {
		this.transformFn = callback;
		this.expensive = expensive;
		return this;
	}

	/**
	 * Sets the suggestion function for this type.
	 *
	 * This function should provide a list of suggestions for this type.
	 *
	 * @param callback - The suggestion function for this type
	 * @returns The type builder
	 */
	suggestions(callback: SuggestionFn) {
		this.suggestionFn = callback;
		return this;
	}

	/**
	 * Creates a {@link ArgumentType} using the options that were provided to the builder.
	 *
	 * @throws Will throw an error if the required options were not provided
	 *
	 * @returns A {@link ArgumentType} created from the options provided to the builder
	 */
	build(): ArgumentType<T> {
		assert(this.validationFn !== undefined, "Validation function is required");
		assert(this.transformFn !== undefined, "Transform function is required");

		return {
			name: this.name,
			expensive: this.expensive,
			validate: this.validationFn,
			transform: this.transformFn,
			suggestions: this.suggestionFn,
		};
	}
}
