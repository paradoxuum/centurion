import { SharedOptions } from "../shared/options";

export interface ClientOptions extends SharedOptions {
	historyLength: number;
	interface?: () => void;
}

export interface HistoryEntry {
	text: string;
	success: boolean;
	sentAt: number;
}
