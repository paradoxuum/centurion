import "./config";

import { Signal } from "@rbxts/beacon";
import React, { StrictMode } from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import { ContentProvider, Players } from "@rbxts/services";
import { CommanderClient } from "../../core";
import { shortcuts } from "../../shortcut";
import { DEFAULT_INTERFACE_OPTIONS } from "../constants/options";
import { RootProvider } from "../providers/root-provider";
import { InterfaceOptions } from "../types";
import { TerminalApp } from "./terminal-app";

export namespace CommanderInterface {
	const MAX_PRELOAD_ATTEMPTS = 3;
	const PRELOAD_ATTEMPT_INTERVAL = 3;
	const optionsChanged = new Signal<[options: Partial<InterfaceOptions>]>();

	export function setOptions(options: Partial<InterfaceOptions>) {
		optionsChanged.Fire(options);
	}

	export function create(options: Partial<InterfaceOptions> = {}) {
		return () => {
			const root = createRoot(new Instance("Folder"));
			const target = Players.LocalPlayer.WaitForChild("PlayerGui");

			// Attempt to preload font
			task.spawn(() => {
				const fontFamily = (
					options.font?.regular ?? DEFAULT_INTERFACE_OPTIONS.font.regular
				).Family;

				let attempts = 0;
				while (attempts < MAX_PRELOAD_ATTEMPTS) {
					ContentProvider.PreloadAsync([fontFamily], (_, status) => {
						if (status === Enum.AssetFetchStatus.Success) {
							attempts = MAX_PRELOAD_ATTEMPTS;
						}
					});

					if (attempts === MAX_PRELOAD_ATTEMPTS) break;
					task.wait(PRELOAD_ATTEMPT_INTERVAL);
					attempts++;
				}
			});

			if (CommanderClient.options().shortcutsEnabled) {
				shortcuts(options.shortcuts?.createTouchButtons);
			}

			root.render(
				createPortal(
					<StrictMode>
						<RootProvider
							options={{ ...DEFAULT_INTERFACE_OPTIONS, ...options }}
							optionsChanged={optionsChanged}
						>
							<TerminalApp />
						</RootProvider>
					</StrictMode>,
					target,
				),
			);
		};
	}
}
