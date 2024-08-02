import { expect, test } from "@rbxts/jest-globals";
import { Players } from "@rbxts/services";
import { CommandContext } from "../core/context";
import { RegistryPath } from "../core/path";
import { CommandContextData, CommandReply } from "../types";
import { CenturionLogLevel, CenturionLogger } from "../util/log";
import { getInputText } from "../util/string";

const createContext = (args: string[] = []) => {
	const path = RegistryPath.fromString("test");
	const logger = new CenturionLogger(CenturionLogLevel.Debug);
	return new CommandContext(
		logger,
		Players.LocalPlayer,
		path,
		args,
		getInputText(path, args),
	);
};

test("contexts can be replied to", () => {
	const ctx = createContext();
	const text = "test";
	ctx.reply(text);
	expect(ctx.getReply()?.text).toBe(text);
	expect(ctx.getReply()?.success).toBeTruthy();
	expect(ctx.isReplyReceived()).toBeTruthy();
	expect(() => ctx.reply(text)).toThrowError();
});

test("contexts can receive errors", () => {
	const ctx = createContext();
	const text = "test";
	ctx.error(text);
	expect(ctx.getReply()?.text).toBe(text);
	expect(ctx.getReply()?.success).toBeFalsy();
	expect(ctx.isReplyReceived()).toBeTruthy();
	expect(() => ctx.error(text)).toThrowError();
});

test("context data can be retrieved", () => {
	const ctx = createContext(["arg1", "arg2_1 arg2_2"]);
	const data = ctx.getData();
	expect(data).toEqual<CommandContextData>({
		args: ["arg1", "arg2_1 arg2_2"],
		input: 'test arg1 "arg2_1 arg2_2"',
	});

	const text = "test";
	ctx.reply(text);
	expect(ctx.getData().reply).toEqual(ctx.getReply());
});

test("contexts can be replied to using reply data", () => {
	const ctx = createContext();

	const data: CommandReply = {
		success: true,
		sentAt: os.time(),
		text: "test reply",
	};
	ctx.setReply(data);

	const reply = ctx.getReply();
	expect(reply?.success).toBe(data.success);
	expect(reply?.sentAt).toBe(data.sentAt);
	expect(reply?.text).toBe(data.text);
	expect(() => ctx.setReply(data)).toThrowError();
});
