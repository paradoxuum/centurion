import { ClientAPI } from "@rbxts/centurion";
import { ContentProvider, Players } from "@rbxts/services";
import { mount } from "@rbxts/vide";
import { DEFAULT_INTERFACE_OPTIONS } from "../constants/options";
import { interfaceOptions } from "../store";
import { InterfaceOptions } from "../types";
import { CenturionApp } from "./centurion-app";

export namespace CenturionUI {
	const MAX_PRELOAD_ATTEMPTS = 3;
	const PRELOAD_ATTEMPT_INTERVAL = 3;

	export function updateOptions(options: Partial<InterfaceOptions>) {
		interfaceOptions((prev) => ({ ...prev, ...options }));
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
			mount(() => CenturionApp(api), target);
		};
	}
}
