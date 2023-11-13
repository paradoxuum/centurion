import { ReflexProvider } from "@rbxts/react-reflex";
import Roact from "@rbxts/roact";
import { store } from "../store";
import { DataProvider, DataProviderProps } from "./dataProvider";
import { RemProvider, RemProviderProps } from "./remProvider";

interface RootProviderProps extends RemProviderProps, DataProviderProps {}

export function RootProvider({ baseRem, data, children }: RootProviderProps) {
	return (
		<ReflexProvider producer={store}>
			<RemProvider key="rem-provider" baseRem={baseRem}>
				<DataProvider data={data}>{children}</DataProvider>
			</RemProvider>
		</ReflexProvider>
	);
}
