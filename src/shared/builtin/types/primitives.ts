import { t } from "@rbxts/t";
import { CommanderType } from ".";
import { BaseRegistry } from "../../core/registry";
import { TransformResult, TypeBuilder } from "../../util/type";

const toNumberTransformation = (text: string) => {
	const num = tonumber(text);
	if (num === undefined) {
		return TransformResult.err<number>("Invalid number");
	}

	return TransformResult.ok(num);
};

const getNumTransformation =
	(validateFn: t.check<number>, errMsg: string) => (text: string) => {
		const numResult = toNumberTransformation(text);
		if (!numResult.ok) {
			return numResult;
		}

		const num = numResult.value;
		return validateFn(num)
			? TransformResult.ok(num)
			: TransformResult.err<number>(errMsg);
	};

const stringType = TypeBuilder.create(CommanderType.String)
	.validate(t.string)
	.transform((text) => TransformResult.ok(text))
	.build();

const numberType = TypeBuilder.create(CommanderType.Number)
	.validate(t.number)
	.transform(toNumberTransformation)
	.build();

const integerType = TypeBuilder.create(CommanderType.Integer)
	.validate(t.integer)
	.transform(getNumTransformation(t.integer, "Invalid integer"))
	.build();

const truthyValues = new Set<string>(["true", "yes", "y"]);
const falsyValues = new Set<string>(["false", "no", "n"]);
const booleanType = TypeBuilder.create(CommanderType.Boolean)
	.validate(t.boolean)
	.transform((text) => {
		const textLower = text.lower();
		if (truthyValues.has(textLower)) return TransformResult.ok(true);
		if (falsyValues.has(textLower)) return TransformResult.ok(false);

		return TransformResult.err("Invalid boolean");
	})
	.build();

export = (registry: BaseRegistry) => {
	registry.registerTypes(stringType, numberType, integerType, booleanType);
};
