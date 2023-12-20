import { ReflexProvider } from "@rbxts/react-reflex";
import Roact from "@rbxts/roact";
import { store } from "../store";
import { CommanderProvider, CommanderProviderProps } from "./commanderProvider";
import { RemProvider, RemProviderProps } from "./remProvider";
import {
	SuggestionProvider,
	SuggestionProviderProps,
} from "./suggestionProvider";

interface RootProviderProps
	extends RemProviderProps,
		CommanderProviderProps,
		SuggestionProviderProps {}

export function RootProvider({
	baseRem,
	value: data,
	getSuggestion,
	children,
}: RootProviderProps) {
	return (
		<ReflexProvider producer={store}>
			<RemProvider key="rem-provider" baseRem={baseRem}>
				<CommanderProvider key="data-provider" value={data}>
					<SuggestionProvider
						key="suggestion-provider"
						getSuggestion={getSuggestion}
					>
						{children}
					</SuggestionProvider>
				</CommanderProvider>
			</RemProvider>
		</ReflexProvider>
	);
}
