import {
	CommandContext,
	CommandOptions,
	ImmutableRegistryPath,
} from "../shared";
import { BaseCommand } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { Remotes } from "../shared/network";

export class ServerCommand extends BaseCommand {
	static create(
		registry: BaseRegistry,
		path: ImmutableRegistryPath,
		options: CommandOptions,
	) {
		return new ServerCommand(registry, path, options);
	}

	execute(context: CommandContext, text: string) {
		const [success, data] = pcall(() =>
			Remotes.Execute.InvokeServer(this.path.toString(), text),
		);

		if (!success) {
			context.error("An error occurred.");
			return;
		}

		if (data.reply !== undefined) context.setReply(data.reply);
	}

	toString() {
		return `ServerCommand{path=${this.path}}`;
	}
}
