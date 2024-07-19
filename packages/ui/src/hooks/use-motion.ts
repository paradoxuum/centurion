import { MotionGoal, createMotion } from "@rbxts/ripple";
import { cleanup, source } from "@rbxts/vide";

type NonStrict<T> = T extends number ? number : T;

export function useMotion<T extends MotionGoal>(initialValue: NonStrict<T>) {
	const motion = createMotion(initialValue);
	const state = source(initialValue);

	motion.onStep(state);
	motion.start();

	cleanup(() => {
		motion.stop();
	});

	return $tuple(state, motion);
}
