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

			const [success, data] = this.run(commandPath, executor, args)
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
	 * @param path The path of the command
	 * @param executor The command executor
	 * @param args The command's arguments
	 * @returns A {@link CommandContext} determining the result of execution
	 */
	async run(path: RegistryPath, executor: Player, args: string[] = []) {
		const inputText = getInputText(path, args);
		return this.executeCommand(path, executor, inputText, args).catch((err) => {
			this.handleError(executor, inputText, err);

			const context = new CommandContext(path, args, inputText, executor);
			context.state = this.defaultContextState;
			context.error("An error occurred.");
			return context;
		});
	}

	private handleError(executor: Player, input: string, err: unknown) {
		warn(
			`${executor.Name} tried to run '${input}' but an error occurred: ${err}`,
		);
	}
}
