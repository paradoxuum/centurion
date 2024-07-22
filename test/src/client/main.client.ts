import { CenturionClient } from "@rbxts/centurion";
import { CenturionUI } from "@rbxts/centurion-ui";

CenturionClient.start(() => {}, {
	interface: CenturionUI.create(),
})
	.catch((err) => {
		warn(`An error occurred and Centurion could not be started: ${err}`);
	})
	.await();
