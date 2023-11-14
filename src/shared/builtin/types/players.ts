import { Players } from "@rbxts/services";
import { t } from "@rbxts/t";
import { BuiltInTypes } from ".";
import { BaseRegistry } from "../../core/registry";
import { TransformationResult } from "../../types";
import { TypeBuilder, transformErr, transformOk } from "../../util/type";

const getPlayer = (text: string): TransformationResult<Player> => {
	const player = Players.FindFirstChild(text);
	if (player === undefined || !classIs(player, "Player")) {
		return transformErr("Player not found");
	}
	return transformOk(player);
};

const isPlayer = t.instanceOf("Player");
const playerType = TypeBuilder.create<Player>(BuiltInTypes.Player)
	.validate(isPlayer)
	.transform(getPlayer)
	.suggestions(() => Players.GetPlayers().map((player) => player.Name))
	.build();

const playersType = TypeBuilder.create(BuiltInTypes.Players)
	.validate(t.array(isPlayer))
	.transform((text) => {
		const textLower = text.lower();
		if (textLower === "*") {
			return transformOk(Players.GetPlayers());
		}

		return getPlayer(text).map((player) => [player]);
	})
	.suggestions(() => {
		const playerNames = Players.GetPlayers().map((player) => player.Name);
		playerNames.insert(0, "*");
		return playerNames;
	})
	.build();

export = (registry: BaseRegistry) => {
	registry.registerTypes(playerType, playersType);
};
