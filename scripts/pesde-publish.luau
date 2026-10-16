--[[
	Publishes the workspace to pesde from a staged copy.

	centurion-ui requires its dependencies as siblings of src (`./centurion`,
	`../vide`), which is where Wally and npm put them. pesde links them into a
	roblox_packages folder inside the package instead, so the staged copy gets
	centurion.luau and vide.luau shims that forward there. They can't live in
	pkgs/centurion-ui: centurion.luau is the roblox-ts shim and vide/ is the
	submodule npm ships.

	Run from the repository root:
	lune run scripts/pesde-publish [--dry-run]
]]

local fs = require("@lune/fs")
local process = require("@lune/process")

-- centurion first: centurion-ui depends on the version it publishes.
local PACKAGES = { "centurion", "centurion-ui" }

local CENTURION_SHIM = [[
local centurion = require("./roblox_packages/centurion")

export type Argument = centurion.Argument
export type Command<T...> = centurion.Command<T...>
export type Response = centurion.Response
export type Result<T = unknown> = centurion.Result<T>
export type Token = centurion.Token

return centurion
]]

local VIDE_SHIM = [[
local vide = require("./roblox_packages/vide")

export type source<T> = vide.source<T>
export type Source<T> = vide.Source<T>
export type context<T> = vide.context<T>
export type Context<T> = vide.Context<T>

return vide
]]

local function run(program: string, args: { string }, cwd: string)
	local result = process.exec(program, args, { cwd = cwd, stdio = "inherit" })
	if not result.ok then
		error(`{program} {table.concat(args, " ")} exited with code {result.code}`, 0)
	end
end

local function stage(root: string, dir: string)
	fs.writeDir(`{dir}/pkgs`)
	fs.copy(`{root}/pesde.toml`, `{dir}/pesde.toml`)
	-- So rokit resolves lune when pesde checks its version.
	fs.copy(`{root}/rokit.toml`, `{dir}/rokit.toml`)

	for _, pkg in PACKAGES do
		local from = `{root}/pkgs/{pkg}`
		local to = `{dir}/pkgs/{pkg}`
		fs.writeDir(to)
		fs.copy(`{from}/src`, `{to}/src`)
		fs.copy(`{from}/pesde.toml`, `{to}/pesde.toml`)
		fs.copy(`{root}/README.md`, `{to}/README.md`)
		fs.copy(`{root}/LICENSE.md`, `{to}/LICENSE.md`)
	end

	local ui = `{dir}/pkgs/centurion-ui`
	fs.removeDir(`{ui}/src/stories`)
	fs.writeFile(`{ui}/centurion.luau`, CENTURION_SHIM)
	fs.writeFile(`{ui}/vide.luau`, VIDE_SHIM)
end

local function publish(dir: string, dry_run: boolean)
	run("pesde", { "install" }, dir)

	local args = { "publish", "-y" }
	if dry_run then
		table.insert(args, "--dry-run")
	end
	for _, pkg in PACKAGES do
		run("pesde", args, `{dir}/pkgs/{pkg}`)
	end
end

local root = string.gsub(process.cwd, "[/\\]$", "")
if not fs.isFile(`{root}/pesde.toml`) or not fs.isDir(`{root}/pkgs/centurion-ui`) then
	print("Run this from the repository root: lune run scripts/pesde-publish")
	process.exit(1)
end

local dry_run = table.find(process.args, "--dry-run") ~= nil
local tmp = string.gsub(process.env.TMPDIR or process.env.TEMP or "/tmp", "[/\\]$", "")
local dir = `{tmp}/centurion-pesde-{os.time()}`

local ok, err = pcall(function()
	stage(root, dir)
	publish(dir, dry_run)
end)

if fs.isDir(dir) then
	fs.removeDir(dir)
end

if not ok then
	print(err)
	process.exit(1)
end
