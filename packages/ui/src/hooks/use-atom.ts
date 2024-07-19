import { Molecule, subscribe } from "@rbxts/charm";
import { cleanup, source } from "@rbxts/vide";

export function useAtom<T>(atom: Molecule<T>) {
	const state = source(atom());
	const disconnect = subscribe(atom, state);

	cleanup(() => {
		disconnect();
	});

	return state;
}
