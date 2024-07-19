import { Workspace } from "@rbxts/services";
import { debounce } from "@rbxts/set-timeout";
import { cleanup, source } from "@rbxts/vide";
import { useEvent } from "./use-event";

const BASE_RESOLUTION = new Vector2(1280, 832);
const MIN_SCALE = 0.75;
const DOMINANT_AXIS = 0.5;

const scale = source(1);

interface ScaleFunction {
	/**
	 * Scales `pixels` based on the current viewport size and rounds the result.
	 */
	(pixels: number): number;
	/**
	 * Scales `pixels` and rounds the result to the nearest even number.
	 */
	even: (pixels: number) => number;
	/**
	 * Scales a number based on the current viewport size without rounding.
	 */
	scale: (percent: number) => number;
	/**
	 * Scales `pixels` and rounds the result down.
	 */
	floor: (pixels: number) => number;
	/**
	 * Scales `pixels` and rounds the result up.
	 */
	ceil: (pixels: number) => number;
}

/**
 * Rounds and scales a number to the current `px` unit. Includes additional
 * methods for edge cases.
 *
 * @param value The number to scale.
 * @returns A number in scaled `px` units.
 */
export const px = setmetatable(
	{
		even: (value: number) => math.round(value * scale() * 0.5) * 2,
		scale: (value: number) => value * scale(),
		floor: (value: number) => math.floor(value * scale()),
		ceil: (value: number) => math.ceil(value * scale()),
	},
	{
		__call: (_, value) => math.round((value as number) * scale()),
	},
) as ScaleFunction;

/**
 * Scales the current `px` unit based on the current viewport size. Should be
 * called once in `Vide.mount`.
 */
export function usePx() {
	const camera = Workspace.CurrentCamera;
	assert(camera, "CurrentCamera is not set");

	const updateScale = debounce(
		() => {
			const viewport = camera.ViewportSize;
			const width = math.log(viewport.X / BASE_RESOLUTION.X, 2);
			const height = math.log(viewport.Y / BASE_RESOLUTION.Y, 2);
			const centered = width + (height - width) * DOMINANT_AXIS;

			scale(math.max(2 ** centered, MIN_SCALE));
		},
		0.2,
		{
			leading: true,
		},
	);

	cleanup(() => {
		updateScale.cancel();
	});

	useEvent(camera.GetPropertyChangedSignal("ViewportSize"), () => {
		updateScale();
	});

	updateScale();
}
