export const BuiltInTypes = {
	String: "string",
	Number: "number",
	Integer: "integer",
	Boolean: "boolean",
	Player: "player",
	Players: "players",
};

export type BuiltInType = keyof typeof BuiltInTypes;
