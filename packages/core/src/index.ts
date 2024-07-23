import { ClientOptions } from "./client";
import { CenturionClient } from "./client/core";
import { CenturionServer } from "./server/core";
import { ServerOptions } from "./server/types";

export * from "./client";
export * from "./server";
export * from "./shared";

export namespace Centurion {
	let instance: CenturionClient | CenturionServer | undefined;

	export function client(options: Partial<ClientOptions> = {}) {
		if (instance !== undefined) {
			return instance as CenturionClient;
		}
		instance = new CenturionClient(options);
		return instance;
	}

	export function server(options: Partial<ServerOptions> = {}) {
		if (instance !== undefined) {
			return instance as CenturionServer;
		}
		instance = new CenturionServer(options);
		return instance;
	}
}
