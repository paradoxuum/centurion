import { Workspace } from "@rbxts/services";
import { cleanup, source } from "@rbxts/vide";

const BASE_RESOLUTION = new Vector2(1280, 832);
const MIN_SCALE = 0.5;
const DOMINANT_AXIS = 0.5;

const scale = source(1);

/**
 * Assigns a call signature to an object.
 *
 * @param callback The function to assign.
 * @param object The object to assign the function to.
 * @returns A callable object.
 */
function callable<T extends Callback, U>(callback: T, object: U): T & U {
	return setmetatable(object as never, {
		__call: (_, ...args) => callback(...args),
	});
}

/**
 * Rounds and scales a number to the current `px` unit. Includes additional
 * methods for edge cases.
 *
 * @param value The number to scale.
 * @returns A number in scaled `px` units.
 */
export const px = callable((value: number) => math.round(value * scale()), {
	even: (value: number) => math.round(value * scale() * 0.5) * 2,
	scale: (value: number) => value * scale(),
	floor: (value: number) => math.floor(value * scale()),
	ceil: (value: number) => math.ceil(value * scale()),
});

export type ScaleFunction = typeof px;

/**
 * Scales the current `px` unit based on the current viewport size. Should be
 * called once when mounting the app.
 */
export function usePx() {
	const camera = Workspace.CurrentCamera;
	assert(camera !== undefined, "CurrentCamera is not set");

	const updateScale = () => {
		const width = math.log(camera.ViewportSize.X / BASE_RESOLUTION.X, 2);
		const height = math.log(camera.ViewportSize.Y / BASE_RESOLUTION.Y, 2);
		const centered = width + (height - width) * DOMINANT_AXIS;

		scale(math.max(2 ** centered, MIN_SCALE));
	};

	const connection = camera
		.GetPropertyChangedSignal("ViewportSize")
		.Connect(() => {
			updateScale();
		});

	cleanup(connection);

	updateScale();
}
