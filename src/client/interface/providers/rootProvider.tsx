import Roact from "@rbxts/roact";
import { DataProvider, DataProviderProps } from "./dataProvider";
import { RemProvider, RemProviderProps } from "./remProvider";

interface RootProviderProps extends RemProviderProps, DataProviderProps {}

export function RootProvider({ baseRem, data, children }: RootProviderProps) {
	return (
		<RemProvider key="rem-provider" baseRem={baseRem}>
			<DataProvider data={data}>{children}</DataProvider>
		</RemProvider>
	);
}
