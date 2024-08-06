import { HistoryEntry } from "@rbxts/centurion";
import { TextService } from "@rbxts/services";
import { cleanup, derive, source } from "@rbxts/vide";
import { HISTORY_TEXT_SIZE } from "../constants/text";
import { interfaceOptions } from "../store";
import { HistoryData, HistoryLineData } from "../types";
import { useAtom } from "./use-atom";
import { useClient } from "./use-client";
import { useEvent } from "./use-event";
import { px } from "./use-px";

export function useHistory() {
	const client = useClient();
	const options = useAtom(interfaceOptions);
	const history = source<HistoryEntry[]>(client.dispatcher.getHistory());

	useEvent(client.dispatcher.historyUpdated, (entries) =>
		history([...entries]),
	);

	const textBoundsParams = new Instance("GetTextBoundsParams");
	textBoundsParams.Width = math.huge;
	textBoundsParams.RichText = true;
	cleanup(() => {
		textBoundsParams.Destroy();
	});

	return derive<HistoryData>(() => {
		const entries = history();
		const historySize = entries.size();
		let totalHeight = historySize > 0 ? px(8) + (historySize - 1) * px(8) : 0;

		textBoundsParams.Size = HISTORY_TEXT_SIZE;
		textBoundsParams.Font = options().font.regular;

		const historyLines: HistoryLineData[] = [];
		for (const entry of entries) {
			textBoundsParams.Text = entry.text;
			const textSize = TextService.GetTextBoundsAsync(textBoundsParams);
			const lineHeight = px(textSize.Y + 4);
			totalHeight += lineHeight;
			historyLines.push({ entry, height: lineHeight });
		}
		return {
			lines: historyLines,
			height: totalHeight,
		};
	});
}
