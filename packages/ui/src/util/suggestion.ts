import { BaseRegistry, CommandOptions, RegistryPath } from "@rbxts/centurion";
import { ArrayUtil } from "@rbxts/centurion/out/shared/util/data";
import { Players } from "@rbxts/services";
import { Suggestion } from "../types";

const MAX_OTHER_SUGGESTIONS = 3;

function getSortedIndices(max: number, strings: string[], text?: string) {
	// If no text is provided, sort alphabetically
	if (text === undefined) {
		const sorted = [...strings].sort().map((_, index) => index);
		return ArrayUtil.slice(sorted, 0, math.min(sorted.size(), max));
	}

	// Otherwise, sort by the closest match
	const textLower = text.lower();
	const textEndIndex = text.size();

	const results: Array<[number, number]> = [];
	for (const i of $range(0, strings.size() - 1)) {
		const part = strings[i].lower().sub(0, textEndIndex);
		if (part === textLower) {
			results.push([part.size(), i]);
		}
	}

	results.sort((a, b) => {
		if (a[0] === b[0]) {
			return strings[a[1]] < strings[b[1]];
		}
		return a[0] < b[0];
	});

	return ArrayUtil.slice(results, 0, math.min(results.size(), max)).map(
		(val) => val[1],
	);
}

export function getArgumentSuggestion(
	registry: BaseRegistry,
	path: RegistryPath,
	index: number,
	text?: string,
): Suggestion | undefined {
	const command = registry.getCommand(path);
	if (command === undefined) return;

	const args = command.options.arguments;
	if (args === undefined || args.isEmpty()) return;
	if (index < 0 || index >= args.size()) return;

	const arg = args[index];
	const typeObject = registry.getType(arg.type);
	if (typeObject === undefined) return;

	const argSuggestions =
		arg.suggestions !== undefined ? [...arg.suggestions] : [];
	if (typeObject.suggestions !== undefined) {
		for (const suggestion of typeObject.suggestions(
			text ?? "",
			Players.LocalPlayer,
		)) {
			argSuggestions.push(suggestion);
		}
	}

	// If the type is not marked as "expensive", transform the text into the type
	// If the transformation fails, include the error message in the suggestion
	let errorText: string | undefined;
	const [success, err] = pcall(() => {
		if (typeObject.expensive) return;
		const transformResult = typeObject.transform(
			text ?? "",
			Players.LocalPlayer,
		);

		if (transformResult.ok) return;
		errorText = transformResult.value;
	});

	if (!success) {
		errorText = "Failed to transform argument";
		warn(err);
	}

	const otherSuggestions = getSortedIndices(
		MAX_OTHER_SUGGESTIONS,
		argSuggestions,
		text,
	).map((index) => argSuggestions[index]);

	return {
		main: {
			type: "argument",
			title: arg.name,
			description: arg.description,
			dataType: typeObject.name,
			optional: arg.optional ?? false,
			error: errorText,
		},
		others: otherSuggestions,
	};
}

export function getCommandSuggestion(
	registry: BaseRegistry,
	parentPath?: RegistryPath,
	text?: string,
): Suggestion | undefined {
	const paths =
		parentPath !== undefined
			? registry.getChildPaths(parentPath)
			: registry.getRootPaths();
	if (paths.isEmpty()) return;

	const pathNames = paths.map((path) => path.tail());
	const sortedPaths = getSortedIndices(
		MAX_OTHER_SUGGESTIONS + 1,
		pathNames,
		text,
	);
	if (sortedPaths.isEmpty()) return;

	const firstPath = paths[sortedPaths[0]];
	const mainData =
		registry.getCommand(firstPath)?.options ??
		registry.getGroup(firstPath)?.options;
	if (mainData === undefined) return;

	const otherNames =
		sortedPaths.size() > 1
			? ArrayUtil.slice(sortedPaths, 1).map((index) => pathNames[index])
			: [];

	return {
		main: {
			type: "command",
			title: firstPath.tail(),
			description: mainData.description,
			shortcuts: (mainData as CommandOptions).shortcuts,
		},
		others: otherNames,
	};
}
