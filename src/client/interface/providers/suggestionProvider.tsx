import Roact, { createContext, useCallback, useState } from "@rbxts/roact";
import { Suggestion, SuggestionQuery } from "../types";

export interface SuggestionContextData {
	suggestion?: Suggestion;
	updateSuggestion: (query?: SuggestionQuery) => void;
}

export interface SuggestionProviderProps extends Roact.PropsWithChildren {
	getSuggestion: (query: SuggestionQuery) => Suggestion | undefined;
}

export const DEFAULT_SUGGESTION_CONTEXT: SuggestionContextData = {
	updateSuggestion: () => {},
};

export const SuggestionContext = createContext(DEFAULT_SUGGESTION_CONTEXT);

export function SuggestionProvider({
	getSuggestion,
	children,
}: SuggestionProviderProps) {
	const [suggestion, setSuggestion] = useState<Suggestion | undefined>();

	const updateSuggestion = useCallback((query?: SuggestionQuery) => {
		setSuggestion(query !== undefined ? getSuggestion(query) : undefined);
	}, []);

	return (
		<SuggestionContext.Provider value={{ suggestion, updateSuggestion }}>
			{children}
		</SuggestionContext.Provider>
	);
}
