import Roact from "@rbxts/roact";
import { TextField } from "../../components/interface/TextField";
import { story } from "../../util/story";

export = story({
	summary: "A text field component",
	story: () => <TextField size={UDim2.fromOffset(100, 50)} />,
	controls: {},
});
