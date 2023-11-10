import { BindingOrValue, blend, composeBindings, lerpBinding, useUpdateEffect } from "@rbxts/pretty-react-hooks";
import Roact from "@rbxts/roact";
import { useMotion } from "../../../hooks/useMotion";
import { useRem } from "../../../hooks/useRem";
import { Button } from "../Button";
import { Frame } from "../Frame";
import { useButtonAnimation } from "./useButtonAnimation";
import { useButtonState } from "./useButtonState";

interface ReactiveButtonProps extends Roact.PropsWithChildren {
	onClick?: () => void;
	onMouseDown?: () => void;
	onMouseUp?: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	onHover?: (hovered: boolean) => void;
	onPress?: (pressed: boolean) => void;
	enabled?: boolean;
	size?: BindingOrValue<UDim2>;
	position?: BindingOrValue<UDim2>;
	anchorPoint?: BindingOrValue<Vector2>;
	backgroundColor?: BindingOrValue<Color3>;
	backgroundTransparency?: BindingOrValue<number>;
	cornerRadius?: BindingOrValue<UDim>;
	layoutOrder?: BindingOrValue<number>;
	animatePosition?: boolean;
	animatePositionStrength?: number;
	animatePositionDirection?: Vector2;
	animateSize?: boolean;
	animateSizeStrength?: number;
	zIndex?: BindingOrValue<number>;
	event?: Roact.JsxInstanceEvents<TextButton>;
	change?: Roact.JsxInstanceChangeEvents<TextButton>;
}

export function ReactiveButton({
	onClick,
	onMouseDown,
	onMouseUp,
	onMouseEnter,
	onMouseLeave,
	onHover,
	onPress,
	enabled = true,
	size,
	position,
	anchorPoint,
	backgroundColor = Color3.fromRGB(255, 255, 255),
	backgroundTransparency = 0,
	cornerRadius,
	layoutOrder,
	zIndex,
	animatePosition = true,
	animatePositionStrength = 1,
	animatePositionDirection = new Vector2(0, 1),
	animateSize = true,
	animateSizeStrength = 1,
	event = {},
	change = {},
	children,
}: ReactiveButtonProps) {
	const rem = useRem();
	const [sizeAnimation, sizeMotion] = useMotion(0);
	const [press, hover, buttonEvents] = useButtonState();
	const animation = useButtonAnimation(press, hover);

	useUpdateEffect(() => {
		if (press) {
			sizeMotion.spring(-0.1, { tension: 300 });
		} else {
			sizeMotion.spring(0, { impulse: 0.01, tension: 300 });
		}
	}, [press]);

	useUpdateEffect(() => {
		onHover?.(hover);
	}, [hover]);

	useUpdateEffect(() => {
		onPress?.(press);
	}, [press]);

	return (
		<Button
			onClick={enabled ? onClick : undefined}
			active={enabled}
			onMouseDown={() => {
				if (!enabled) return;
				buttonEvents.onMouseDown();
				onMouseDown?.();
			}}
			onMouseUp={() => {
				if (!enabled) return;
				buttonEvents.onMouseUp();
				onMouseUp?.();
			}}
			onMouseEnter={() => {
				buttonEvents.onMouseEnter();
				onMouseEnter?.();
			}}
			onMouseLeave={() => {
				buttonEvents.onMouseLeave();
				onMouseLeave?.();
			}}
			backgroundTransparency={1}
			size={size}
			position={position}
			anchorPoint={anchorPoint}
			layoutOrder={layoutOrder}
			zIndex={zIndex}
			event={event}
			change={change}
		>
			<Frame
				key="button-box"
				backgroundColor={composeBindings(
					animation.hoverOnly,
					animation.press,
					backgroundColor,
					(hover, press, color) => {
						return color.Lerp(new Color3(1, 1, 1), hover * 0.15).Lerp(new Color3(), press * 0.1);
					},
				)}
				backgroundTransparency={composeBindings(
					animation.press,
					backgroundTransparency,
					(press, transparency) => {
						return blend(-press * 0.2, transparency);
					},
				)}
				cornerRadius={cornerRadius}
				anchorPoint={new Vector2(0.5, 0.5)}
				size={lerpBinding(
					animateSize ? sizeAnimation : 0,
					new UDim2(1, 0, 1, 0),
					new UDim2(1, rem(2 * animateSizeStrength), 1, rem(2 * animateSizeStrength)),
				)}
				position={lerpBinding(
					animatePosition ? animation.position : 0,
					new UDim2(0.5, 0, 0.5, 0),
					new UDim2(
						0.5,
						(3 + rem(0.1)) * animatePositionStrength * animatePositionDirection.X,
						0.5,
						(3 + rem(0.1)) * animatePositionStrength * animatePositionDirection.Y,
					),
				)}
			>
				{children}
			</Frame>
		</Button>
	);
}
