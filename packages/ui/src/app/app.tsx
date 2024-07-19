import "./config";

import { Signal } from "@rbxts/beacon";
import { ClientAPI } from "@rbxts/centurion";
import { ContentProvider, Players } from "@rbxts/services";
import Vide, { mount } from "@rbxts/vide";
import { DEFAULT_INTERFACE_OPTIONS } from "../constants/options";
import { useAPI } from "../hooks/use-api";
import { usePx } from "../hooks/use-px";
import { InterfaceOptions } from "../types";
import { TerminalApp } from "./terminal-app";

export namespace CenturionUI {
	const MAX_PRELOAD_ATTEMPTS = 3;
	const PRELOAD_ATTEMPT_INTERVAL = 3;
	const optionsChanged = new Signal<[options: Partial<InterfaceOptions>]>();

	export function updateOptions(options: Partial<InterfaceOptions>) {
		optionsChanged.Fire(options);
	}

	export function create(
		options: Partial<InterfaceOptions> = {},
	): (api: ClientAPI) => void {
		return (api) => {
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

			const target = Players.LocalPlayer.WaitForChild("PlayerGui");
			mount(() => {
				useAPI(api);
				usePx();
				return <TerminalApp />;
			}, target);
		};
	}
}
