import Roact from "@rbxts/roact";
import { fonts } from "../../constants/fonts";
import { images } from "../../constants/images";
import { palette } from "../../constants/palette";
import { useRem } from "../../hooks/useRem";
import { Frame } from "../interface/Frame";
import { Group } from "../interface/Group";
import { Image } from "../interface/Image";
import { Padding } from "../interface/Padding";
import { PrimaryButton } from "../interface/PrimaryButton";
import { Shadow } from "../interface/Shadow";
import { TextField } from "../interface/TextField";
import { SuggestionList } from "./SuggestionList";

export default function Terminal() {
	const rem = useRem();

	return (
		<Group key="terminal" size={new UDim2(1, 0, 0, rem(32))}>
			<Group key="terminal-bg" size={new UDim2(1, 0, 0, rem(5))}>
				<Frame
					backgroundColor={palette.crust}
					size={UDim2.fromScale(1, 1)}
					cornerRadius={new UDim(0, rem(0.5))}
				>
					<Padding all={new UDim(0, rem(0.5))} />

					<Group key="text-field" anchorPoint={new Vector2(0, 0)} size={new UDim2(1, -rem(5), 1, 0)}>
						<TextField
							key="textbox"
							size={UDim2.fromScale(1, 1)}
							placeholderText="Enter command..."
							textColor={palette.white}
							textSize={20}
							textXAlignment="Left"
							textTruncate="AtEnd"
							font={fonts.inter.medium}
						>
							<Padding all={new UDim(0, rem(1))} />
						</TextField>
						<Frame
							zIndex={0}
							backgroundColor={palette.mantle}
							size={UDim2.fromScale(1, 1)}
							cornerRadius={new UDim(0, rem(0.25))}
						/>
					</Group>

					<PrimaryButton
						anchorPoint={new Vector2(1, 0.5)}
						size={UDim2.fromOffset(rem(4), rem(4))}
						position={new UDim2(1, 0, 0.5, 0)}
						color={palette.green}
						animatePosition={false}
						cornerRadius={new UDim(0, rem(0.5))}
					>
						<Image
							anchorPoint={new Vector2(0.5, 0.5)}
							size={new UDim2(1, -rem(1), 1, -rem(1))}
							position={UDim2.fromScale(0.5, 0.5)}
							image={images.play}
						/>
					</PrimaryButton>
				</Frame>

				<Shadow shadowSize={rem(1)} />
			</Group>

			<SuggestionList key="suggestions" position={new UDim2(0, 0, 0, rem(6))} suggestions={[]} />
		</Group>
	);
}
