import { RunService } from "@rbxts/services";

export const IS_EDIT = RunService.IsStudio() && !RunService.IsRunning();
