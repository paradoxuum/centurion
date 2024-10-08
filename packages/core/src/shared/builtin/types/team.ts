import { Teams } from "@rbxts/services";
import { CenturionType } from ".";
import { BaseRegistry, TransformResult, TypeBuilder } from "../../core";

const teamType = TypeBuilder.create<Team>(CenturionType.Team)
	.transform((text) => {
		const team = Teams.FindFirstChild(text);
		if (team === undefined || !classIs(team, "Team")) {
			return TransformResult.err(`Team not found: ${text}`);
		}
		return TransformResult.ok(team);
	})
	.suggestions(() => Teams.GetChildren().map((team) => team.Name))
	.build();

export = (registry: BaseRegistry) => {
	registry.registerType(teamType);
};
