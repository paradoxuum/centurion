import { TestProps } from "@rbxts/midori";
import { Path } from "./path";

export = (x: TestProps) => {
	x.test("create a path from a string", () => {
		const testString = "root/part1/part2";
		const path = Path.fromString(testString);
		x.assertEqual(path.toString(), testString);
	});

	x.nested("operations", () => {
		x.test("append parts to the path", () => {
			const path = Path.fromString("root/part1/part2");
			path.append("part3");
			x.assertEqual(path.getPart(path.getSize() - 1), "part3");

			path.append("part4");
			x.assertEqual(path.getPart(path.getSize() - 1), "part4");
		});

		x.test("remove parts from the path", () => {
			const path = Path.fromString("root/part1/part2");
			path.remove(0);
			x.assertEqual(path.getPart(0), "part1");

			path.remove(path.getSize() - 1);
			x.assertEqual(path.getPart(path.getSize() - 1), "part1");
		});

		x.test("remove all parts from the path", () => {
			const path = Path.fromString("root/part1/part");
			path.clear();
			x.assertEqual(path.getSize(), 0);
		});

		x.test("return a slice of the path", () => {
			let path = Path.fromString("root/part1/part2/part3");
			path = path.slice(1, 2);
			x.assertEqual(path.toString(), "part1/part2");
		});
	});

	x.nested("descendant operations", () => {
		x.test("check if a path is a child of another", () => {
			const path = Path.fromString("root/part1/part2");
			const path2 = Path.fromString("root/part1/part2/part3");
			x.assertEqual(path2.isChildOf(path), true);
			x.assertEqual(path.isChildOf(path2), false);
		});

		x.test("check if a path is a descendant of another", () => {
			const path = Path.fromString("root/part1/part2");
			const path2 = Path.fromString("root/part1/part2/part3/part4");
			x.assertEqual(path2.isDescendantOf(path), true);
			x.assertEqual(path.isDescendantOf(path2), false);
		});
	});
};
