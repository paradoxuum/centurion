import {
	CommandOptions,
	HistoryEntry,
	ImmutableRegistryPath,
	RegistryPath,
} from "@rbxts/centurion";
import { ArrayUtil } from "@rbxts/centurion/out/shared/util/data";
import {
	endsWithSpace,
	formatPartsAsPath,
	splitString,
} from "@rbxts/centurion/out/shared/util/string";
import { useEventListener, useLatestCallback } from "@rbxts/pretty-react-hooks";
import React, { useContext, useEffect, useMemo, useState } from "@rbxts/react";
import { TextService } from "@rbxts/services";
import { HISTORY_TEXT_SIZE } from "../../constants/text";
import { useMotion } from "../../hooks/use-motion";
import { usePx } from "../../hooks/use-px";
import { useStore } from "../../hooks/use-store";
import { ApiContext } from "../../providers/api-provider";
import { OptionsContext } from "../../providers/options-provider";
import { HistoryLineData, Suggestion } from "../../types";
import {
	getArgumentSuggestion,
	getCommandSuggestion,
} from "../../util/suggestion";
import { Frame } from "../interface/frame";
import { Padding } from "../interface/padding";
import { HistoryData, HistoryList } from "./history";
import { TerminalTextField } from "./terminal-text-field";

const MAX_HEIGHT = HISTORY_TEXT_SIZE * 10;
const TEXT_FIELD_HEIGHT = 40;

export function TerminalWindow() {
	const px = usePx();
	const store = useStore();
	const api = useContext(ApiContext);
	const options = useContext(OptionsContext);

	const [history, setHistory] = useState<HistoryEntry[]>(
		api.dispatcher.getHistory(),
	);
	const [historyData, setHistoryData] = useState<HistoryData>({
		lines: [],
		height: 0,
	});
	const [historyHeight, historyHeightMotion] = useMotion(0);

	const textBoundsParams = useMemo(() => {
		const params = new Instance("GetTextBoundsParams");
		params.Width = math.huge;
		params.Font = options.font.regular;
		return params;
	}, []);

	const windowHeightBinding = useMemo(() => {
		return historyHeight.map((y) => {
			return new UDim2(1, 0, 0, math.ceil(px(TEXT_FIELD_HEIGHT + 16) + y));
		});
	}, [px]);

	const checkMissingArgs = useLatestCallback(
		(path: ImmutableRegistryPath, command: CommandOptions) => {
			if (command.arguments === undefined || command.arguments.isEmpty()) {
				return undefined;
			}

			const storeState = store.getState();
			const lastPartIndex = storeState.text.parts.size() - path.size() - 1;
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

	useEventListener(api.dispatcher.historyUpdated, (entries) => {
		setHistory([...entries]);
	});

	// Handle history updates
	useEffect(() => {
		const historySize = history.size();
		let totalHeight = historySize > 0 ? px(8) + (historySize - 1) * px(8) : 0;

		textBoundsParams.Size = HISTORY_TEXT_SIZE;

		const historyLines: HistoryLineData[] = [];
		for (const entry of history) {
			textBoundsParams.Text = entry.text;
			const textSize = TextService.GetTextBoundsAsync(textBoundsParams);
			const lineHeight = px(textSize.Y + 4);
			totalHeight += lineHeight;
			historyLines.push({ entry, height: lineHeight });
		}

		const isClamped = totalHeight > px(MAX_HEIGHT);
		const clampedHeight = isClamped ? px(MAX_HEIGHT) : totalHeight;
		historyHeightMotion.spring(clampedHeight, {
			mass: 0.1,
			tension: 300,
			friction: 15,
		});
		setHistoryData({
			lines: historyLines,
			height: totalHeight,
		});
	}, [history, px]);

	return (
		<Frame
			size={windowHeightBinding}
			backgroundColor={options.palette.background}
			backgroundTransparency={options.backgroundTransparency}
			cornerRadius={new UDim(0, px(8))}
			event={{
				MouseEnter: () => options.setMouseOnGUI(true),
				MouseLeave: () => options.setMouseOnGUI(false),
			}}
		>
			<Padding all={new UDim(0, px(8))} />

			<HistoryList
				size={new UDim2(1, 0, 1, -px(TEXT_FIELD_HEIGHT + 8))}
				data={historyData}
				maxHeight={px(MAX_HEIGHT)}
			/>

			<TerminalTextField
				anchorPoint={new Vector2(0, 1)}
				size={new UDim2(1, 0, 0, px(TEXT_FIELD_HEIGHT))}
				position={UDim2.fromScale(0, 1)}
				backgroundTransparency={options.backgroundTransparency}
				onTextChange={(text) => {
					const parts = splitString(text, " ");
					store.setText(text, parts);

					if (parts.isEmpty()) {
						store.setSuggestion(undefined);
						store.setCommand(undefined);
						store.setArgIndex(undefined);
						return;
					}

					store.flush();
					// If the text ends in a space, we want to count that as having traversed
					// to the next "part" of the text. This means we should include the previous
					// text part as part of the parent path.
					const atNextPart = endsWithSpace(text);

					let commandPath = store.getState().command.path;
					let atCommand = false;
					if (
						commandPath !== undefined &&
						formatPartsAsPath(ArrayUtil.slice(parts, 0, commandPath.size())) ===
							commandPath.toString()
					) {
						// The current path still leads to the command, so it's valid
						atCommand = true;
					} else if (
						api.registry.getCommandByString(formatPartsAsPath(parts)) !==
						undefined
					) {
						atCommand = true;
						commandPath = new ImmutableRegistryPath(parts);
					} else {
						const currentPath = RegistryPath.empty();
						for (const part of parts) {
							currentPath.append(part);

							if (api.registry.getCommand(currentPath) !== undefined) {
								atCommand = true;
								break;
							}

							if (api.registry.getChildPaths(currentPath).isEmpty()) {
								atCommand = false;
								break;
							}
						}

						commandPath = ImmutableRegistryPath.fromPath(currentPath);
					}

					if (!atCommand && store.getState().command.path !== undefined) {
						store.setCommand(undefined);
						store.flush();
					} else if (
						atCommand &&
						commandPath !== store.getState().command.path
					) {
						store.setCommand(commandPath);
						store.flush();
					}

					const command =
						commandPath !== undefined
							? api.registry.getCommand(commandPath)?.options
							: undefined;
					if (commandPath !== undefined && command !== undefined) {
						store.setTextValid(
							checkMissingArgs(commandPath, command as CommandOptions) ===
								undefined,
						);
					} else {
						store.setTextValid(false);
					}

					// Update suggestions
					const showArgs =
						atCommand &&
						(atNextPart ||
							(commandPath !== undefined && parts.size() > commandPath.size()));

					const argCount =
						showArgs && command !== undefined
							? command.arguments?.size() ?? 0
							: 0;
					const currentTextPart = !atNextPart
						? parts[parts.size() - 1]
						: undefined;

					let suggestion: Suggestion | undefined;
					if (argCount === 0) {
						const parentPath = atNextPart
							? commandPath
							: commandPath.size() !== 1
								? commandPath.parent()
								: undefined;
						suggestion = getCommandSuggestion(
							api.registry,
							parentPath,
							currentTextPart,
						);
					} else if (commandPath !== undefined) {
						// Handle argument suggestions
						const argIndex =
							parts.size() - commandPath.size() - (atNextPart ? 0 : 1);
						if (argIndex >= argCount) return;

						store.setArgIndex(argIndex);
						suggestion = getArgumentSuggestion(
							api.registry,
							commandPath,
							argIndex,
							currentTextPart,
						);
					}

					store.setSuggestion(suggestion);
				}}
				onSubmit={(text) => {
					const storeState = store.getState();
					const commandPath = storeState.command.path;
					const command =
						commandPath !== undefined
							? api.registry.getCommand(commandPath)
							: undefined;

					if (commandPath === undefined || command === undefined) {
						api.dispatcher.addHistoryEntry({
							success: false,
							text: "Command not found.",
							sentAt: os.time(),
						});
						return;
					}

					const argCheckMessage = checkMissingArgs(
						commandPath,
						command.options as CommandOptions,
					);
					if (argCheckMessage !== undefined) {
						api.dispatcher.addHistoryEntry({
							success: false,
							text: argCheckMessage,
							sentAt: os.time(),
						});
						return;
					}

					const args = ArrayUtil.slice(
						storeState.text.parts,
						commandPath.size(),
					);
					api.dispatcher.run(commandPath, args);
				}}
			/>
		</Frame>
	);
}
