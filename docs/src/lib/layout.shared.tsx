import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, gitConfig } from "./shared";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<span className="flex items-center gap-2">
					<img src="/logo.svg" alt="Centurion logo" className="h-5 w-auto dark:invert-0 invert" />
					<span className="font-semibold">{appName}</span>
				</span>
			),
		},
		githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
		themeSwitch: {
			mode: "light-dark-system",
		},
	};
}
