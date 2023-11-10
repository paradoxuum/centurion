import Roact from "@rbxts/roact";
import { ReactiveButton } from "../../components/interface/ReactiveButton";
import { palette } from "../../constants/palette";
import { story } from "../../util/story";

export = story({
	summary: "A reactive button",
	story: () => <ReactiveButton size={UDim2.fromOffset(200, 50)} backgroundColor={palette.mantle} />,
});
