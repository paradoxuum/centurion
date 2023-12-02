import {
	CommandInteraction,
	CommandInteractionData,
	CommandPath,
} from "../shared";
import { BaseDispatcher } from "../shared/core/dispatcher";
import { remotes } from "../shared/network";

export class ServerDispatcher extends BaseDispatcher {
	/**
	 * Initialises the server dispatcher.
	 *
	 * This handles any connections to dispatcher remotes. It is
	 * required in order to handle server command execution from clients.
	 */
	init() {
		remotes.executeCommand.onRequest(async (player, path, text) => {
			const commandPath = CommandPath.fromString(path);

			let interactionData: CommandInteractionData;
			try {
				const interaction = await this.run(commandPath, player, text);
				interactionData = interaction.getData();
			} catch (err) {
				this.handleError(player, text, err);
				interactionData = {
					executor: player,
					text,
					reply: {
						success: false,
						text: "An error occurred.",
						sentAt: os.time(),
					},
				};
			}
			return interactionData;
		});
	}

	/**
	 * Executes a command.
	 *
	 * @param path the path of the command
	 * @param executor the command executor
	 * @param text the text input used to execute the command
	 * @returns a {@link CommandInteraction} determining the result of execution
	 */
	async run(path: CommandPath, executor: Player, text = "") {
		return this.executeCommand(path, executor, text).catch((err) => {
			this.handleError(executor, text, err);

			const interaction = new CommandInteraction(executor, text);
			interaction.error("An error occurred.");
			return interaction;
		});
	}

	private handleError(executor: Player, text: string, err: unknown) {
		warn(
			`${executor.Name} tried to run '${text}' but an error occurred: ${err}`,
		);
	}
}
