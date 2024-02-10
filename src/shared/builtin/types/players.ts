import { Players } from "@rbxts/services";
import { t } from "@rbxts/t";
import { CommanderType } from ".";
import { BaseRegistry } from "../../core/registry";
import { TransformationResult } from "../../types";
import { TransformResult, TypeBuilder } from "../../util/type";

const getPlayer = (
	text: string,
	executor: Player,
): TransformationResult<Player> => {
	if (text === "@me" || text === ".") {
		return TransformResult.ok(executor);
	}

	if (text === "@random" || text === "?") {
		const players = Players.GetPlayers();
		return TransformResult.ok(players[math.random(0, players.size() - 1)]);
	}

	for (const player of Players.GetPlayers()) {
		if (player.Name.lower() === text.lower()) {
			return TransformResult.ok(player);
		}
	}

	return TransformResult.err("Player not found");
};

const getPlayerSuggestions = () => [
	"@me",
	"@random",
	...Players.GetPlayers().map((player) => player.Name),
];

const isPlayer = t.instanceOf("Player");
const playerType = TypeBuilder.create<Player>(CommanderType.Player)
	.validate(isPlayer)
	.transform(getPlayer)
	.suggestions(getPlayerSuggestions)
	.build();

const playersType = TypeBuilder.create(CommanderType.Players)
	.validate(t.array(isPlayer))
	.transform((text, executor) => {
		let players: Player[] = [];
		for (const [part] of text.gmatch("[@%w%.%*]+")) {
			const textPart = part as string;

			if (textPart === "@all" || textPart === "*") {
				players = Players.GetPlayers();
				break;
			}

			if (textPart === "@others" || textPart === "**") {
				players = Players.GetPlayers().filter((player) => player !== executor);
				break;
			}

			const playerResult = getPlayer(textPart, executor);
			if (playerResult.isErr()) {
				return TransformResult.err(`Player not found: ${textPart}`);
			}
			players.push(playerResult.unwrap());
		}

		return TransformResult.ok(players);
	})
	.suggestions(() => {
		const playerNames = getPlayerSuggestions();
		playerNames.push("@all", "@others");
		return playerNames;
	})
	.build();

export = (registry: BaseRegistry) => {
	registry.registerTypes(playerType, playersType);
};
