import { Response } from "@rbxts/centurion";

export interface Options {
	hide_on_lost_focus: boolean;
	activation_keys: Enum.KeyCode[];
	theme: Theme;
	font: Font;
	icon: string;
	transparency: number;
	format_date: (log: Log) => string;
	max_suggestions: number;

	text_size: number;
	subtext_size: number;

	anchor: Vector2;
	width: UDim;
	position: UDim2;
}

export interface Theme {
	background: Color3;
	surface: Color3;
	text: Color3;
	subtext: Color3;
	highlight: Color3;
	success: Color3;
	error: Color3;
}

export interface Log {
	command: string;
	response: Response;
}

export namespace CenturionUI {
	export function mount(keys: Enum.KeyCode[]): void;

	export function configure(options: Partial<Options>): void;

	export function register_commands(): void;

	export const themes: {
		frappe: Theme;
		macchiato: Theme;
		latte: Theme;
		mocha: Theme;
		roblox: Theme;
	};
}
