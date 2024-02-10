import Roact from "@rbxts/roact";
import { IS_EDIT } from "../../constants/util";
import { Group } from "./Group";

interface LayerProps extends Roact.PropsWithChildren {
	visible?: boolean;
	displayOrder?: number;
}

export function Layer({ visible, displayOrder, children }: LayerProps) {
	return IS_EDIT ? (
		<Group visible={visible} zIndex={displayOrder}>
			{children}
		</Group>
	) : (
		<screengui
			Enabled={visible}
			ResetOnSpawn={false}
			DisplayOrder={displayOrder}
			IgnoreGuiInset
			ZIndexBehavior="Sibling"
		>
			{children}
		</screengui>
	);
}
