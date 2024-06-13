import { RunService } from "@rbxts/services";
import { CommandContextData, CommandOptions, GroupOptions } from "./types";

type NetworkInstances = Pick<
	CreatableInstances,
	"RemoteEvent" | "RemoteFunction"
>;

function getRemote<T extends keyof NetworkInstances>(
	className: T,
	name: string,
): NetworkInstances[T] {
	if (RunService.IsServer()) {
		let container = script.Parent?.FindFirstChild("remotes");
		if (container === undefined) {
			container = new Instance("Folder");
			container.Name = "remotes";
			container.Parent = script.Parent;
		}

		const remote = new Instance(className);
		remote.Name = name;
		remote.Parent = container;
		return remote;
	}

	const instance = script.Parent?.WaitForChild("remotes");
	assert(
		instance !== undefined && classIs(instance, "Folder"),
		"Remotes folder not found",
	);
	const container = instance;

	const remote = container.WaitForChild(name);
	assert(classIs(remote, className), `Remote '${name}' not found`);
	return remote;
}

export interface SyncData {
	commands: Map<string, CommandOptions>;
	groups: Map<string, GroupOptions>;
}

export function getRemotes() {
	return {
		syncStart: getRemote("RemoteEvent", "SyncStart") as RemoteEvent<() => void>,
		syncDispatch: getRemote("RemoteEvent", "SyncDispatch") as RemoteEvent<
			(data: SyncData) => void
		>,
		execute: getRemote("RemoteFunction", "Execute") as RemoteFunction<
			(path: string, args: string[]) => CommandContextData
		>,
	};
}
