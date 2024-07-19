import * as fs from "node:fs";
import { resolve } from "node:path";
import { getDevVersion } from "./util.mjs";

if (process.argv.length === 2) {
	console.error("Expected one argument (directory)");
	process.exit(1);
}

const packagePath = resolve(process.argv[2], "package.json");
if (!fs.existsSync(packagePath)) {
	console.error(`Could not find package.json at ${packagePath}`);
	process.exit(1);
}

const nightly = process.argv.length === 4 && process.argv[3] === "true";
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
console.log(nightly ? getDevVersion(packageJson.version) : packageJson.version);
