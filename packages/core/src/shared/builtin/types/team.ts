import { Teams } from "@rbxts/services";
import { t } from "@rbxts/t";
import { CenturionType } from ".";
import { BaseRegistry } from "../../core/registry";
import { TransformResult, TypeBuilder } from "../../util/type";

const teamType = TypeBuilder.create<Team>(CenturionType.Team)
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

export = (registry: BaseRegistry) => {
	registry.registerType(teamType);
};
