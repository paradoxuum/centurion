export interface SharedOptions {
	registerBuiltInTypes: boolean;
	defaultContextState?: defined;
}

export const DEFAULT_SHARED_OPTIONS: SharedOptions = {
	registerBuiltInTypes: true,
};
