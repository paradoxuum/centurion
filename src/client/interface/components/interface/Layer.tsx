import Roact from "@rbxts/roact";
import { RunService } from "@rbxts/services";
import { Group } from "./Group";

const IS_EDIT = RunService.IsStudio() && !RunService.IsRunning();

interface LayerProps extends Roact.PropsWithChildren {
	displayOrder?: number;
}

export function Layer({ displayOrder, children }: LayerProps) {
	return IS_EDIT ? (
		<Group zIndex={displayOrder}>{children}</Group>
	) : (
		<screengui ResetOnSpawn={false} DisplayOrder={displayOrder} IgnoreGuiInset ZIndexBehavior="Sibling">
			{children}
		</screengui>
	);
}
