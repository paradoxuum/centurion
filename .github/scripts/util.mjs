import { execSync } from "node:child_process";

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
