import { execSync } from "node:child_process";
import * as fs from "node:fs";
import { resolve } from "node:path";

if (process.argv.length === 2) {
	console.error("Expected one argument (directory)");
	process.exit(1);
}

const packagePath = resolve(process.argv[2], "package.json");
if (!fs.existsSync(packagePath)) {
	console.error(`Could not find package.json at ${packagePath}`);
	process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

const nightly = process.argv.length === 4 && process.argv[3] === "true";
const tag = nightly ? "next" : "latest";
const latest = execSync(`npm view ${packageJson.name} dist-tags.${tag}`)
	.toString("utf8")
	.trim();

let changed = false;
if (nightly) {
	const hash = latest.split("-").pop();
	const result = execSync(
		`git diff --quiet ${hash} HEAD -- ${process.argv[2]} || echo changed`,
	)
		.toString("utf8")
		.trim();
	changed = result === "changed";
} else if (
	packageJson.version.localeCompare(latest, undefined, { numeric: true }) === 1
) {
	changed = true;
}

console.log(changed);
