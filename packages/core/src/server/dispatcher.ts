import { t } from "@rbxts/t";
import { CommandContext, CommandContextData, RegistryPath } from "../shared";
import { BaseDispatcher } from "../shared/core/dispatcher";
import { ReadonlyDeep } from "../shared/util/data";
import { getInputText } from "../shared/util/string";
import { ServerRegistry } from "./registry";
import { ServerConfig } from "./types";

const isStringArray = t.array(t.string);

export class ServerDispatcher extends BaseDispatcher<
	ReadonlyDeep<ServerConfig>,
	ServerRegistry
> {
	/**
	 * Initializes the server dispatcher.
	 *
	 * This handles any connections to dispatcher remotes. It is
	 * required in order to handle server command execution from clients.
	 *
	 * @param options Server options
	 * @ignore
	 */
	init() {
		this.config.network.execute.SetCallback((executor, path, args) => {
			if (!t.string(path) || !isStringArray(args)) {
				return {
					args: [],
					input: "",
					executor,
					reply: {
						success: false,
						text: "Invalid input.",
						sentAt: os.time(),
					},
				} satisfies CommandContextData;
			}

			const commandPath = RegistryPath.fromString(path);

			const [success, data] = this.run(executor, commandPath, args)
				.timeout(5)
				.await();

			let contextData: CommandContextData;
			if (success) {
				contextData = data.getData();
			} else {
				const inputText = getInputText(commandPath, args);
				this.handleError(executor, inputText, data);
				contextData = {
					args,
					input: inputText,
					executor,
					reply: {
						success: false,
						text: "An error occurred.",
						sentAt: os.time(),
					},
				};
			}

			return contextData;
		});
	}

	/**
	 * Executes a command.
	 *
	 * @param path The command's path.
	 * @param args The arguments to pass to the command.
	 * @param executor The command's executor, or `undefined` if the executor is the server.
	 * @returns A {@link Promise} that resolves when the command has been executed. The value contained in the
	 * Promise is a {@link CommandContext} instance containing the execution result.
	 */
	async run(executor: Player, path: RegistryPath, args: string[] = []) {
		const inputText = getInputText(path, args);
		if (!this.registry.isCommandSynced(executor, path)) {
			const context = new CommandContext(
				this.logger,
				executor,
				path,
				args,
				inputText,
			);
			context.error("Command not found.");
			return context;
		}

		return this.executeCommand(executor, path, inputText, args).catch((err) => {
			this.handleError(executor, inputText, err);

			const context = new CommandContext(
				this.logger,
				executor,
				path,
				args,
				inputText,
			);
			context.state = this.config.defaultContextState;
			context.error("An error occurred.");
			return context;
		});
	}

	private handleError(executor: Player, input: string, err: unknown) {
		this.logger.warn(
			`Failed to execute '${input}' with executor '${executor.Name}': ${err}`,
		);
	}
}
