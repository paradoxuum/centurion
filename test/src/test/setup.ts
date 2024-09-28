export declare const _G: Map<unknown, unknown>;

for (const [key] of _G) {
	if (typeIs(key, "Instance") && classIs(key, "ModuleScript")) {
		_G.delete(key);
	}
}
