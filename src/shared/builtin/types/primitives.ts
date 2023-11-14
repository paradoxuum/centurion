import { t } from "@rbxts/t";
import { BuiltInTypes } from ".";
import { BaseRegistry } from "../../core/registry";
import { TypeBuilder, transformErr, transformOk } from "../../util/type";

const toNumberTransformation = (text: string) => {
	const num = tonumber(text);
	if (num === undefined) {
		return transformErr<number>("Invalid number");
	}

	return transformOk(num);
};

const getNumTransformation = (validateFn: t.check<number>, errMsg: string) => (text: string) => {
	const numResult = toNumberTransformation(text);
	if (numResult.isErr()) {
		return numResult;
	}

	const num = numResult.unwrap();
	return validateFn(num) ? transformOk(num) : transformErr<number>(errMsg);
};

const stringType = TypeBuilder.create(BuiltInTypes.String)
	.validate(t.string)
	.transform((text) => transformOk(text))
	.build();

const numberType = TypeBuilder.create(BuiltInTypes.Number).validate(t.number).transform(toNumberTransformation).build();

const integerType = TypeBuilder.create(BuiltInTypes.Number)
	.validate(t.integer)
	.transform(getNumTransformation(t.integer, "Invalid integer"))
	.build();

const truthyValues = new Set<string>(["true", "yes", "y"]);
const falsyValues = new Set<string>(["false", "no", "n"]);
const booleanType = TypeBuilder.create(BuiltInTypes.Boolean)
	.validate(t.boolean)
	.transform((text) => {
		const textLower = text.lower();
		if (truthyValues.has(textLower)) {
			return transformOk(true);
		} else if (falsyValues.has(textLower)) {
			return transformOk(false);
		}

		return transformErr("Invalid boolean");
	})
	.build();

export = (registry: BaseRegistry) => {
	registry.registerTypes(stringType, numberType, integerType, booleanType);
};
