import { t } from "@rbxts/t";
import { CommanderType } from ".";
import { BaseRegistry } from "../../core/registry";
import { TransformResult, TypeBuilder } from "../../util/type";

const transformToNumber = (text: string) => {
	const num = tonumber(text);
	if (num === undefined) {
		return TransformResult.err<number>("Invalid number");
	}

	return TransformResult.ok(num);
};

const stringType = TypeBuilder.create<string>(CommanderType.String)
	.validate(t.string)
	.transform((text) => TransformResult.ok(text))
	.build();

const numberType = TypeBuilder.create<number>(CommanderType.Number)
	.validate(t.number)
	.transform(transformToNumber)
	.build();

const integerType = TypeBuilder.create<number>(CommanderType.Integer)
	.validate(t.integer)
	.transform((text) => {
		const numResult = transformToNumber(text);
		if (!numResult.ok) {
			return numResult;
		}

		const num = numResult.value;
		return t.integer(num)
			? TransformResult.ok(num)
			: TransformResult.err("Invalid integer");
	})
	.build();

const truthyValues = new Set<string>(["true", "yes", "y"]);
const falsyValues = new Set<string>(["false", "no", "n"]);
const booleanType = TypeBuilder.create<boolean>(CommanderType.Boolean)
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
