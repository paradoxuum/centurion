const admins = new Set<Player>();

export function addAdmin(player: Player) {
	admins.add(player);
}

export function removeAdmin(player: Player) {
	admins.delete(player);
}

export function isAdmin(player: Player) {
	return admins.has(player);
}
