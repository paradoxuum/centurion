import { RunService } from "@rbxts/services";
import Vide from "@rbxts/vide";

if (RunService.IsStudio() && RunService.IsClient()) {
	Vide.strict = true;
}
