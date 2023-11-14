import { Result } from "@rbxts/rust-classes";
import { t } from "@rbxts/t";
import { TransformationResult, TypeOptions } from "../types";

export const transformOk: <T extends defined>(value: T) => TransformationResult<T> = (value) => Result.ok(value);

export const transformErr: <T extends defined>(text: string) => TransformationResult<T> = (text: string) =>
	Result.err(text);

export class TypeBuilder<T extends defined> {
	private validationFn?: t.check<T>;
	private transformFn?: (text: string) => TransformationResult<T>;
	private suggestionFn?: (text: string) => string[];

	private constructor(private readonly name: string) {}

	static create<T extends defined>(name: string) {
		return new TypeBuilder<T>(name);
	}

	static extend<T extends defined>(name: string, options: TypeOptions<T>) {
		const builder = new TypeBuilder<T>(name);
		builder.validationFn = options.validate;
		builder.transformFn = options.transform;
		builder.suggestionFn = options.suggestions;
		return builder;
	}

	validate(validationFn: t.check<T>) {
		this.validationFn = validationFn;
		return this;
	}

	transform(transformFn: (text: string) => TransformationResult<T>) {
		this.transformFn = transformFn;
		return this;
	}

	suggestions(suggestionFn: () => string[]) {
		this.suggestionFn = suggestionFn;
		return this;
	}

	build(): TypeOptions<T> {
		assert(this.validationFn !== undefined, "Validation function is required");
		assert(this.transformFn !== undefined, "Transform function is required");
		return {
			name: this.name,
			validate: this.validationFn,
			transform: this.transformFn,
			suggestions: this.suggestionFn,
		};
	}
}
