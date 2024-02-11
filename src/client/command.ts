import {
	CommandGuard,
	CommandInteraction,
	CommandMetadata,
	CommandOptions,
	ImmutableCommandPath,
} from "../shared";
import { BaseCommand, ExecutableCommand } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { Remotes } from "../shared/network";

export class SharedCommand extends ExecutableCommand {
	static create(
		registry: BaseRegistry,
		path: ImmutableCommandPath,
		commandClass: defined,
		data: CommandMetadata,
		guards?: CommandGuard[] | undefined,
	) {
		return new SharedCommand(
			registry,
			path,
			commandClass,
			data.options,
			data.func,
			guards ?? [],
		);
	}

	toString() {
		return `SharedCommand{path=${this.path}}`;
	}
}

export class ServerCommand extends BaseCommand {
	static create(
		registry: BaseRegistry,
		path: ImmutableCommandPath,
		options: CommandOptions,
	) {
		return new ServerCommand(registry, path, options);
	}

	execute(interaction: CommandInteraction, text: string) {
		const [success, data] = pcall(() =>
			Remotes.Execute.InvokeServer(this.path.toString(), text),
		);

		if (!success) {
			interaction.error("An error occurred.");
			return;
		}

		interaction.replyFromData(data);
	}

	toString() {
		return `ServerCommand{path=${this.path}}`;
	}
}
