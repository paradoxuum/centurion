import { ArgumentOptions } from "@rbxts/centurion";
import { ArrayUtil, ReadonlyDeep } from "@rbxts/centurion/out/shared/util/data";
import { endsWithSpace } from "@rbxts/centurion/out/shared/util/string";
import Vide, { effect, source } from "@rbxts/vide";
import { HISTORY_TEXT_SIZE } from "../../constants/text";
import { getAPI } from "../../hooks/use-api";
import { useAtom } from "../../hooks/use-atom";
import { useHistory } from "../../hooks/use-history";
import { useMotion } from "../../hooks/use-motion";
import { px } from "../../hooks/use-px";
import {
	currentArgIndex,
	currentCommandPath,
	currentSuggestion,
	interfaceOptions,
	mouseOverInterface,
	terminalText,
	terminalTextParts,
	terminalTextValid,
} from "../../store";
import { HistoryList } from "../history";
import { Frame } from "../ui/frame";
import { Padding } from "../ui/padding";
import { getMissingArgs, getValidPath } from "./command";
import { getArgumentSuggestion, getCommandSuggestion } from "./suggestion";
import { TerminalTextField } from "./terminal-text-field";

const MAX_HEIGHT = HISTORY_TEXT_SIZE * 10;
const TEXT_FIELD_HEIGHT = 40;

export function Terminal() {
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
			cornerRadius={() => new UDim(0, px(8))}
			mouseEnter={() => mouseOverInterface(true)}
			mouseLeave={() => mouseOverInterface(false)}
		>
			<Padding all={() => new UDim(0, px(8))} />

			<HistoryList
				size={() => new UDim2(1, 0, 1, -px(TEXT_FIELD_HEIGHT + 8))}
				data={history}
				maxHeight={() => px(MAX_HEIGHT)}
			/>

			<TerminalTextField
				anchorPoint={new Vector2(0, 1)}
				size={() => new UDim2(1, 0, 0, px(TEXT_FIELD_HEIGHT))}
				position={UDim2.fromScale(0, 1)}
				backgroundTransparency={() => options().backgroundTransparency ?? 0}
				onTextChange={(text) => {
					terminalText(text);
					terminalTextValid(false);
					missingArgs([]);

					const parts = terminalTextParts();
					if (parts.isEmpty()) {
						currentCommandPath(undefined);
						currentSuggestion(undefined);
						currentArgIndex(undefined);
						return;
					}

					// If the text ends in a space, we want to count that as having traversed
					// to the next "part" of the text.
					const atNextPart = endsWithSpace(text);
					const path = getValidPath(api.registry, parts);
					const command =
						path !== undefined ? api.registry.getCommand(path) : undefined;

					if (command !== undefined) {
						// Check for missing arguments
						const missing = getMissingArgs(command, parts);
						const noArgs = command.options.arguments?.isEmpty() ?? true;

						currentCommandPath(path);
						missingArgs(missing);
						terminalTextValid(
							noArgs ||
								missing.isEmpty() ||
								(atNextPart && missing.size() === 1),
						);
					} else {
						terminalTextValid(false);
					}

					const currentTextPart = !atNextPart
						? parts[parts.size() - 1]
						: undefined;

					if (path === undefined || command === undefined) {
						// Get command suggestions
						const index = parts.size() - (atNextPart ? 1 : 2);
						const parentPath = path?.slice(0, index);
						currentSuggestion(
							getCommandSuggestion(
								api.registry,
								!parentPath?.isEmpty() ? parentPath : undefined,
								currentTextPart,
							),
						);
						return;
					}

					// Handle arguments
					const argIndex = parts.size() - path.size() - (atNextPart ? 0 : 1);
					if (command === undefined || argIndex === -1) return;

					const args = command.options.arguments;
					if (args === undefined || argIndex === -1) {
						currentSuggestion(undefined);
						return;
					}

					let index = 0;
					let currentArg: ReadonlyDeep<ArgumentOptions> | undefined;
					let endIndex: number | undefined = -1;
					for (const i of $range(0, argIndex)) {
						if (endIndex === undefined || i <= endIndex) continue;
						if (index >= args.size()) {
							currentArg = undefined;
							break;
						}

						currentArg = args[index];
						const numArgs = currentArg.numArgs ?? 1;
						endIndex = numArgs !== "rest" ? i + (numArgs - 1) : undefined;
						index += 1;
					}

					const argType = api.registry.getType(currentArg?.type ?? "");
					if (currentArg === undefined || argType === undefined) {
						currentArgIndex(undefined);
						currentSuggestion(undefined);
						return;
					}

					const suggestion = getArgumentSuggestion(
						currentArg,
						argType,
						currentTextPart,
					);

					currentArgIndex(argIndex);
					currentSuggestion(suggestion);
					if (suggestion?.error !== undefined) terminalTextValid(false);
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
