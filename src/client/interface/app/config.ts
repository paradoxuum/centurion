import { RunService } from "@rbxts/services";

declare const _G: { __DEV__: boolean };

if (RunService.IsStudio() && RunService.IsClient()) {
	_G.__DEV__ = true;
}
