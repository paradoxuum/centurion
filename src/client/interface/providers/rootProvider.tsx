import { ReflexProvider } from "@rbxts/react-reflex";
import Roact from "@rbxts/roact";
import { store } from "../store";
import { DataProvider, DataProviderProps } from "./dataProvider";
import { RemProvider, RemProviderProps } from "./remProvider";
import { SuggestionProvider, SuggestionProviderProps } from "./suggestionProvider";

interface RootProviderProps extends RemProviderProps, DataProviderProps, SuggestionProviderProps {}

export function RootProvider({ baseRem, data, getSuggestion, children }: RootProviderProps) {
	return (
		<ReflexProvider producer={store}>
			<RemProvider key="rem-provider" baseRem={baseRem}>
				<DataProvider key="data-provider" data={data}>
					<SuggestionProvider key="suggestion-provider" getSuggestion={getSuggestion}>
						{children}
					</SuggestionProvider>
				</DataProvider>
			</RemProvider>
		</ReflexProvider>
	);
}
