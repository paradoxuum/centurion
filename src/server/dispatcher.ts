import { t } from "@rbxts/t";
import { CommandContext, CommandContextData, RegistryPath } from "../shared";
import { BaseDispatcher } from "../shared/core/dispatcher";
import { Remotes } from "../shared/network";

export class ServerDispatcher extends BaseDispatcher {
	/**
	 * Initialises the server dispatcher.
	 *
	 * This handles any connections to dispatcher remotes. It is
	 * required in order to handle server command execution from clients.
	 */
	init() {
		Remotes.Execute.OnServerInvoke = (player, path, text) => {
			if (!t.string(path) || !t.string(text)) return;

			const commandPath = RegistryPath.fromString(path);

			const [success, data] = this.run(commandPath, player, text)
				.timeout(5)
				.await();

			let contextData: CommandContextData;
			if (success) {
				contextData = data.getData();
			} else {
				this.handleError(player, text, data);
				contextData = {
					executor: player,
					text,
					reply: {
						success: false,
						text: "An error occurred.",
						sentAt: os.time(),
					},
				};
			}

			return contextData;
		};
	}

	/**
	 * Executes a command.
	 *
	 * @param path The path of the command
	 * @param executor The command executor
	 * @param text The text input used to execute the command
	 * @returns A {@link CommandContext} determining the result of execution
	 */
	async run(path: RegistryPath, executor: Player, text = "") {
		return this.executeCommand(path, executor, text).catch((err) => {
			this.handleError(executor, text, err);

			const context = new CommandContext(path, text, executor);
			context.error("An error occurred.");
			return context;
		});
	}

	private handleError(executor: Player, text: string, err: unknown) {
		warn(
			`${executor.Name} tried to run '${text}' but an error occurred: ${err}`,
		);
	}
}
