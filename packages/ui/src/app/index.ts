import { CenturionClient, CenturionType } from "@rbxts/centurion";
import { ClientRegistry } from "@rbxts/centurion/out/client/registry";
import { ContentProvider, Players } from "@rbxts/services";
import { mount, read } from "@rbxts/vide";
import { DEFAULT_INTERFACE_OPTIONS } from "../constants/options";
import { DefaultPalette } from "../palette";
import { options as uiOptions, visible as uiVisible } from "../store";
import { InterfaceOptions } from "../types";
import { CenturionApp } from "./centurion-app";

export namespace CenturionUI {
	const MAX_PRELOAD_ATTEMPTS = 3;
	const PRELOAD_ATTEMPT_INTERVAL = 3;

	/**
	 * Returns whether the terminal UI is visible.
	 *
	 * @returns Whether the terminal UI is visible.
	 */
	export function isVisible() {
		return uiVisible();
	}

	/**
	 * Sets the visibility of the terminal UI.
	 *
	 * @param visible Whether the terminal UI should be visible.
	 */
	export function setVisible(visible: boolean) {
		uiVisible(visible);
	}

	/**
	 * Updates the terminal UI options.
	 *
	 * @param options The options to update.
	 */
	export function updateOptions(options: Partial<InterfaceOptions>) {
		uiOptions({
			...DEFAULT_INTERFACE_OPTIONS,
			...uiOptions(),
			...options,
		});
	}

	/**
	 * Mounts the terminal UI.
	 *
	 * If `registerBuiltInCommands` is **true** (default), client commands
	 * will be registered.
	 *
	 * @param client The Centurion client.
	 * @param options The terminal UI options.
	 */
	export function start(
		client: CenturionClient,
		options: Partial<InterfaceOptions> = {},
	) {
		if (client.config.registerBuiltInCommands) {
			registerCommands(client.registry);
		}
		updateOptions(options);

		// Attempt to preload font
		task.spawn(() => {
			const fontFamily = (
				read(options.font)?.regular ??
				read(DEFAULT_INTERFACE_OPTIONS.font).regular
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

		mount(
			() => CenturionApp(client),
			Players.LocalPlayer.WaitForChild("PlayerGui"),
		);
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
