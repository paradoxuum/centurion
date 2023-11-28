import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
	title: "Commander",
	tagline: "A flexible and extensible command framework for roblox-ts.",
	favicon: "img/favicon.ico",

	// Set the production url of your site here
	url: "https://paradoxuum.github.io",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/commander/",

	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "paradoxuum", // Usually your GitHub org/user name.
	projectName: "commander", // Usually your repo name.

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.ts",
				},
				theme: {
					customCss: "./src/css/custom.css",
				},
			} satisfies Preset.Options,
		],
	],

	themeConfig: {
		// Replace with your project's social card
		image: "img/docusaurus-social-card.jpg",
		navbar: {
			title: "Commander",
			logo: {
				alt: "Commander Logo",
				src: "img/logo.svg",
			},
			items: [
				{
					type: "docSidebar",
					sidebarId: "docsSidebar",
					position: "left",
					label: "Docs",
				},
				{
					href: "https://github.com/paradoxuum/commander",
					position: "right",
					className: "header-github-link",
					title: "GitHub repository",
					"aria-label": "GitHub repository",
				},
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Docs",
					items: [
						{
							label: "Getting Started",
							to: "/docs",
						},
					],
				},
				{
					title: "Community",
					items: [
						{
							label: "Roblox-TS",
							href: "https://discord.roblox-ts.com/",
						},
					],
				},
				{
					title: "More",
					items: [
						{
							label: "GitHub",
							href: "https://github.com/paradoxuum/commander",
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()}. Built with Docusaurus.`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
			magicComments: [
				{
					className: "theme-code-block-highlighted-line",
					line: "highlight-next-line",
					block: { start: "highlight-start", end: "highlight-end" },
				},
				{
					className: "code-block-error-line",
					line: "error-next-line",
				},
			],
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
