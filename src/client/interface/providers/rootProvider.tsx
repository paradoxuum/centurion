import { ReflexProvider } from "@rbxts/react-reflex";
import Roact from "@rbxts/roact";
import { store } from "../store";
import { CommanderProvider, CommanderProviderProps } from "./commanderProvider";
import { RemProvider, RemProviderProps } from "./remProvider";

interface RootProviderProps extends RemProviderProps, CommanderProviderProps {}

export function RootProvider({
	baseRem,
	value: data,
	children,
}: RootProviderProps) {
	return (
		<ReflexProvider producer={store}>
			<RemProvider key="rem-provider" baseRem={baseRem}>
				<CommanderProvider key="data-provider" value={data}>
					{children}
				</CommanderProvider>
			</RemProvider>
		</ReflexProvider>
	);
}
