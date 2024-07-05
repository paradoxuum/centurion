import { Signal } from "@rbxts/beacon";
import { useEventListener } from "@rbxts/pretty-react-hooks";
import React, { createContext, useState } from "@rbxts/react";
import { InterfaceOptions } from "../types";

export interface InterfaceOptionsWithState extends InterfaceOptions {
	isMouseOnGUI: boolean;
	setMouseOnGUI: (newState: boolean) => void;
}

// we can safely assign to {} as the value will always be assigned in the provider
export const OptionsContext = createContext<InterfaceOptionsWithState>(
	{} as never,
);

export interface OptionsProviderProps extends React.PropsWithChildren {
	value: InterfaceOptions;
	changed: Signal<[options: Partial<InterfaceOptions>]>;
}

export function OptionsProvider({
	value,
	changed,
	children,
}: OptionsProviderProps) {
	const [isMouseOnGUI, setMouseOnGUI] = useState(false);
	const [options, setOptions] = useState<InterfaceOptions>({
		...value,
	});

	useEventListener(changed, (options) => {
		setOptions((prev) => ({ ...prev, ...options }));
	});

	return (
		<OptionsContext.Provider
			value={{ ...options, isMouseOnGUI, setMouseOnGUI }}
		>
			{children}
		</OptionsContext.Provider>
	);
}
