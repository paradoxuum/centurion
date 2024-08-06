import { ClientConfig } from "./client";
import { CenturionClient } from "./client/core";
import { CenturionServer } from "./server/core";
import { ServerConfig } from "./server/types";

export * from "./client";
export * from "./server";
export * from "./shared";

export namespace Centurion {
	let instance: CenturionClient | CenturionServer | undefined;

	export function client(config: Partial<ClientConfig> = {}) {
		if (instance !== undefined) return instance as CenturionClient;
		instance = new CenturionClient(config);
		return instance;
	}

	export function server(config: Partial<ServerConfig> = {}) {
		if (instance !== undefined) return instance as CenturionServer;
		instance = new CenturionServer(config);
		return instance;
	}
}
