/// <reference types="@rbxts/testez/globals" />

import { CommandPath } from "../core/path";

export = () => {
	it("should create a path from a string", () => {
		const pathString = "root part1 part2";
		const path = CommandPath.fromString(pathString);
		expect(path.toString()).to.be.equal(pathString);
	});

	describe("operations", () => {
		it("should append parts to the path", () => {
			const path = CommandPath.fromString("root part1 part2");
			path.append("part3");
			expect(path.getPart(path.getSize() - 1)).to.equal("part3");

			path.append("part4");
			expect(path.getPart(path.getSize() - 1)).to.equal("part4");
		});

		it("should remove parts from the path", () => {
			const path = CommandPath.fromString("root part1 part2");
			path.remove(0);
			expect(path.getPart(0)).to.equal("part1");

			path.remove(path.getSize() - 1);
			expect(path.getPart(path.getSize() - 1)).to.equal("part1");
		});

		it("should remove all parts from the path", () => {
			const path = CommandPath.fromString("root part1 part");
			path.clear();
			expect(path.getSize()).to.equal(0);
		});

		it("should return a slice of the path", () => {
			const path = CommandPath.fromString("root part1 part2 part3");
			path.slice(1, 2);
			expect(path.toString()).to.equal("part1 part2");
		});
	});

	describe("descendant operations", () => {
		it("should check if a path is a child of another", () => {
			const path = CommandPath.fromString("root part1 part2");
			const path2 = CommandPath.fromString("root part1 part2 part3");
			expect(path2.isChildOf(path)).to.equal(true);
			expect(path.isChildOf(path2)).to.equal(false);
		});

		it("should check if a path is a descendant of another", () => {
			const path = CommandPath.fromString("root part1 part2");
			const path2 = CommandPath.fromString("root part1 part2 part3 part4");
			expect(path2.isDescendantOf(path)).to.equal(true);
			expect(path.isDescendantOf(path2)).to.equal(false);
		});
	});
};
