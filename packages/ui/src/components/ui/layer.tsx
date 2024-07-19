import Vide, { Derivable } from "@rbxts/vide";
import { IS_EDIT } from "../../constants/util";
import { Group } from "./group";

interface LayerProps extends Vide.PropsWithChildren {
	visible?: Derivable<boolean>;
	displayOrder?: Derivable<number>;
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
