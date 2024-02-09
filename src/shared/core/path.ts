import { ArrayUtil } from "../util/data";

/**
 * A representation of a command or command group's path
 */
export class CommandPath {
	private pathString: string;

	constructor(protected readonly parts: string[]) {
		this.pathString = parts.join("/");
	}

	static fromString(path: string) {
		return new CommandPath(path.split("/"));
	}

	static empty() {
		return new CommandPath([]);
	}

	/**
	 * Returns a copy of the {@link CommandPath}'s parts
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
	 * Gets the path of the category the command is in.
	 *
	 * This returns `undefined` if the path represents a root command's path.
	 *
	 * @returns The command category's path
	 */
	getCategoryPath() {
		if (this.isCommand()) {
			return;
		}

		return this.parts[this.parts.size() - 2];
	}

	/**
	 * Returns the subcommand path of this path if the path has
	 * more than one part.
	 *
	 * This simply drops the command parent's name.
	 *
	 * @returns The subcommand path, or undefined if the path has 1 part
	 */
	getSubcommandPath() {
		if (this.isCommand()) return;

		const parts = [...this.parts];
		parts.remove(0);
		return new CommandPath(parts);
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
	isChildOf(other: CommandPath) {
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
	isDescendantOf(other: CommandPath) {
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
	 * Returns a new {@link CommandPath} from a slice of this path.
	 *
	 * @param from The start index
	 * @param to The end index
	 * @returns A new path containing a slice of this path
	 */
	slice(from: number, to?: number) {
		return new CommandPath(
			ArrayUtil.slice(this.parts, from, to !== undefined ? to + 1 : undefined),
		);
	}

	/**
	 * Determines if this path equals the given {@link CommandPath}.
	 *
	 * @param other The path to compare against
	 * @returns True if the paths are equal, false if not
	 */
	equals(other: CommandPath) {
		return ArrayUtil.equals(this.parts, other.parts);
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
	 * Adds the given parts to the command path.
	 *
	 * @param parts The parts to append
	 */
	append(...parts: string[]) {
		for (const part of parts) {
			this.parts.push(part);
		}

		let newPathString = this.pathString;
		for (const part of parts) {
			newPathString = `${newPathString}/${part}`;
		}
		this.pathString = newPathString;
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
 * An immutable version of a {@link CommandPath}.
 *
 * Operations that would mutate the path such as `append` or `remove` now
 * return a new {@link ImmutableCommandPath} with the changes made.
 */
export class ImmutableCommandPath extends CommandPath {
	/**
	 * Returns a new {@link ImmutableCommandPath} from a given {@link CommandPath}.
	 *
	 * @param path The {@link CommandPath}
	 * @returns A new {@link ImmutableCommandPath}
	 */
	static fromPath(path: CommandPath) {
		return new ImmutableCommandPath(path.getParts());
	}

	static fromString(path: string) {
		return new ImmutableCommandPath(path.split("/"));
	}

	static empty() {
		return new ImmutableCommandPath([]);
	}

	slice(from: number, to?: number) {
		return new ImmutableCommandPath(
			ArrayUtil.slice(this.parts, from, to !== undefined ? to + 1 : undefined),
		);
	}

	/**
	 * Returns a new {@link ImmutableCommandPath} with the given parts appended.
	 *
	 * @param parts The parts to append
	 * @returns A new {@link ImmutableCommandPath} with the given parts appended
	 */
	append(...parts: string[]) {
		return new ImmutableCommandPath([...this.parts, ...parts]);
	}

	/**
	 * Returns a new {@link ImmutableCommandPath} with the part at the given index
	 * removed.
	 *
	 * @param index The index of the part to remove
	 * @returns A command path with the part removed
	 */
	remove(index: number) {
		assert(index > -1 && index < this.parts.size(), "Index out of bounds");

		const parts = [...this.parts];
		parts.remove(index);
		return new ImmutableCommandPath(parts);
	}

	/**
	 * Creates a new empty {@link ImmutableCommandPath}.
	 *
	 * @returns An empty command path
	 */
	clear() {
		return new ImmutableCommandPath([]);
	}
}
