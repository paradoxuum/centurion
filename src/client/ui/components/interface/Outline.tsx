import { BindingOrValue, blend, composeBindings } from "@rbxts/pretty-react-hooks";
import Roact, { useMemo } from "@rbxts/roact";
import { palette } from "../../constants/palette";
import { useRem } from "../../hooks/useRem";
import { Group } from "./Group";

interface OutlineProps extends Roact.PropsWithChildren {
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

export function Outline({
	outlineTransparency = 0,
	innerColor = palette.white,
	outerColor = palette.black,
	innerTransparency = 0.9,
	outerTransparency = 0.85,
	innerThickness,
	outerThickness,
	cornerRadius,
	children,
}: OutlineProps) {
	const rem = useRem();

	innerThickness ??= rem(3, "pixel");
	outerThickness ??= rem(1.5, "pixel");
	cornerRadius ??= new UDim(0, rem(0.5));

	const innerStyle = useMemo(() => {
		const size = composeBindings(innerThickness!, (thickness) => {
			return new UDim2(1, ceilEven(-2 * thickness), 1, ceilEven(-2 * thickness));
		});

		const position = composeBindings(innerThickness!, (thickness) => {
			return new UDim2(0, thickness, 0, thickness);
		});

		const radius = composeBindings(cornerRadius!, innerThickness!, (radius, thickness) => {
			return radius.sub(new UDim(0, thickness));
		});

		const transparency = composeBindings(outlineTransparency, innerTransparency, (a, b) => {
			return math.clamp(blend(a, b), 0, 1);
		});

		return { size, position, radius, transparency };
	}, [innerThickness, innerTransparency, cornerRadius, outlineTransparency, rem]);

	const outerStyle = useMemo(() => {
		const transparency = composeBindings(outlineTransparency, outerTransparency, (a, b) => {
			return math.clamp(blend(a, b), 0, 1);
		});

		return { transparency };
	}, [outlineTransparency, outerTransparency]);

	return (
		<>
			<Group key="inner-border" size={innerStyle.size} position={innerStyle.position}>
				<uicorner key="corner" CornerRadius={innerStyle.radius} />
				<uistroke
					key="stroke"
					Color={innerColor}
					Transparency={innerStyle.transparency}
					Thickness={innerThickness}
				>
					{children}
				</uistroke>
			</Group>

			<Group key="outer-border">
				<uicorner key="corner" CornerRadius={cornerRadius} />
				<uistroke
					key="stroke"
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
