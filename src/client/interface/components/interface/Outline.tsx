import {
	BindingOrValue,
	blend,
	composeBindings,
} from "@rbxts/pretty-react-hooks";
import React, { useMemo } from "@rbxts/react";
import { usePx } from "../../hooks/usePx";
import { Group } from "./Group";

interface OutlineProps extends React.PropsWithChildren {
	readonly outlineTransparency?: BindingOrValue<number>;
	readonly innerColor?: BindingOrValue<Color3>;
	readonly outerColor?: BindingOrValue<Color3>;
	readonly innerTransparency?: BindingOrValue<number>;
	readonly outerTransparency?: BindingOrValue<number>;
	readonly innerThickness?: BindingOrValue<number>;
	readonly outerThickness?: BindingOrValue<number>;
	readonly cornerRadius?: BindingOrValue<UDim>;
}

function ceilEven(n: number) {
	return math.ceil(n / 2) * 2;
}

const DEFAULT_INNER_COLOR = new Color3(1, 1, 1);
const DEFAULT_OUTER_COLOR = new Color3(0, 0, 0);

export function Outline({
	outlineTransparency = 0,
	innerColor = DEFAULT_INNER_COLOR,
	outerColor = DEFAULT_OUTER_COLOR,
	innerTransparency = 0.9,
	outerTransparency = 0.85,
	innerThickness,
	outerThickness,
	cornerRadius,
	children,
}: OutlineProps) {
	const px = usePx();

	const properties = {
		innerThickness: innerThickness ?? px(3),
		outerThickness: outerThickness ?? px(1.5),
		cornerRadius: cornerRadius ?? new UDim(0, px(8)),
	};

	const innerStyle = useMemo(() => {
		const size = composeBindings(properties.innerThickness, (thickness) => {
			return new UDim2(
				1,
				ceilEven(-2 * thickness),
				1,
				ceilEven(-2 * thickness),
			);
		});

		const position = composeBindings(properties.innerThickness, (thickness) => {
			return new UDim2(0, thickness, 0, thickness);
		});

		const radius = composeBindings(
			properties.cornerRadius,
			properties.innerThickness,
			(radius, thickness) => {
				return radius.sub(new UDim(0, thickness));
			},
		);

		const transparency = composeBindings(
			outlineTransparency,
			innerTransparency,
			(a, b) => {
				return math.clamp(blend(a, b), 0, 1);
			},
		);

		return { size, position, radius, transparency };
	}, [
		properties.innerThickness,
		innerTransparency,
		properties.cornerRadius,
		outlineTransparency,
		px,
	]);

	const outerStyle = useMemo(() => {
		const transparency = composeBindings(
			outlineTransparency,
			outerTransparency,
			(a, b) => {
				return math.clamp(blend(a, b), 0, 1);
			},
		);

		return { transparency };
	}, [outlineTransparency, outerTransparency]);

	return (
		<>
			<Group size={innerStyle.size} position={innerStyle.position}>
				<uicorner CornerRadius={innerStyle.radius} />
				<uistroke
					Color={innerColor}
					Transparency={innerStyle.transparency}
					Thickness={innerThickness}
				>
					{children}
				</uistroke>
			</Group>

			<Group>
				<uicorner CornerRadius={cornerRadius} />
				<uistroke
					Color={outerColor}
					Transparency={outerStyle.transparency}
					Thickness={outerThickness}
				>
					{children}
				</uistroke>
			</Group>
		</>
	);
}
