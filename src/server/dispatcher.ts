import { t } from "@rbxts/t";
import { CommandContext, CommandContextData, RegistryPath } from "../shared";
import { BaseDispatcher } from "../shared/core/dispatcher";
import { getInputText } from "../shared/util/string";
import { ServerOptions } from "./types";

const isStringArray = t.array(t.string);

export class ServerDispatcher extends BaseDispatcher {
	/**
	 * Initialises the server dispatcher.
	 *
	 * This handles any connections to dispatcher remotes. It is
	 * required in order to handle server command execution from clients.
	 */
	init(options: ServerOptions) {
		super.init(options);

		assert(
			options.network !== undefined,
			"Server options must include network options",
		);
		options.network.execute.SetCallback((executor, path, args) => {
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

			const [success, data] = this.run(commandPath, args, executor)
				.timeout(5)
				.await();

			let contextData: CommandContextData;
			if (success) {
				contextData = data.getData();
			} else {
				const inputText = getInputText(commandPath, args);
				this.handleError(inputText, data, executor);
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
	 * @param path The path of the command
	 * @param args The command's arguments
	 * @param executor The command executor, or `undefined` if the executor is the server
	 * @returns A {@link CommandContext} determining the result of execution
	 */
	async run(path: RegistryPath, args: string[] = [], executor?: Player) {
		const inputText = getInputText(path, args);
		return this.executeCommand(path, inputText, args, executor).catch((err) => {
			this.handleError(inputText, err, executor);

			const context = new CommandContext(path, args, inputText, executor);
			context.state = this.defaultContextState;
			context.error("An error occurred.");
			return context;
		});
	}

	private handleError(input: string, err: unknown, executor?: Player) {
		if (executor === undefined) {
			warn(`An error occurred while running '${input}': ${err}`);
		} else {
			warn(
				`${executor.Name} tried to run '${input}' but an error occurred: ${err}`,
			);
		}
	}
}
