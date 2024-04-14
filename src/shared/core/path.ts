import { ArrayUtil } from "../util/data";

/**
 * A representation of a command or group's path
 */
export class RegistryPath {
	private pathString: string;

	constructor(protected readonly parts: string[]) {
		this.pathString = parts.join("/");
	}

	static fromString(path: string) {
		return new RegistryPath(path.split("/"));
	}

	static empty() {
		return new RegistryPath([]);
	}

	/**
	 * Returns a copy of the {@link RegistryPath}'s parts
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
			return new RegistryPath([]);
		}

		return new RegistryPath(
			ArrayUtil.slice(this.parts, 0, this.parts.size() - 1),
		);
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
	isChildOf(other: RegistryPath) {
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
	isDescendantOf(other: RegistryPath) {
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
	 * Returns a new {@link RegistryPath} from a slice of this path.
	 *
	 * @param from The start index
	 * @param to The end index
	 * @returns A new path containing a slice of this path
	 */
	slice(from: number, to?: number) {
		return new RegistryPath(
			ArrayUtil.slice(this.parts, from, to !== undefined ? to + 1 : undefined),
		);
	}

	/**
	 * Determines if this path equals the given {@link RegistryPath}.
	 *
	 * @param other The path to compare against
	 * @returns True if the paths are equal, false if not
	 */
	equals(other: RegistryPath) {
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
 * An immutable version of a {@link RegistryPath}.
 *
 * Operations that would mutate the path such as `append` or `remove` now
 * return a new {@link ImmutableRegistryPath} with the changes made.
 */
export class ImmutableRegistryPath extends RegistryPath {
	/**
	 * Returns a new {@link ImmutableRegistryPath} from a given {@link RegistryPath}.
	 *
	 * @param path The {@link RegistryPath}
	 * @returns A new {@link ImmutableRegistryPath}
	 */
	static fromPath(path: RegistryPath) {
		return new ImmutableRegistryPath(path.getParts());
	}

	static fromString(path: string) {
		return new ImmutableRegistryPath(path.split("/"));
	}

	static empty() {
		return new ImmutableRegistryPath([]);
	}

	getParent() {
		if (this.isCommand()) {
			return new ImmutableRegistryPath([]);
		}

		return this.slice(0, this.parts.size() - 2);
	}

	slice(from: number, to?: number) {
		return new ImmutableRegistryPath(
			ArrayUtil.slice(this.parts, from, to !== undefined ? to + 1 : undefined),
		);
	}

	/**
	 * Returns a new {@link ImmutableRegistryPath} with the given parts appended.
	 *
	 * @param parts The parts to append
	 * @returns A new {@link ImmutableRegistryPath} with the given parts appended
	 */
	append(...parts: string[]) {
		return new ImmutableRegistryPath([...this.parts, ...parts]);
	}

	/**
	 * Returns a new {@link ImmutableRegistryPath} with the part at the given index
	 * removed.
	 *
	 * @param index The index of the part to remove
	 * @returns A path with the part removed
	 */
	remove(index: number) {
		assert(index > -1 && index < this.parts.size(), "Index out of bounds");

		const parts = [...this.parts];
		parts.remove(index);
		return new ImmutableRegistryPath(parts);
	}

	/**
	 * Creates a new empty {@link ImmutableRegistryPath}.
	 *
	 * @returns An empty path
	 */
	clear() {
		return new ImmutableRegistryPath([]);
	}
}
