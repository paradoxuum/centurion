import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getChangedPackages, getDevVersion } from "./util.mjs";

const nightly = process.argv.length > 2 && process.argv[2] === "true";
const tag = nightly ? "next" : "latest";
for (const pkg of getChangedPackages(nightly)) {
	const packagePath = resolve(pkg, "package.json");
	if (!existsSync(packagePath)) {
		console.error(`Could not find package.json at ${packagePath}`);
		process.exit(1);
	}

	const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
	const pkgName = packageJson.name;

	if (nightly) {
		const version = getDevVersion(packageJson.version);
		execSync(`yarn workspace ${pkgName} version ${version}`);
		console.log(`Set ${pkgName} version to ${version}`);
	}

	execSync(`yarn workspace ${pkgName} npm publish --tag ${tag}`);
	console.log(`Published ${pkgName}@${tag} to npm`);
}
