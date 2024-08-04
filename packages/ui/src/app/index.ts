import { CenturionType, ClientAPI } from "@rbxts/centurion";
import { ClientRegistry } from "@rbxts/centurion/out/client/registry";
import { ContentProvider, Players } from "@rbxts/services";
import { mount } from "@rbxts/vide";
import { DEFAULT_INTERFACE_OPTIONS } from "../constants/options";
import { DefaultPalette } from "../palette";
import { interfaceOptions, interfaceVisible } from "../store";
import { InterfaceOptions } from "../types";
import { CenturionApp } from "./centurion-app";

export namespace CenturionUI {
	const MAX_PRELOAD_ATTEMPTS = 3;
	const PRELOAD_ATTEMPT_INTERVAL = 3;

	export function setVisible(visible: boolean) {
		interfaceVisible(visible);
	}

	export function updateOptions(options: Partial<InterfaceOptions>) {
		interfaceOptions((prev) => ({ ...prev, ...options }));
	}

	export function create(
		options: Partial<InterfaceOptions> = {},
	): (api: ClientAPI) => void {
		return (api) => {
			if (api.config.registerBuiltInCommands) registerCommands(api.registry);
			updateOptions(options);

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

	function registerCommands(registry: ClientRegistry) {
		registry.registerCommand(
			{
				name: "theme",
				description: "Change the terminal's theme",
				arguments: [
					{
						name: "name",
						description: "The name of the theme",
						type: CenturionType.String,
						suggestions: ["mocha", "macchiato", "frappe", "latte"],
					},
				],
			},
			(ctx, theme: string) => {
				if (!(theme in DefaultPalette)) {
					ctx.error("Invalid theme");
					return;
				}

				updateOptions({
					palette: DefaultPalette[theme as never],
				});
				ctx.reply(`Set theme to '${theme}'`);
			},
			["centurion"],
		);
	}
}
