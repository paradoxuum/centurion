import {
	ArgumentOptions,
	BaseRegistry,
	CommandOptions,
	ListArgumentType,
	RegistryPath,
	SingleArgumentType,
} from "@rbxts/centurion";
import { ReadonlyDeep } from "@rbxts/centurion/out/shared/util/data";
import { Players } from "@rbxts/services";
import { ArgumentSuggestion, CommandSuggestion } from "../../types";

const MAX_OTHER_SUGGESTIONS = 3;

export interface SingleArgument {
	kind: "single";
	options: ReadonlyDeep<ArgumentOptions>;
	type: SingleArgumentType<unknown>;
	input?: string;
}

export interface ListArgument {
	kind: "list";
	options: ReadonlyDeep<ArgumentOptions>;
	type: ListArgumentType<unknown>;
	input: string[];
}

export type Argument = SingleArgument | ListArgument;

function formatText(text: string) {
	return text.match("%s").isEmpty() ? text : `"${text}"`;
}

function getMatches(
	strings: string[],
	text?: string,
): [number, string, number][] {
	if (text === undefined) {
		return strings.sort().map((str, i) => [i, str, str.size()]);
	}

	const textLower = text.lower();
	const textEndIndex = text.size();
	return strings
		.mapFiltered<[number, string, number] | undefined>((str, i) => {
			const part = str.lower().sub(0, textEndIndex);
			if (part === textLower) return [i, str, str.size()];
		})
		.sort((a, b) => a[1] < b[1]);
}

export function getArgumentSuggestion(arg: Argument, textPart?: string) {
	const suggestions =
		arg.options.suggestions !== undefined
			? arg.options.suggestions.map(formatText)
			: [];
	const singleArg = arg.kind === "single";

	const typeSuggestions = singleArg
		? arg.type.suggestions?.(arg.input ?? "", Players.LocalPlayer)
		: arg.type.suggestions?.(arg.input, Players.LocalPlayer);
	if (typeSuggestions !== undefined) {
		for (const text of typeSuggestions) {
			suggestions.push(formatText(text));
		}
	}

	let errorText: string | undefined;
	if (!arg.type.expensive) {
		const [success, err] = pcall(() => {
			const transformResult = singleArg
				? arg.type.transform(arg.input ?? "", Players.LocalPlayer)
				: arg.type.transform(arg.input, Players.LocalPlayer);
			if (transformResult.ok) return;
			errorText = transformResult.value;
		});

		if (!success) {
			errorText = "Failed to transform argument";
			warn(err);
		}
	}

	return {
		type: "argument",
		title: arg.options.name,
		others: getMatches(suggestions, textPart).map(([, str]) => str),
		description: arg.options.description,
		dataType: arg.type.name,
		optional: arg.options.optional ?? false,
		error: errorText,
	} satisfies ArgumentSuggestion;
}

export function getCommandSuggestion(
	registry: BaseRegistry,
	parentPath?: RegistryPath,
	text?: string,
): CommandSuggestion | undefined {
	const paths =
		parentPath !== undefined
			? registry.getChildPaths(parentPath)
			: registry.getRootPaths();
	if (paths.isEmpty()) return;

	const pathNames = paths.map((path) => path.tail());
	const sortedPaths = getMatches(pathNames, text);
	const firstMatch = sortedPaths.remove(0);
	if (firstMatch === undefined) return;

	const firstPath = paths[firstMatch[0]];
	const mainData =
		registry.getCommand(firstPath)?.options ??
		registry.getGroup(firstPath)?.options;
	if (mainData === undefined) return;

	return {
		type: "command",
		title: firstPath.tail(),
		others: sortedPaths.map(([, str]) => formatText(str)),
		description: mainData.description,
		shortcuts: (mainData as CommandOptions).shortcuts,
	};
}
