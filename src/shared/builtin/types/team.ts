import { Teams } from "@rbxts/services";
import { t } from "@rbxts/t";
import { CommanderType } from ".";
import { TransformResult, TypeBuilder } from "../../util/type";

export const TeamType = TypeBuilder.create<Team>(CommanderType.Team)
	.validate(t.instanceOf("Team"))
	.transform((text) => {
		const team = Teams.FindFirstChild(text);
		if (team === undefined || !classIs(team, "Team")) {
			return TransformResult.err("Team not found");
		}
		return TransformResult.ok(team);
	})
	.suggestions(() => Teams.GetChildren().map((team) => team.Name))
	.build();
