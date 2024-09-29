import { ArgumentOptions, RegistryPath } from "@rbxts/centurion";
import { ArrayUtil, ReadonlyDeep } from "@rbxts/centurion/out/shared/util/data";
import { splitString } from "@rbxts/centurion/out/shared/util/string";
import Vide, { derive, source, spring } from "@rbxts/vide";
import { HISTORY_TEXT_SIZE } from "../../constants/text";
import { useAtom } from "../../hooks/use-atom";
import { useClient } from "../../hooks/use-client";
import { useHistory } from "../../hooks/use-history";
import { px } from "../../hooks/use-px";
import {
	atNextPart,
	commandArgIndex,
	currentCommandPath,
	currentSuggestion,
	currentTextPart,
	interfaceOptions,
	mouseOverInterface,
	terminalArgIndex,
	terminalText,
	terminalTextParts,
	terminalTextValid,
} from "../../store";
import { ArgumentSuggestion } from "../../types";
import { HistoryList } from "../history";
import { Frame } from "../ui/frame";
import { Padding } from "../ui/padding";
import { getMissingArgs, getValidPath } from "./command";
import { getArgumentSuggestion, getCommandSuggestion } from "./suggestion";
import { TerminalTextField } from "./terminal-text-field";

const MAX_HEIGHT = HISTORY_TEXT_SIZE * 10;
const TEXT_FIELD_HEIGHT = 40;
const TRAILING_SPACE_PATTERN = "(%s+)$";

export function Terminal() {
	const client = useClient();
	const options = useAtom(interfaceOptions);
	const missingArgs = source<string[]>([]);
	const history = useHistory();

	const terminalHeight = derive(() => {
		const padding = px.ceil(TEXT_FIELD_HEIGHT + 16);
		if (history().lines.isEmpty()) return padding;

		const totalHeight = history().height;
		const isClamped = totalHeight > px(MAX_HEIGHT);
		const clampedHeight = isClamped ? px(MAX_HEIGHT) : totalHeight;
		return math.ceil(padding + clampedHeight);
	});

	return (
		<Frame
			size={spring(() => new UDim2(1, 0, 0, terminalHeight()), 0.2)}
			backgroundColor={() => options().palette.background}
			backgroundTransparency={() => options().backgroundTransparency ?? 0}
			cornerRadius={() => new UDim(0, px(8))}
			native={{
				MouseEnter: () => mouseOverInterface(true),
				MouseLeave: () => mouseOverInterface(false),
			}}
		>
			<Padding all={() => new UDim(0, px(8))} />

			<HistoryList
				size={() => new UDim2(1, 0, 1, -px(TEXT_FIELD_HEIGHT + 8))}
				data={history}
				maxHeight={() => px(MAX_HEIGHT)}
			/>

			<TerminalTextField
				anchor={new Vector2(0, 1)}
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
						terminalArgIndex(undefined);
						return;
					}

					// If the text ends in a space, we want to count that as having traversed
					// to the next "part" of the text.
					const endsInSpace = text.sub(-1) === " ";
					const path = getValidPath(client.registry, parts);
					const command =
						path !== undefined ? client.registry.getCommand(path) : undefined;

					if (command !== undefined) {
						// Check for missing arguments
						const missing = getMissingArgs(command, parts);
						const noArgs = command.options.arguments?.isEmpty() ?? true;

						currentCommandPath(path);
						missingArgs(missing);
						terminalTextValid(
							noArgs ||
								missing.isEmpty() ||
								(endsInSpace && missing.size() === 1),
						);
					} else {
						currentCommandPath(undefined);
						terminalTextValid(false);
					}

					let textPart = parts[parts.size() - 1] as string | undefined;
					const atNext = atNextPart();
					if (atNext) {
						textPart = undefined;
					} else if (textPart !== undefined) {
						const spaces = text.match(TRAILING_SPACE_PATTERN)[0] ?? "";
						textPart += spaces;
					}

					const argIndex =
						path !== undefined
							? parts.size() - path.size() - (atNext ? 0 : 1)
							: -1;
					terminalArgIndex(argIndex);

					if (command === undefined || argIndex === -1) {
						// Get command suggestions
						const parentPath = !parts.isEmpty()
							? new RegistryPath(
									ArrayUtil.slice(parts, 0, parts.size() - (atNext ? 0 : 1)),
								)
							: undefined;

						currentTextPart(textPart);
						currentSuggestion(
							getCommandSuggestion(
								client.registry,
								!parentPath?.isEmpty() ? parentPath : undefined,
								textPart,
							),
						);
						return;
					}

					// Handle arguments
					const args = command.options.arguments;
					if (args === undefined) {
						currentTextPart(undefined);
						currentSuggestion(undefined);
						commandArgIndex(undefined);
						return;
					}

					let index = -1;
					let currentArg: ReadonlyDeep<ArgumentOptions> | undefined;
					let endIndex: number | undefined = -1;
					for (const i of $range(0, argIndex)) {
						if (endIndex === undefined || i <= endIndex) continue;

						index++;
						if (index >= args.size()) {
							currentArg = undefined;
							break;
						}

						currentArg = args[index];
						const numArgs = currentArg.numArgs ?? 1;
						endIndex = numArgs !== "rest" ? i + (numArgs - 1) : undefined;
					}

					const argType = client.registry.getType(currentArg?.type ?? "");
					if (currentArg === undefined || argType === undefined) {
						currentSuggestion(undefined);
						currentTextPart(undefined);
						terminalArgIndex(undefined);
						commandArgIndex(undefined);
						return;
					}

					commandArgIndex(index);

					let argTextPart: string | undefined;
					let suggestion: ArgumentSuggestion;
					if (argType.kind === "single") {
						argTextPart = textPart;
						suggestion = getArgumentSuggestion(
							{
								kind: "single",
								options: currentArg,
								type: argType,
								input: argTextPart,
							},
							argTextPart,
						);
					} else {
						const textParts = splitString(textPart ?? "", ",", true);
						const lastText = !textParts.isEmpty()
							? textParts[textParts.size() - 1]
							: undefined;
						argTextPart = textPart?.sub(-1) !== "," ? lastText : undefined;
						suggestion = getArgumentSuggestion(
							{
								kind: "list",
								options: currentArg,
								type: argType,
								input: textParts,
							},
							argTextPart,
						);
					}

					currentTextPart(argTextPart);
					currentSuggestion(suggestion);
					if (suggestion?.error !== undefined) terminalTextValid(false);
				}}
				onSubmit={() => {
					const commandPath = currentCommandPath();
					const command =
						commandPath !== undefined
							? client.registry.getCommand(commandPath)
							: undefined;

					if (commandPath === undefined || command === undefined) {
						client.dispatcher.addHistoryEntry({
							success: false,
							text: "Command not found.",
							sentAt: os.time(),
						});
						return;
					}

					const missing = missingArgs();
					if (!missing.isEmpty()) {
						client.dispatcher.addHistoryEntry({
							success: false,
							text: `Missing arguments: ${missing.join(", ")}`,
							sentAt: os.time(),
						});
						return;
					}

					const args = ArrayUtil.slice(
						splitString(terminalText(), " "),
						commandPath.size(),
					);
					client.dispatcher.run(commandPath, args);
				}}
			/>
		</Frame>
	);
}
