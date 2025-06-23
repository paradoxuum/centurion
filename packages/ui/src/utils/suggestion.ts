import { BaseRegistry } from "@rbxts/centurion";
import {
	commandArgIndex,
	currentCommandPath,
	currentSuggestion,
	currentTextPart,
	terminalArgIndex,
} from "../store";
import { Suggestion } from "../types";
import { formatPartsAsPath, getArgumentNames } from "./command";

export function getAutocompletedText(
	text: string,
	textParts: string[],
	registry: BaseRegistry,
) {
	// Handle autocompletion
	const commandPath = currentCommandPath();
	const suggestion = currentSuggestion();
	if (suggestion === undefined) return;

	if (commandPath === undefined) {
		return completeCommand(registry, text, textParts, suggestion.title);
	}

	const argCount =
		registry.getCommand(commandPath)?.options.arguments?.size() ?? 0;
	if (suggestion.type === "command" && argCount !== 0) {
		return `${text} `;
	}

	if (suggestion.others.isEmpty()) return text;
	return completeArgument(text, suggestion.others[0], argCount);
}

function replaceTextPart(text: string, ...suggestions: string[]) {
	const currentPart = currentTextPart();
	const currentPartSize = currentPart?.size() ?? 0;

	let result = text.sub(0, text.size() - currentPartSize);
	result += suggestions.join(" ");
	return result;
}

function completeCommand(
	registry: BaseRegistry,
	text: string,
	textParts: string[],
	suggestion: string,
) {
	const atNextPart = text.sub(-1) === " ";
	const pathParts = [...textParts];
	if (!atNextPart) {
		pathParts.remove(textParts.size() - 1);
	}
	pathParts.push(suggestion);

	const command = registry.getCommandByString(
		formatPartsAsPath(pathParts),
	)?.options;

	let result = replaceTextPart(text, suggestion);

	// Add a space if this path isn't a command (meaning it's a group) or is a command with arguments
	if (command === undefined || !(command.arguments?.isEmpty() ?? true)) {
		result += " ";
	}

	return result;
}

function completeArgument(
	text: string,
	suggestion: string,
	commandArgCount: number,
) {
	const argIndex = terminalArgIndex();
	if (argIndex === undefined || commandArgCount === 0) return text;

	let result = replaceTextPart(text, suggestion);
	if (argIndex < commandArgCount - 1) {
		result += " ";
	}
	return result;
}

export function getSuggestedText(
	registry: BaseRegistry,
	text: string,
	textParts: string[],
	atNextPart: boolean,
	suggestion?: Suggestion,
) {
	if (suggestion === undefined) return "";

	let suggestionText: string;

	if (textParts.isEmpty() || suggestion.type === "command") {
		suggestionText = suggestion.title;
	} else {
		const command = currentCommandPath();
		const argIndex = terminalArgIndex();

		if (command === undefined || argIndex === undefined) return "";

		if (atNextPart && argIndex === commandArgIndex()) {
			suggestionText = suggestion.title;
		} else if (!suggestion.others.isEmpty()) {
			suggestionText = suggestion.others[0];
		} else {
			suggestionText = currentTextPart() ?? "";
		}

		const argNames = getArgumentNames(registry, command);

		for (const i of $range(argIndex + 1, argNames.size() - 1)) {
			suggestionText += ` ${argNames[i]}`;
		}
	}

	const partSize = currentTextPart()?.size() ?? 0;

	let result = text;
	result += suggestionText.sub(partSize + 1);
	return result;
}
