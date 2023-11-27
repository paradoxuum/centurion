import { CommandInteraction, CommandMetadata, CommandOptions, GuardFunction, ImmutableCommandPath } from "../shared";
import { BaseCommand, ExecutableCommand } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { remotes } from "../shared/network";

export class SharedCommand extends ExecutableCommand {
	static create(
		registry: BaseRegistry,
		path: ImmutableCommandPath,
		commandClass: defined,
		data: CommandMetadata,
		guards?: GuardFunction[] | undefined,
	) {
		return new SharedCommand(registry, path, commandClass, data.options, data.func, guards ?? []);
	}

	execute(interaction: CommandInteraction, args: string[]) {
		const runCommand = this.getCommandCallback(args);
		return runCommand(interaction);
	}

	toString() {
		return `SharedCommand{path=${this.path}}`;
	}
}

export class ServerCommand extends BaseCommand {
	static create(registry: BaseRegistry, path: ImmutableCommandPath, options: CommandOptions) {
		return new ServerCommand(registry, path, options);
	}

	execute(interaction: CommandInteraction, args: string[]) {
		const [success, data] = remotes.executeCommand.request(this.path.toString(), args.join(" ")).await();
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
