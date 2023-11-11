import Roact from "@rbxts/roact";
import { RemProvider, RemProviderProps } from "./remProvider";

interface RootProviderProps extends RemProviderProps {}

export function RootProvider({ baseRem, children }: RootProviderProps) {
	return (
		<RemProvider key="rem-provider" baseRem={baseRem}>
			{children}
		</RemProvider>
	);
}
