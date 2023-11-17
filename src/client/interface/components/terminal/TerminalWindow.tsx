import { useEventListener, useMountEffect } from "@rbxts/pretty-react-hooks";
import { useSelector } from "@rbxts/react-reflex";
import Roact, { useCallback, useContext, useEffect, useMemo, useState } from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { copy, pop, slice } from "@rbxts/sift/out/Array";
import { copyDeep } from "@rbxts/sift/out/Dictionary";
import { ImmutableCommandPath } from "../../../../shared";
import { endsWithSpace, formatPartsAsPath, splitStringBySpace } from "../../../../shared/util/string";
import { DEFAULT_HISTORY_LENGTH } from "../../../options";
import { Suggestion } from "../../../types";
import { palette } from "../../constants/palette";
import { useMotion } from "../../hooks/useMotion";
import { useRem } from "../../hooks/useRem";
import { useStore } from "../../hooks/useStore";
import { DataContext } from "../../providers/dataProvider";
import { selectHistory } from "../../store/app";
import { HistoryLineData } from "../../types";
import { Frame } from "../interface/Frame";
import { Padding } from "../interface/Padding";
import { Shadow } from "../interface/Shadow";
import { TerminalTextField } from "./TerminalTextField";
import { HistoryList } from "./history";

export function TerminalWindow() {
	const rem = useRem();
	const store = useStore();
	const data = useContext(DataContext);

	const history = useSelector(selectHistory);
	const [historyLines, setHistoryLines] = useState<HistoryLineData[]>([]);
	const [historyHeight, historyHeightMotion] = useMotion(0);

	const getParentPath = useCallback((parts: string[], atNextPart: boolean) => {
		if (!atNextPart && parts.size() <= 1) {
			return;
		}

		return new ImmutableCommandPath(atNextPart ? copy(parts) : pop(parts));
	}, []);

	const windowHeightBinding = useMemo(() => {
		return historyHeight.map((y) => {
			return new UDim2(1, 0, 0, math.ceil(rem(5) + y));
		});
	}, [rem]);

	// Handle history updates
	useMountEffect(() => {
		store.setHistory(copyDeep(data.history));
	});

	useEventListener(data.onHistoryUpdated, (entry) => {
		store.addHistoryEntry(entry, data.options.historyLength ?? DEFAULT_HISTORY_LENGTH);
	});

	useEffect(() => {
		const historySize = history.size();
		let totalHeight = historySize > 0 ? rem(0.5) + (historySize - 1) * rem(0.5) : 0;

		const historyLines: HistoryLineData[] = [];
		const textMaxBounds = new Vector2(math.huge, math.huge);
		for (const entry of history) {
			const textSize = TextService.GetTextSize(entry.text, rem(1.5), "GothamMedium", textMaxBounds);
			totalHeight += textSize.Y;
			historyLines.push({ entry, height: textSize.Y });
		}

		const isClamped = totalHeight > rem(16);
		const clampedHeight = isClamped ? rem(16) : totalHeight;
		historyHeightMotion.spring(clampedHeight);
		setHistoryLines(historyLines);
	}, [history, rem]);

	return (
		<Frame size={windowHeightBinding} backgroundColor={palette.crust} cornerRadius={new UDim(0, rem(0.5))}>
			<Padding key="padding" all={new UDim(0, rem(0.5))} />

			<HistoryList
				key="history"
				size={new UDim2(1, 0, 1, -rem(4.5))}
				historyLines={historyLines}
				historyHeight={historyHeight}
			/>

			<TerminalTextField
				key="text-field"
				anchorPoint={new Vector2(0, 1)}
				size={new UDim2(1, 0, 0, rem(4))}
				position={UDim2.fromScale(0, 1)}
				onTextChange={(text) => {
					const parts = splitStringBySpace(text);
					store.setText(text, parts);

					if (parts.isEmpty()) {
						store.setSuggestionText("");
						store.setSuggestions([]);
						return;
					}

					let parentPath = store.getState().app.command;
					let atCommand = data.commands.has(formatPartsAsPath(parts));

					// If the text ends in a space, we want to count that as having traversed
					// to the next "part" of the text. This means we should include the previous
					// text part as part of the parent path.
					const atNextPart = endsWithSpace(text);

					if (parentPath !== undefined) {
						if (parts.size() === parentPath.getSize() && !atNextPart) {
							// This means the cursor is at the end of the command text part,
							// we don't want to show arg suggestions here so we set this to false
							atCommand = false;
						} else if (formatPartsAsPath(slice(parts, 1, parentPath.getSize())) === parentPath.toString()) {
							// The current path still leads to the command, so it's valid
							atCommand = true;
						} else {
							// As a last resort, iterate over all parts of text to check if it points to a command
							// This could be the case if the text is selected and a valid command is pasted into
							// the text box, meaning the command path will still point to the previous command.
							for (const i of $range(0, parts.size() - 1)) {
								const pathSlice = formatPartsAsPath(slice(parts, 1, i + 1));
								if (data.commands.has(pathSlice)) {
									atCommand = true;

									// Since the command has possibly changed, we also need to update the path
									parentPath = ImmutableCommandPath.fromString(pathSlice);
									store.setCommand(parentPath);
									break;
								}
							}
						}

						if (!atCommand) {
							store.setCommand(undefined);
							parentPath = getParentPath(parts, atNextPart);
						}
					} else {
						parentPath = getParentPath(parts, atNextPart);
						atCommand = atCommand && atNextPart;
						if (atCommand) {
							store.setCommand(new ImmutableCommandPath(copy(parts)));
						}
					}

					let hasArgs = false;
					if (atCommand) {
						const commandArgs = data.commands.get(parentPath!.toString())!.arguments;
						hasArgs = commandArgs !== undefined && !commandArgs.isEmpty();
					}

					let suggestions: Suggestion[];
					let argSuggestion: Suggestion | undefined;
					let argIndex = 0;

					if (hasArgs) {
						argIndex = parts.size() - parentPath!.getSize() - (atNextPart ? 0 : 1);
						suggestions = data.getArgumentSuggestions(parentPath!);
						if (argIndex >= suggestions.size()) {
							suggestions = [];
						} else {
							argSuggestion = suggestions[argIndex];
						}
					} else {
						const currentPart = !atNextPart ? parts[parts.size() - 1] : undefined;
						suggestions = data.getCommandSuggestions(parentPath, currentPart);
					}

					store.setSuggestions(argSuggestion !== undefined ? [argSuggestion] : suggestions);

					let suggestionText = text;
					if (hasArgs) {
						for (const i of $range(argIndex, suggestions.size() - 1)) {
							const firstArg = i === argIndex;
							if (firstArg && !atNextPart) {
								suggestionText += " ";
								continue;
							}

							suggestionText += suggestions[i].title + " ";
						}
					} else {
						const suggestionStartIndex = (!atNextPart ? parts[parts.size() - 1].size() : 0) + 1;
						suggestionText += !suggestions.isEmpty() ? suggestions[0].title.sub(suggestionStartIndex) : "";
					}

					store.setSuggestionText(suggestionText);
				}}
				onSubmit={(text) => {
					const storeState = store.getState();
					const command = storeState.app.command;
					if (command === undefined) return;

					data.execute(command, text);
				}}
			/>

			<Shadow key="shadow" shadowSize={rem(1)} />
		</Frame>
	);
}
