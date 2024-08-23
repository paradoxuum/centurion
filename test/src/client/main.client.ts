import { Centurion, CenturionLogLevel } from "@rbxts/centurion";
import { CenturionUI } from "@rbxts/centurion-ui";

const client = Centurion.client({
	logLevel: CenturionLogLevel.Debug,
});
client
	.start()
	.then(() => CenturionUI.start(client, {}))
	.catch((err) => warn("Failed to start Centurion:", err));
