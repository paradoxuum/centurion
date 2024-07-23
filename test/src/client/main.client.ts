import { Centurion } from "@rbxts/centurion";
import { CenturionUI } from "@rbxts/centurion-ui";

Centurion.client({
	interface: CenturionUI.create(),
})
	.start()
	.catch((err) => {
		warn(`An error occurred and Centurion could not be started: ${err}`);
	});
