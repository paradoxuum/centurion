import { AppData } from "../../types";

export interface AppContext extends AppData {
	text: string;
	setText: (text: string) => void;
}
