import { BindingOrValue, lerpBinding } from "@rbxts/pretty-react-hooks";
import Roact from "@rbxts/roact";
import { useMotion } from "../../hooks/useMotion";
import { useRem } from "../../hooks/useRem";
import { Outline } from "./Outline";
import { ReactiveButton } from "./ReactiveButton";
import { Shadow } from "./Shadow";

interface PrimaryButtonProps extends Roact.PropsWithChildren {
	readonly onClick?: () => void;
	readonly onHover?: (hovered: boolean) => void;
	readonly size?: BindingOrValue<UDim2>;
	readonly position?: BindingOrValue<UDim2>;
	readonly anchorPoint?: BindingOrValue<Vector2>;
	readonly color?: Color3;
	readonly cornerRadius?: BindingOrValue<UDim>;
	readonly layoutOrder?: BindingOrValue<number>;
	readonly animatePosition?: boolean;
	readonly animatePositionStrength?: number;
	readonly animatePositionDirection?: Vector2;
	readonly animateSize?: boolean;
	readonly animateSizeStrength?: number;
}

export function PrimaryButton(props: PrimaryButtonProps) {
	const rem = useRem();
	const [hover, hoverMotion] = useMotion(0);

	return (
		<ReactiveButton
			onClick={props.onClick}
			onHover={(hovered) => {
				hoverMotion.spring(hovered ? 1 : 0);
				props.onHover?.(hovered);
			}}
			anchorPoint={props.anchorPoint}
			size={props.size}
			position={props.position}
			layoutOrder={props.layoutOrder}
			cornerRadius={props.cornerRadius}
			animatePosition={props.animatePosition}
			animatePositionDirection={props.animatePositionDirection}
			animatePositionStrength={props.animatePositionStrength}
			animateSize={props.animateSize}
			animateSizeStrength={props.animateSizeStrength}
			backgroundColor={props.color}
		>
			<Shadow
				key="glow"
				shadowColor={props.color}
				shadowSize={rem(2.5)}
				shadowBlur={0.3}
				shadowTransparency={lerpBinding(hover, 0.4, 0.1)}
				shadowPosition={rem(0.5)}
			/>

			{/* <Frame
				key="background"
				backgroundColor={props.color}
				cornerRadius={new UDim(0, rem(1))}
				size={new UDim2(1, 0, 1, 0)}
			>
				<uigradient
					key="background-gradient"
					Offset={lerpBinding(hover, new Vector2(), new Vector2(0, 1))}
					Rotation={90}
					Transparency={new NumberSequence(0, 0.1)}
				/>
			</Frame> */}

			<Outline
				key="button-outline"
				innerThickness={rem(4, "pixel")}
				outerThickness={rem(2, "pixel")}
				innerColor={props.color}
				cornerRadius={props.cornerRadius}
			/>

			{props.children}
		</ReactiveButton>
	);
}
