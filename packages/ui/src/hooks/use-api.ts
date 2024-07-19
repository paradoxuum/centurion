import { ClientAPI } from "@rbxts/centurion";
import { source } from "@rbxts/vide";

const api = source<ClientAPI>();

export function getAPI() {
	const value = api();
	assert(value !== undefined, "Client API has not been set");
	return value;
}

export function useAPI(clientAPI: ClientAPI) {
	api(clientAPI);
	return api;
}
