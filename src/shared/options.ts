import { CommandGuard } from "./types";

export interface SharedOptions {
	registerBuiltInTypes: boolean;
	guards?: CommandGuard[];
	defaultContextState?: defined;
}

export const DEFAULT_SHARED_OPTIONS: SharedOptions = {
	registerBuiltInTypes: true,
};
