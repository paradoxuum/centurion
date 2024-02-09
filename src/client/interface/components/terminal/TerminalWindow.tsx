import { useLatestCallback } from "@rbxts/pretty-react-hooks";
import Roact, { useContext, useEffect, useMemo, useState } from "@rbxts/roact";
import { TextService } from "@rbxts/services";
import { CommandOptions, ImmutableCommandPath } from "../../../../shared";
import { ArrayUtil } from "../../../../shared/util/data";
import {
	endsWithSpace,
	formatPartsAsPath,
	splitStringBySpace,
} from "../../../../shared/util/string";
import { DEFAULT_FONT } from "../../constants/fonts";
import { palette } from "../../constants/palette";
import { useMotion } from "../../hooks/useMotion";
import { useRem } from "../../hooks/useRem";
import { useStore } from "../../hooks/useStore";
import { CommanderContext } from "../../providers/commanderProvider";
import { HistoryLineData, Suggestion } from "../../types";
import {
	getArgumentSuggestion,
	getCommandSuggestion,
} from "../../util/suggestion";
import { Frame } from "../interface/Frame";
import { Padding } from "../interface/Padding";
import { Shadow } from "../interface/Shadow";
import { TerminalTextField } from "./TerminalTextField";
import { HistoryData, HistoryList } from "./history";

function getParentPath(parts: string[], atNextPart: boolean) {
	if (!atNextPart && parts.size() <= 1) {
		return;
	}

	const result = [...parts];
	if (!atNextPart) {
		result.pop();
	}
	return new ImmutableCommandPath(result);
}

export function TerminalWindow() {
	const rem = useRem();
	const store = useStore();
	const data = useContext(CommanderContext);

	const [historyData, setHistoryData] = useState<HistoryData>({
		lines: [],
		height: 0,
	});
	const [historyHeight, historyHeightMotion] = useMotion(0);

	const textBoundsParams = useMemo(() => {
		const params = new Instance("GetTextBoundsParams");
		params.Width = math.huge;
		params.Font = DEFAULT_FONT;
		return params;
	}, []);

	const windowHeightBinding = useMemo(() => {
		return historyHeight.map((y) => {
			return new UDim2(1, 0, 0, math.ceil(rem(5) + y));
		});
	}, [rem]);

	const checkMissingArgs = useLatestCallback(
		(path: ImmutableCommandPath, command: CommandOptions) => {
			if (command.arguments === undefined || command.arguments.isEmpty()) {
				return undefined;
			}

			const storeState = store.getState();
			const lastPartIndex = storeState.text.parts.size() - path.getSize() - 1;
			const missingArgs: string[] = [];

			let index = 0;
			for (const arg of command.arguments) {
				if (arg.optional) break;
				if (index > lastPartIndex) {
					missingArgs.push(`<b>${arg.name}</b>`);
				}
				index++;
			}

			if (missingArgs.isEmpty()) return undefined;

			let text = "Missing required argument";
			if (missingArgs.size() !== 1) {
				text += "s";
			}
			return `${text}: ${missingArgs.join(", ")}`;
		},
	);

	// Handle history updates
	useEffect(() => {
		const historySize = data.history.size();
		let totalHeight =
			historySize > 0 ? rem(0.5) + (historySize - 1) * rem(0.5) : 0;

		textBoundsParams.Size = rem(1.5);

		const historyLines: HistoryLineData[] = [];
		for (const entry of data.history) {
			textBoundsParams.Text = entry.text;
			const textSize = TextService.GetTextBoundsAsync(textBoundsParams);
			totalHeight += textSize.Y;
			historyLines.push({ entry, height: textSize.Y });
		}

		const isClamped = totalHeight > rem(16);
		const clampedHeight = isClamped ? rem(16) : totalHeight;
		historyHeightMotion.spring(clampedHeight, {
			mass: 0.1,
			tension: 300,
			friction: 15,
		});
		setHistoryData({
			lines: historyLines,
			height: totalHeight,
		});
	}, [data.history, rem]);

	return (
		<Frame
			size={windowHeightBinding}
			backgroundColor={palette.crust}
			cornerRadius={new UDim(0, rem(0.5))}
		>
			<Padding key="padding" all={new UDim(0, rem(0.5))} />

			<HistoryList
				key="history"
				size={new UDim2(1, 0, 1, -rem(4.5))}
				data={historyData}
				maxHeight={rem(16)}
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
						store.clearSuggestions();
						store.setArgIndex(undefined);
						return;
					}

					store.flush();
					let parentPath = store.getState().command.path;
					let atCommand = data.commands.has(formatPartsAsPath(parts));

					// If the text ends in a space, we want to count that as having traversed
					// to the next "part" of the text. This means we should include the previous
					// text part as part of the parent path.
					const atNextPart = endsWithSpace(text);
					let showArgs = atCommand && atNextPart;

					if (parentPath !== undefined) {
						if (
							formatPartsAsPath(
								ArrayUtil.slice(parts, 0, parentPath.getSize()),
							) === parentPath.toString()
						) {
							// The current path still leads to the command, so it's valid
							atCommand = true;
							showArgs = atNextPart || parts.size() !== parentPath.getSize();

							if (!showArgs) {
								parentPath =
									parentPath.getSize() > 1
										? parentPath.remove(parentPath.getSize() - 1)
										: undefined;
							}
						} else {
							// As a last resort, iterate over all parts of text to check if it points to a command
							// This could be the case if the text is selected and a valid command is pasted into
							// the text box, meaning the command path will still point to the previous command.
							for (const i of $range(0, parts.size() - 1)) {
								const pathSlice = formatPartsAsPath(
									ArrayUtil.slice(parts, 0, i + 1),
								);

								if (data.commands.has(pathSlice)) {
									atCommand = true;

									// Since the command has possibly changed, we also need to update the path
									parentPath = ImmutableCommandPath.fromString(pathSlice);
									store.setCommand(parentPath);
									break;
								}
							}
						}
					} else {
						parentPath = getParentPath(parts, atNextPart);
						if (atCommand) {
							store.setCommand(new ImmutableCommandPath([...parts]));
						}
					}

					if (atCommand) {
						store.flush();
						const commandPath = store.getState().command.path;
						const command =
							commandPath !== undefined
								? data.commands.get(commandPath.toString())
								: undefined;

						if (commandPath !== undefined && command !== undefined) {
							store.setTextValid(
								checkMissingArgs(commandPath, command) === undefined,
							);
						}
					} else {
						store.setCommand(undefined);
						parentPath = getParentPath(parts, atNextPart);
					}

					// Update suggestions
					const argCount =
						showArgs && parentPath !== undefined
							? data.commands.get(parentPath.toString())?.arguments?.size() ?? 0
							: 0;
					const currentTextPart = !atNextPart
						? parts[parts.size() - 1]
						: undefined;

					let suggestion: Suggestion | undefined;
					if (argCount === 0) {
						suggestion = getCommandSuggestion(parentPath, currentTextPart);
					} else if (parentPath !== undefined) {
						// Handle argument suggestions
						const argIndex =
							parts.size() - parentPath.getSize() - (atNextPart ? 0 : 1);
						if (argIndex >= argCount) return;

						store.setArgIndex(argIndex);
						suggestion = getArgumentSuggestion(
							parentPath,
							argIndex,
							currentTextPart,
						);
					}

					const suggestionIndex = parts.size() - 1 + (atNextPart ? 1 : 0);
					store.setSuggestion(suggestionIndex, suggestion);
					store.setSuggestionIndex(suggestionIndex);
				}}
				onSubmit={(text) => {
					const storeState = store.getState();
					const commandPath = storeState.command.path;
					const command =
						commandPath !== undefined
							? data.commands.get(commandPath.toString())
							: undefined;
					if (commandPath === undefined || command === undefined) {
						data.addHistoryEntry({
							success: false,
							text: "Command not found.",
							sentAt: os.time(),
						});
						return;
					}

					const argCheckMessage = checkMissingArgs(commandPath, command);
					if (argCheckMessage !== undefined) {
						data.addHistoryEntry({
							success: false,
							text: argCheckMessage,
							sentAt: os.time(),
						});
						return;
					}
					data.execute(commandPath, text);
				}}
			/>

			<Shadow key="shadow" shadowSize={rem(1)} />
		</Frame>
	);
}
