import { ImmutableRegistryPath, RegistryPath } from "@rbxts/centurion";
import { ArrayUtil } from "@rbxts/centurion/out/shared/util/data";
import {
	endsWithSpace,
	formatPartsAsPath,
} from "@rbxts/centurion/out/shared/util/string";
import Vide, { effect, source } from "@rbxts/vide";
import { HISTORY_TEXT_SIZE } from "../constants/text";
import { getAPI } from "../hooks/use-api";
import { useAtom } from "../hooks/use-atom";
import { useHistory } from "../hooks/use-history";
import { useMotion } from "../hooks/use-motion";
import { px } from "../hooks/use-px";
import {
	currentArgIndex,
	currentCommandPath,
	currentSuggestion,
	interfaceOptions,
	mouseOverInterface,
	terminalText,
	terminalTextParts,
	terminalTextValid,
} from "../store";
import { Suggestion } from "../types";
import { getMissingArgs } from "../util/argument";
import {
	getArgumentSuggestion,
	getCommandSuggestion,
} from "../util/suggestion";
import { HistoryList } from "./history";
import { TerminalTextField } from "./terminal-text-field";
import { Frame } from "./ui/frame";
import { Padding } from "./ui/padding";

const MAX_HEIGHT = HISTORY_TEXT_SIZE * 10;
const TEXT_FIELD_HEIGHT = 40;

export function TerminalWindow() {
	const api = getAPI();
	const options = useAtom(interfaceOptions);
	const missingArgs = source<string[]>([]);
	const history = useHistory();
	const [historyHeight, historyHeightMotion] = useMotion(0);

	effect(() => {
		const totalHeight = history().height;
		const isClamped = totalHeight > px(MAX_HEIGHT);
		const clampedHeight = isClamped ? px(MAX_HEIGHT) : totalHeight;
		historyHeightMotion.spring(clampedHeight, {
			mass: 0.1,
			tension: 300,
			friction: 15,
		});
	});

	return (
		<Frame
			size={() => {
				return new UDim2(
					1,
					0,
					0,
					math.ceil(px(TEXT_FIELD_HEIGHT + 16) + historyHeight()),
				);
			}}
			backgroundColor={() => options().palette.background}
			backgroundTransparency={() => options().backgroundTransparency ?? 0}
			cornerRadius={new UDim(0, px(8))}
			mouseEnter={() => mouseOverInterface(true)}
			mouseLeave={() => mouseOverInterface(false)}
		>
			<Padding all={new UDim(0, px(8))} />

			<HistoryList
				size={new UDim2(1, 0, 1, -px(TEXT_FIELD_HEIGHT + 8))}
				data={history}
				maxHeight={px(MAX_HEIGHT)}
			/>

			<TerminalTextField
				anchorPoint={new Vector2(0, 1)}
				size={new UDim2(1, 0, 0, px(TEXT_FIELD_HEIGHT))}
				position={UDim2.fromScale(0, 1)}
				backgroundTransparency={() => options().backgroundTransparency ?? 0}
				onTextChange={(text) => {
					terminalText(text);
					terminalTextValid(false);

					const parts = terminalTextParts();
					if (parts.isEmpty()) {
						currentCommandPath(undefined);
						currentSuggestion(undefined);
						currentArgIndex(undefined);
						return;
					}

					// If the text ends in a space, we want to count that as having traversed
					// to the next "part" of the text. This means we should include the previous
					// text part as part of the parent path.
					const atNextPart = endsWithSpace(text);

					let commandPath = currentCommandPath();
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

					const currentPath = currentCommandPath();
					if (!atCommand && currentPath !== undefined) {
						currentCommandPath(undefined);
					} else if (atCommand && commandPath !== currentPath) {
						currentCommandPath(commandPath);
					}

					const command =
						commandPath !== undefined
							? api.registry.getCommand(commandPath)?.options
							: undefined;
					if (commandPath !== undefined && command !== undefined) {
						const missing = getMissingArgs(api.registry, commandPath, parts);
						missingArgs(missing);

						const noArgs = command.arguments?.isEmpty() ?? true;
						terminalTextValid(
							noArgs ||
								missing.isEmpty() ||
								(atNextPart && missing.size() === 1),
						);
					} else {
						terminalTextValid(false);
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

						currentArgIndex(argIndex);
						suggestion = getArgumentSuggestion(
							api.registry,
							commandPath,
							argIndex,
							currentTextPart,
						);

						if (suggestion?.error !== undefined) {
							terminalTextValid(false);
						}
					}

					currentSuggestion(suggestion);
				}}
				onSubmit={() => {
					const commandPath = currentCommandPath();
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

					const missing = missingArgs();
					if (!missing.isEmpty()) {
						api.dispatcher.addHistoryEntry({
							success: false,
							text: `Missing arguments: ${missing.join(", ")}`,
							sentAt: os.time(),
						});
						return;
					}

					const args = ArrayUtil.slice(terminalTextParts(), commandPath.size());
					api.dispatcher.run(commandPath, args);
				}}
			/>
		</Frame>
	);
}
