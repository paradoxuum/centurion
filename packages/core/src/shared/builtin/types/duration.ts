import { t } from "@rbxts/t";
import { CenturionType } from ".";
import { BaseRegistry, TransformResult, TypeBuilder } from "../../core";

const DAY_SECONDS = 86400;
const YEAR_DAYS = 365.25;
const UNIT_VALUES: Record<string, number> = {
	second: 1,
	minute: 60,
	hour: 3600,
	day: DAY_SECONDS,
	week: DAY_SECONDS * 7,
	month: DAY_SECONDS * (YEAR_DAYS / 12),
	year: DAY_SECONDS * YEAR_DAYS,
};

const UNITS = new Map<string, string>();

const assignUnit = (unit: string, aliases: string[]) => {
	UNITS.set(unit, unit);
	for (const alias of aliases) {
		UNITS.set(alias, unit);
	}
};

assignUnit("second", ["s", "sec", "secs", "seconds"]);
assignUnit("minute", ["m", "min", "mins", "minutes"]);
assignUnit("hour", ["h", "hr", "hrs", "hours"]);
assignUnit("day", ["d", "days"]);
assignUnit("week", ["w", "wk", "wks", "weeks"]);
assignUnit("month", ["m", "mo", "mos", "months"]);
assignUnit("year", ["y", "yr", "yrs", "years"]);

const durationType = TypeBuilder.create<number>(CenturionType.Duration)
	.validate(t.integer)
	.transform((value: string) => {
		if (value === "0") return TransformResult.ok(0);

		let total = 0;

		const text = value.gsub(",", "")[0];
		for (const [component] of text.gmatch("%d+%a+")) {
			const [numStr, unit] = (component as string).match("(%d+)(%a+)");

			const num = tonumber(numStr);
			if (num === undefined) {
				return TransformResult.err("Invalid number");
			}

			if (!typeIs(unit, "string")) {
				return TransformResult.err("Invalid unit");
			}

			const unitKey = UNITS.get(unit.lower());
			const unitValue =
				unitKey !== undefined ? UNIT_VALUES[unitKey] : undefined;
			if (unitValue === undefined) {
				return TransformResult.err(`Invalid unit: ${unit}`);
			}
			total += num * unitValue;
		}
		return TransformResult.ok(total);
	})
	.build();

export = (registry: BaseRegistry) => {
	registry.registerType(durationType);
};
