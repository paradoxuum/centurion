import { Centurion, CenturionLogLevel } from "@rbxts/centurion";
import { Players } from "@rbxts/services";
import { addAdmin, isAdmin, removeAdmin } from "./permissions";

let firstPlayer = true;
Players.PlayerAdded.Connect((player) => {
	// Give the first player admin permissions
	if (firstPlayer) {
		addAdmin(player);
		firstPlayer = false;
	}
});

Players.PlayerRemoving.Connect((player) => {
	removeAdmin(player);
});

const server = Centurion.server({
	logLevel: CenturionLogLevel.Debug,
	syncFilter: (player) => {
		if (firstPlayer) {
			firstPlayer = false;
			addAdmin(player);
		}
		return isAdmin(player);
	},
});

assert(script.Parent !== undefined);
server.registry.load(script.Parent.WaitForChild("commands"));
server.start();
