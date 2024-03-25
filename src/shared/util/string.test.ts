import { TestProps } from "@rbxts/midori";
import { endsWithSpace, formatPartsAsPath, splitString } from "./string";

export = (x: TestProps) => {
	x.nested("split string", () => {
		x.test("splits one space", () => {
			const testString = "part1 part2 part3";
			const parts = splitString(testString, " ");
			x.assertEqual(parts.size(), 3);
		});

		x.test("splits multiple spaces", () => {
			const testString = "part1   part2  part3    part4  ";
			const parts = splitString(testString, " ");
			x.assertEqual(parts.size(), 4);
		});

		x.test("takes into account quoted sentences", () => {
			const testString = `part1 "part2 but quoted" part3 'part4' "part5"`;
			const parts = splitString(testString, " ");
			x.assertEqual(parts.size(), 5);
			x.assertEqual(parts[1], "part2 but quoted");
			x.assertEqual(parts[3], "part4");
			x.assertEqual(parts[4], "part5");
		});
	});

	x.test("determines if a string ends in a space", () => {
		x.assertEqual(endsWithSpace("test"), false);
		x.assertEqual(endsWithSpace("test   "), true);
	});

	x.test("formats string array as a path string", () => {
		const pathString = "part1/part2/part3";
		const parts = pathString.split("/");
		x.assertEqual(formatPartsAsPath(parts), pathString);
	});
};
