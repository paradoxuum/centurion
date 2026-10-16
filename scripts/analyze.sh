#!/usr/bin/env sh
# type checks the packages and test place with luau-lsp. the codebase relies on
# the new type solver (e.g. `read` properties), so it has to be enabled here.
# unit tests aren't included: they run outside roblox under the luau CLI
set -eu

version=$(luau-lsp --version)
defs=".luau-lsp/globalTypes-$version.d.luau"

if [ ! -f "$defs" ]; then
	mkdir -p .luau-lsp
	curl -sfL -o "$defs" "https://raw.githubusercontent.com/JohnnyMorganz/luau-lsp/$version/scripts/globalTypes.None.d.luau"
fi

rojo sourcemap default.project.json -o sourcemap.json

luau-lsp analyze \
	--platform=roblox \
	--flag:LuauSolverV2=true \
	--definitions=@roblox="$defs" \
	--sourcemap=sourcemap.json \
	--ignore="**/vide/**" \
	pkgs/centurion/src pkgs/centurion-ui/src test/server test/client
