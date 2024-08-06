import { CenturionClient } from "@rbxts/centurion";
import { source } from "@rbxts/vide";

const clientState = source<CenturionClient>();

export function useClient(client?: CenturionClient) {
	const value = clientState();
	if (value !== undefined) return value;

	assert(client !== undefined, "No client has been set.");
	clientState(client);
	return client;
}
