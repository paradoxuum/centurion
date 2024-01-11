import { Result } from "@rbxts/rust-classes";
import { t } from "@rbxts/t";
import { TransformationResult, TypeOptions } from "../types";

export namespace TransformResult {
	/**
	 * Produces a successful `Result`, indicating that a transformation was successful.
	 *
	 * @param value - The resulting value of the transformation
	 */
	export const ok: <T extends defined>(value: T) => TransformationResult<T> = (
		value,
	) => Result.ok(value);

	/**
	 * Produces a failed `Result`, indicating that a transformation was not successful.
	 *
	 * @param text - The error message
	 */
	export const err: <T extends defined>(
		text: string,
	) => TransformationResult<T> = (text: string) => Result.err(text);
}

export class TypeBuilder<T extends defined> {
	private expensive = false;
	private validationFn?: t.check<T>;
	private transformFn?: (text: string) => TransformationResult<T>;
	private suggestionFn?: (text: string) => string[];

	private constructor(private readonly name: string) {}

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
	static extend<T extends defined>(name: string, options: TypeOptions<T>) {
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
	 * @param transformFn - The transformation function for this type
	 * @param expensive - Whether the function is expensive to compute
	 * @returns The type builder
	 */
	transform(
		transformFn: (text: string) => TransformationResult<T>,
		expensive = false,
	) {
		this.transformFn = transformFn;
		this.expensive = expensive;
		return this;
	}

	/**
	 * Sets the suggestion function for this type.
	 *
	 * This function should provide a list of suggestions for this type.
	 *
	 * @param suggestionFn - The suggestion function for this type
	 * @returns The type builder
	 */
	suggestions(suggestionFn: () => string[]) {
		this.suggestionFn = suggestionFn;
		return this;
	}

	/**
	 * Creates a {@link TypeOptions} using the options that were provided to the builder.
	 *
	 * @throws Will throw an error if the required options were not provided
	 *
	 * @returns A {@link TypeOptions} created from the options provided to the builder
	 */
	build(): TypeOptions<T> {
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
