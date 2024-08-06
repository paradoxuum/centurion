import { Players } from "@rbxts/services";
import { t } from "@rbxts/t";
import { CenturionType } from ".";
import {
	BaseRegistry,
	ListTypeBuilder,
	TransformResult,
	TypeBuilder,
} from "../../core";

const getPlayer = (
	text: string,
	executor: Player,
): TransformResult.Object<Player> => {
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

	return TransformResult.err(`Player not found: ${text}`);
};

const getPlayerSuggestions = () => [
	"@me",
	"@random",
	...Players.GetPlayers().map((player) => player.Name),
];

const isPlayer = t.instanceOf("Player");
const playerType = TypeBuilder.create<Player>(CenturionType.Player)
	.validate(isPlayer)
	.transform(getPlayer)
	.suggestions(getPlayerSuggestions)
	.build();

const playersType = ListTypeBuilder.create<Player[]>(CenturionType.Players)
	.validate(t.array(isPlayer))
	.transform((input, executor) => {
		const includedPlayers = new Set<Player>();
		let players: Player[] = [];

		for (const text of input) {
			if (text === "@all" || text === "*") {
				players = Players.GetPlayers();
				break;
			}

			if (text === "@others" || text === "**") {
				players = Players.GetPlayers().filter((player) => player !== executor);
				break;
			}

			const playerResult = getPlayer(text, executor);
			if (!playerResult.ok) {
				return TransformResult.err(`Player not found: ${text}`);
			}

			if (includedPlayers.has(playerResult.value)) continue;
			includedPlayers.add(playerResult.value);
			players.push(playerResult.value);
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
	registry.registerType(playerType, playersType);
};
