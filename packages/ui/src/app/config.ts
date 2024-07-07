declare const _G: { __DEV__: boolean };

const RunService = game.GetService("RunService");

if (RunService.IsStudio() && RunService.IsClient()) {
	_G.__DEV__ = true;
}
