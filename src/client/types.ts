export interface AppData {
	history: HistoryEntry[];
}

export interface HistoryEntry {
	text: string;
	sentAt: number;
}
