import { ArrayUtil } from "../util/data";

/**
 * A representation of a command or group's path
 */
export class Path {
	private pathString: string;

	constructor(protected readonly parts: string[]) {
		this.pathString = parts.join("/");
	}

	static fromString(path: string) {
		return new Path(path.split("/"));
	}

	static empty() {
		return new Path([]);
	}

	/**
	 * Returns a copy of the {@link Path}'s parts
	 */
	getParts() {
		return [...this.parts];
	}

	/**
	 * Returns the part of this path at the given index.
	 *
	 * @param index The index of the part
	 * @returns The part at the given index
	 */
	getPart(index: number) {
		assert(index > -1 && index < this.parts.size(), "Index out of bounds");
		return this.parts[index];
	}

	/**
	 * Gets the root (first element) of this path
	 *
	 * @returns The root of this path
	 */
	getRoot() {
		return this.parts[0];
	}

	/**
	 * Gets the tail (last element) of this path
	 *
	 * @returns The tail of this path
	 */
	getTail() {
		if (this.parts.isEmpty()) {
			return "";
		}

		return this.parts[this.parts.size() - 1];
	}

	/**
	 * Gets the size of the path
	 *
	 * @returns The size of the path
	 */
	getSize() {
		return this.parts.size();
	}

	/**
	 * Gets the parent path of this path.
	 *
	 * If the path is a command, this returns an empty path.
	 *
	 * @returns The parent path
	 */
	getParent() {
		if (this.isCommand()) {
			return new Path([]);
		}

		return new Path(ArrayUtil.slice(this.parts, 0, this.parts.size() - 1));
	}

	/**
	 * Returns whether the path represents an executable command,
	 * meaning it only has a single path element.
	 *
	 * @returns Whether the path is a root path
	 */
	isCommand() {
		return this.parts.size() === 1;
	}

	/**
	 * Tests whether this path is the child of the given path.
	 *
	 * @param other Path to test against
	 * @returns True if this path is the child of the given path, false if not
	 */
	isChildOf(other: Path) {
		const otherSize = other.getSize();
		if (otherSize !== this.parts.size() - 1) {
			return false;
		}

		for (const i of $range(0, otherSize - 1)) {
			if (other.parts[i] !== this.parts[i]) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Tests whether this path is the descendant of the given path.
	 *
	 * @param other Path to test against
	 * @returns True if this path is the descendant of the given path, false if not
	 */
	isDescendantOf(other: Path) {
		const otherSize = other.getSize();
		if (this.parts.size() < otherSize) {
			return false;
		}

		for (const i of $range(0, otherSize - 1)) {
			if (other.parts[i] !== this.parts[i]) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Returns a new {@link Path} from a slice of this path.
	 *
	 * @param from The start index
	 * @param to The end index
	 * @returns A new path containing a slice of this path
	 */
	slice(from: number, to?: number) {
		return new Path(
			ArrayUtil.slice(this.parts, from, to !== undefined ? to + 1 : undefined),
		);
	}

	/**
	 * Determines if this path equals the given {@link Path}.
	 *
	 * @param other The path to compare against
	 * @returns True if the paths are equal, false if not
	 */
	equals(other: Path) {
		return this.toString() === other.toString();
	}

	/**
	 * Returns the string representation of this path.
	 *
	 * @returns The string representation of the path
	 */
	toString() {
		return this.pathString;
	}

	/**
	 * Adds the given parts to the path.
	 *
	 * @param parts The parts to append
	 */
	append(...parts: string[]) {
		for (const part of parts) {
			this.parts.push(part);
		}
		this.pathString = this.parts.join("/");
	}

	/**
	 * Removes the part at the given index
	 *
	 * @param index The index of the part to remove
	 */
	remove(index: number) {
		assert(index > -1 && index < this.parts.size(), "Index out of bounds");
		this.parts.remove(index);
	}

	/**
	 * Clears all parts from the path, leaving an empty path
	 */
	clear() {
		this.parts.clear();
	}

	isEmpty() {
		return this.parts.isEmpty();
	}

	*iter() {
		for (const part of this.parts) {
			yield part;
		}
	}
}

/**
 * An immutable version of a {@link Path}.
 *
 * Operations that would mutate the path such as `append` or `remove` now
 * return a new {@link ImmutablePath} with the changes made.
 */
export class ImmutablePath extends Path {
	/**
	 * Returns a new {@link ImmutablePath} from a given {@link Path}.
	 *
	 * @param path The {@link Path}
	 * @returns A new {@link ImmutablePath}
	 */
	static fromPath(path: Path) {
		return new ImmutablePath(path.getParts());
	}

	static fromString(path: string) {
		return new ImmutablePath(path.split("/"));
	}

	static empty() {
		return new ImmutablePath([]);
	}

	getParent() {
		if (this.isCommand()) {
			return new ImmutablePath([]);
		}

		return this.slice(0, this.parts.size() - 2);
	}

	slice(from: number, to?: number) {
		return new ImmutablePath(
			ArrayUtil.slice(this.parts, from, to !== undefined ? to + 1 : undefined),
		);
	}

	/**
	 * Returns a new {@link ImmutablePath} with the given parts appended.
	 *
	 * @param parts The parts to append
	 * @returns A new {@link ImmutablePath} with the given parts appended
	 */
	append(...parts: string[]) {
		return new ImmutablePath([...this.parts, ...parts]);
	}

	/**
	 * Returns a new {@link ImmutablePath} with the part at the given index
	 * removed.
	 *
	 * @param index The index of the part to remove
	 * @returns A path with the part removed
	 */
	remove(index: number) {
		assert(index > -1 && index < this.parts.size(), "Index out of bounds");

		const parts = [...this.parts];
		parts.remove(index);
		return new ImmutablePath(parts);
	}

	/**
	 * Creates a new empty {@link ImmutablePath}.
	 *
	 * @returns An empty path
	 */
	clear() {
		return new ImmutablePath([]);
	}
}
