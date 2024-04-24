import { expect, test } from "@rbxts/jest-globals";
import { CommandInteraction } from "../core/interaction";
import { RegistryPath } from "../core/path";
import { CommandInteractionData, CommandReply } from "../types";

const createInteraction = () =>
	new CommandInteraction(RegistryPath.fromString("test"), "test");

test("interactions can be replied to", () => {
	const interaction = createInteraction();
	const text = "test";
	interaction.reply(text);
	expect(interaction.getReply()?.text).toBe(text);
	expect(interaction.getReply()?.success).toBeTruthy();
	expect(interaction.isReplyReceived()).toBeTruthy();
	expect(() => interaction.reply(text)).toThrowError();
});

test("interactions can receive errors", () => {
	const interaction = createInteraction();
	const text = "test";
	interaction.error(text);
	expect(interaction.getReply()?.text).toBe(text);
	expect(interaction.getReply()?.success).toBeFalsy();
	expect(interaction.isReplyReceived()).toBeTruthy();
	expect(() => interaction.error(text)).toThrowError();
});

test("interaction data can be retrieved", () => {
	const interaction = createInteraction();
	const data = interaction.getData();
	expect(data).toEqual<CommandInteractionData>({
		text: "test",
	});

	const text = "test";
	interaction.reply(text);
	expect(interaction.getData().reply).toEqual(interaction.getReply());
});

test("interactions can be replied to using reply data", () => {
	const interaction = createInteraction();

	const data: CommandReply = {
		success: true,
		sentAt: os.time(),
		text: "test reply",
	};
	interaction.setReply(data);

	const reply = interaction.getReply();
	expect(reply?.success).toBe(data.success);
	expect(reply?.sentAt).toBe(data.sentAt);
	expect(reply?.text).toBe(data.text);
	expect(() => interaction.setReply(data)).toThrowError();
});
