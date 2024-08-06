import { Centurion } from "@rbxts/centurion";

const server = Centurion.server();

assert(script.Parent !== undefined);
server.registry.load(script.Parent.WaitForChild("commands"));
server.start();
