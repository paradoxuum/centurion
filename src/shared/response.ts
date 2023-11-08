import { Result } from "@rbxts/rust-classes";

export type TransformationResult<T extends defined> = Result<T, string>;

export const transformOk: <T extends defined>(value: T) => TransformationResult<T> = (value) => Result.ok(value);

export const transformErr: <T extends defined>(text: string) => TransformationResult<T> = (text: string) =>
	Result.err(text);
