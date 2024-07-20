import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function getChangedPackages(nightly) {
	const packages = [];

	if (isPackageChanged("packages/core", nightly)) {
		packages.push("packages/core");
	}

	if (isPackageChanged("packages/ui", nightly)) {
		packages.push("packages/ui");
	}

	return packages;
}

function isPackageChanged(directory, nightly) {
	const packagePath = resolve(directory, "package.json");
	if (!existsSync(packagePath)) {
		throw `Could not find package.json at ${packagePath}`;
	}

	const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
	const tag = nightly ? "next" : "latest";
	const latest = execSync(`npm view ${packageJson.name} dist-tags.${tag}`)
		.toString("utf8")
		.trim();

	if (nightly) {
		const hash = latest.split("-").pop();
		const result = execSync(
			`git diff --quiet ${hash} HEAD -- ${directory} || echo changed`,
		)
			.toString("utf8")
			.trim();

		if (result === "changed") return true;
	} else if (
		packageJson.version.localeCompare(latest, undefined, {
			numeric: true,
		}) === 1
	) {
		return true;
	}

	return false;
}

export function getDevVersion(version) {
	const [major, minor, patch] = version
		.split(".")
		.map((num) => Number.parseInt(num));

	const commitHash = getCommitHash();
	return `${major}.${minor}.${patch + 1}-dev-${commitHash.substring(0, 7)}`;
}

function getCommitHash() {
	let commitHash;
	if (
		typeof process.env.GITHUB_SHA === "string" &&
		process.env.GITHUB_SHA !== ""
	) {
		commitHash = process.env.GITHUB_SHA;
	} else {
		commitHash = execSync("git rev-parse HEAD").toString("utf8");
	}
	return commitHash;
}
