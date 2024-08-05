import { describe, expect, test } from "@rbxts/jest-globals";
import { splitString } from "../util/string";

describe("split string", () => {
	test("splits single characters", () => {
		const spaceString = "part1 part2 part3";
		expect(splitString(spaceString, " ").size()).toBe(3);

		const commaString = "part1,part2,part3";
		expect(splitString(commaString, ",").size()).toBe(3);
	});

	test("splits multiple characters", () => {
		const spaceString = "part1   part2  part3  ";
		expect(splitString(spaceString, " ").size()).toBe(3);

		const commaString = "part1,,part2,,part3,,";
		expect(splitString(commaString, ",").size()).toBe(3);
	});

	test("takes into account quoted sentences", () => {
		const testString = `part1 "part2 but quoted" part3 'part4' "part5"`;
		const parts = splitString(testString, " ");
		expect(parts.size()).toBe(5);
		expect(parts[1]).toBe("part2 but quoted");
		expect(parts[3]).toBe("part4");
		expect(parts[4]).toBe("part5");
	});
});
