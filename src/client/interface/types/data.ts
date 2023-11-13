import { AppData } from "../../types";

export type AppContext = Omit<AppData, "history" | "onHistoryChanged">;
