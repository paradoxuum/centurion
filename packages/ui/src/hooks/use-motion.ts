import { useEventListener } from "@rbxts/pretty-react-hooks";
import { Binding, useBinding, useMemo } from "@rbxts/react";
import { Motion, MotionGoal, createMotion } from "@rbxts/ripple";
import { RunService } from "@rbxts/services";

export function useMotion(
	initialValue: number,
): LuaTuple<[Binding<number>, Motion]>;

export function useMotion<T extends MotionGoal>(
	initialValue: T,
): LuaTuple<[Binding<T>, Motion<T>]>;

export function useMotion<T extends MotionGoal>(initialValue: T) {
	const motion = useMemo(() => {
		return createMotion(initialValue);
	}, []);

	const [binding, setValue] = useBinding(initialValue);

	useEventListener(RunService.Heartbeat, (delta) => {
		const value = motion.step(delta);

		if (value !== binding.getValue()) {
			setValue(value);
		}
	});

	return $tuple(binding, motion);
}
