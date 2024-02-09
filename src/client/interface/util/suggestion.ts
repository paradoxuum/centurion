import { CommandPath } from "../../../shared";
import { ArrayUtil } from "../../../shared/util/data";
import { CommanderClient } from "../../core";
import { Suggestion } from "../types";

const MAX_OTHER_SUGGESTIONS = 3;

export function getArgumentSuggestion(
	path: CommandPath,
	index: number,
	text?: string,
): Suggestion | undefined {
	const command = CommanderClient.registry().getCommand(path);
	if (command === undefined) return;

	const args = command.options.arguments;
	if (args === undefined || args.isEmpty()) return;
	if (index < 0 || index > args.size()) return;

	const arg = args[index];
	const typeObject = CommanderClient.registry().getType(arg.type);
	if (typeObject === undefined) return;

	let typeSuggestions =
		typeObject.suggestions !== undefined
			? typeObject.suggestions(text ?? "")
			: [];
	if (!typeSuggestions.isEmpty()) {
		typeSuggestions = ArrayUtil.slice(
			getSortedIndices(typeSuggestions, text),
			0,
			MAX_OTHER_SUGGESTIONS,
		).map((index) => typeSuggestions[index]);
	}

	// If the type is not marked as "expensive", transform the text into the type
	// If the transformation fails, include the error message in the suggestion
	let errorText: string | undefined;
	try {
		if (!typeObject.expensive) {
			const transformResult = typeObject.transform(text ?? "");
			if (transformResult.isErr()) {
				errorText = transformResult.unwrapErr();
			}
		}
	} catch {
		errorText = "Failed to transform type";
	}

	return {
		main: {
			type: "argument",
			title: arg.name,
			description: arg.description,
			dataType: typeObject.name,
			optional: arg.optional ?? false,
			error: errorText,
		},
		others: typeSuggestions,
	};
}

export function getCommandSuggestion(
	parentPath?: CommandPath,
	text?: string,
): Suggestion | undefined {
	const childPaths = CommanderClient.registry().getChildPaths(parentPath);
	if (childPaths.isEmpty()) return;

	const pathNames = childPaths.map((path) => path.getTail());
	const indices = getSortedIndices(pathNames, text);
	if (indices.isEmpty()) return;

	const firstPath = childPaths[indices[0]];
	const mainData =
		CommanderClient.registry().getCommand(firstPath)?.options ??
		CommanderClient.registry().getGroup(firstPath)?.options;
	if (mainData === undefined) return;

	const otherNames =
		indices.size() > 1
			? ArrayUtil.slice(indices, 1, MAX_OTHER_SUGGESTIONS + 1).map(
					(index) => pathNames[index],
			  )
			: [];
	return {
		main: {
			type: "command",
			title: mainData.name,
			description: mainData.description,
		},
		others: otherNames,
	};
}

function getSortedIndices(strings: string[], text?: string) {
	if (text === undefined) return strings.sort().map((_, index) => index);

	const textLower = text.lower();
	const textEndIndex = text.size();

	const results: Array<[number, number]> = [];
	for (const i of $range(0, strings.size() - 1)) {
		const suggestionPart = strings[i].lower().sub(0, textEndIndex);
		if (suggestionPart === textLower) {
			results.push([suggestionPart.size(), i]);
		}
	}

	return results
		.sort((a, b) => {
			if (a[0] === b[0]) {
				return strings[a[1]] < strings[b[1]];
			}
			return a[0] < b[0];
		})
		.map((val) => val[1]);
}
