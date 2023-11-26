import { ClientOptions } from "./types";

export const DEFAULT_HISTORY_LENGTH = 1000;

export const DEFAULT_ACTIVATION_KEYS = [Enum.KeyCode.F2];

export const DEFAULT_OPTIONS: ClientOptions = {
	historyLength: DEFAULT_HISTORY_LENGTH,
	activationKeys: DEFAULT_ACTIVATION_KEYS,
};
