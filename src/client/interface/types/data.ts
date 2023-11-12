import { AppData } from "../../types";

export interface AppContext extends AppData {
	text: string;
	setText: (text: string) => void;
	textIndex: number;
	setTextIndex: (index: number) => void;
	textParts: string[];
	setTextParts: (parts: string[]) => void;
}
