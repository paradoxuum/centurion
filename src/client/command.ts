import { CommandInteraction, CommandMetadata, CommandOptions, GuardFunction, ImmutableCommandPath } from "../shared";
import { BaseCommand, ExecutableCommand } from "../shared/core/command";
import { BaseRegistry } from "../shared/core/registry";
import { remotes } from "../shared/network";

export class SharedCommand extends ExecutableCommand {
	static create(
		registry: BaseRegistry,
		path: ImmutableCommandPath,
		data: CommandMetadata,
		guards?: GuardFunction[] | undefined,
	) {
		return new SharedCommand(registry, path, data.options, data.func, guards ?? []);
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

	execute(_: CommandInteraction, args: string[]) {
		remotes.executeCommand.fire(this.path.toString(), args.join(" "));
	}

	toString() {
		return `ServerCommand{path=${this.path}}`;
	}
}
