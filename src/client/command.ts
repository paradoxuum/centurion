import {
	CommandContext,
	CommandOptions,
	ImmutableRegistryPath,
} from "../shared";
import { BaseCommand } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { ClientRemotes } from "./types";

export class ServerCommand extends BaseCommand {
	static create(
		registry: BaseRegistry,
		path: ImmutableRegistryPath,
		options: CommandOptions,
		executeRemote: ClientRemotes.Execute,
	) {
		return new ServerCommand(registry, path, options, executeRemote);
	}

	constructor(
		registry: BaseRegistry,
		path: ImmutableRegistryPath,
		options: CommandOptions,
		private readonly executeRemote: ClientRemotes.Execute,
	) {
		super(registry, path, options);
	}

	execute(context: CommandContext, args: string[]) {
		const [success, data] = pcall(() =>
			this.executeRemote.Invoke(this.path.toString(), args),
		);

		if (!success) {
			context.error("An error occurred.");
			return;
		}

		if (data?.reply !== undefined) context.setReply(data.reply);
	}

	toString() {
		return `ServerCommand{path=${this.path}}`;
	}
}
