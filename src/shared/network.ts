import { RunService } from "@rbxts/services";
import { CommandInteractionData, CommandOptions, GroupOptions } from "./types";

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
	groups: GroupOptions[];
}

export namespace Remotes {
	export const SyncStart: RemoteEvent<() => void> = getRemote(
		"RemoteEvent",
		"SyncStart",
	);
	export const SyncDispatch: RemoteEvent<(data: SyncData) => void> = getRemote(
		"RemoteEvent",
		"SyncDispatch",
	);

	export const Execute: RemoteFunction<
		(path: string, text: string) => CommandInteractionData
	> = getRemote("RemoteFunction", "Execute");
}
