import { describe, expect, test } from "@rbxts/jest-globals";
import { RegistryPath } from "../core/path";

test("create a path from a string", () => {
	const testString = "root/part1/part2";
	const path = RegistryPath.fromString(testString);
	expect(path.toString()).toBe(testString);
});

describe("path operations", () => {
	test("append parts to a path", () => {
		const path = RegistryPath.fromString("root/part1/part2");
		path.append("part3");
		expect(path.part(path.size() - 1)).toBe("part3");

		path.append("part4");
		expect(path.part(path.size() - 1)).toBe("part4");
	});

	test("remove parts from a path", () => {
		const path = RegistryPath.fromString("root/part1/part2");
		path.remove(0);
		expect(path.part(0)).toBe("part1");

		path.remove(path.size() - 1);
		expect(path.part(path.size() - 1)).toBe("part1");
	});

	test("remove all parts from a path", () => {
		const path = RegistryPath.fromString("root/part1/part");
		path.clear();
		expect(path.size()).toBe(0);
	});

	test("return a slice of a path", () => {
		let path = RegistryPath.fromString("root/part1/part2/part3");
		path = path.slice(1, 2);
		expect(path.toString()).toBe("part1/part2");
	});
});

describe("descendant operations", () => {
	test("check if a path is a child of another", () => {
		const path = RegistryPath.fromString("root/part1/part2");
		const path2 = RegistryPath.fromString("root/part1/part2/part3");
		expect(path2.isChildOf(path)).toBeTruthy();
		expect(path.isChildOf(path2)).toBeFalsy();
	});

	test("check if a path is a descendant of another", () => {
		const path = RegistryPath.fromString("root/part1/part2");
		const path2 = RegistryPath.fromString("root/part1/part2/part3/part4");
		expect(path2.isDescendantOf(path)).toBeTruthy();
		expect(path.isDescendantOf(path2)).toBeFalsy();
	});
});
