import { t } from "@rbxts/t";

function getImportFunction(): (module: ModuleScript) => unknown {
	const tsImpl = (_G as Map<unknown, unknown>).get(script);
	const isRuntimeLib = t.interface({
		import: t.callback,
	});

	if (!isRuntimeLib(tsImpl)) {
		return require;
	}
	return (module) => tsImpl.import(script, module);
}

const importWrapper = getImportFunction();

/**
 * Imports a module, handling errors and returning the value if successful.
 *
 * If RuntimeLib is present, it will use its `import` function,
 * otherwise it will fallback to `require`.
 *
 * @param module The {@link ModuleScript} to import
 * @returns
 */
export function importModule(module: ModuleScript) {
	const [success, value] = pcall(() => importWrapper(module));
	if (!success) {
		warn(`Failed to import ${module.GetFullName()}: ${value}`);
		return;
	}
	return value;
}
