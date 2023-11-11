import Roact, { useRef } from "@rbxts/roact";
import { images } from "../../constants/images";
import { palette } from "../../constants/palette";
import { useRem } from "../../hooks/useRem";
import { Frame } from "../interface/Frame";
import { Group } from "../interface/Group";
import { Image } from "../interface/Image";
import { Padding } from "../interface/Padding";
import { PrimaryButton } from "../interface/PrimaryButton";
import { Shadow } from "../interface/Shadow";
import { SuggestionList } from "./SuggestionList";
import { TerminalTextField } from "./TerminalTextField";

export default function Terminal() {
	const rem = useRem();
	const textBoxRef = useRef<TextBox>();

	return (
		<Group key="terminal" size={new UDim2(1, 0, 0, rem(32))}>
			<Group key="terminal-bg" size={new UDim2(1, 0, 0, rem(5))}>
				<Frame
					backgroundColor={palette.crust}
					size={UDim2.fromScale(1, 1)}
					cornerRadius={new UDim(0, rem(0.5))}
				>
					<Padding all={new UDim(0, rem(0.5))} />

					<TerminalTextField size={new UDim2(1, -rem(4.5), 1, 0)} />

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
