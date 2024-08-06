import { Centurion } from "@rbxts/centurion";
import { CenturionUI } from "@rbxts/centurion-ui";

const client = Centurion.client();
client
	.start()
	.then(() => CenturionUI.start(client, {}))
	.catch((err) => warn("Failed to start Centurion:", err));
