import { describe, expect, test } from "@rbxts/jest-globals";
import { endsWithSpace, formatPartsAsPath, splitString } from "../util/string";

describe("split string", () => {
	test("splits one space", () => {
		const testString = "part1 part2 part3";
		const parts = splitString(testString, " ");
		expect(parts.size()).toBe(3);
	});

	test("splits multiple spaces", () => {
		const testString = "part1   part2  part3    part4  ";
		const parts = splitString(testString, " ");
		expect(parts.size()).toBe(4);
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

test("determines if a string ends in a space", () => {
	expect(endsWithSpace("test")).toBeFalsy();
	expect(endsWithSpace("test   ")).toBeTruthy();
});

test("formats string array as a path string", () => {
	const pathString = "part1/part2/part3";
	const parts = pathString.split("/");
	expect(formatPartsAsPath(parts)).toBe(pathString);
});
