import Vide, { Derivable, derive, read } from "@rbxts/vide";
import { px } from "../../hooks/use-px";
import { Group } from "./group";

interface OutlineProps {
	outlineTransparency?: Derivable<number>;
	innerColor?: Derivable<Color3>;
	outerColor?: Derivable<Color3>;
	innerTransparency?: Derivable<number>;
	outerTransparency?: Derivable<number>;
	innerThickness?: Derivable<number>;
	outerThickness?: Derivable<number>;
	cornerRadius?: Derivable<UDim>;
	children?: Vide.Node;
}

function ceilEven(n: number) {
	return math.ceil(n / 2) * 2;
}

export function blend(...transparencies: number[]) {
	let result = 1;

	for (const transparency of transparencies) {
		result *= 1 - transparency;
	}

	return 1 - result;
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
	const properties = derive(() => ({
		innerThickness: innerThickness ?? px(3),
		outerThickness: outerThickness ?? px(1.5),
		cornerRadius: cornerRadius ?? new UDim(0, px(8)),
	}));

	const innerStyle = derive(() => {
		const outlineProps = properties();
		const thickness = read(outlineProps.innerThickness);
		const size = new UDim2(
			1,
			ceilEven(-2 * thickness),
			1,
			ceilEven(-2 * thickness),
		);

		const position = new UDim2(0, thickness, 0, thickness);
		const radius = read(outlineProps.cornerRadius).sub(new UDim(0, thickness));
		const transparency = math.clamp(
			blend(read(outlineTransparency), read(innerTransparency)),
			0,
			1,
		);

		return { size, position, radius, transparency };
	});

	const outerStyle = derive(() => {
		const transparency = math.clamp(
			blend(read(outlineTransparency), read(outerTransparency)),
			0,
			1,
		);

		return { transparency };
	});

	return (
		<>
			<Group
				size={() => innerStyle().size}
				position={() => innerStyle().position}
			>
				<uicorner CornerRadius={() => innerStyle().radius} />
				<uistroke
					Color={innerColor}
					Transparency={() => innerStyle().transparency}
					Thickness={innerThickness}
				>
					{children}
				</uistroke>
			</Group>

			<Group>
				<uicorner CornerRadius={cornerRadius} />
				<uistroke
					Color={outerColor}
					Transparency={() => outerStyle().transparency}
					Thickness={outerThickness}
				>
					{children}
				</uistroke>
			</Group>
		</>
	);
}
