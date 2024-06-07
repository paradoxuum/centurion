import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

import starlightUtils from "@lorenzo_lewis/starlight-utils";
import starlightLinksValidator from "starlight-links-validator";

// https://astro.build/config
export default defineConfig({
	site: "https://commander.paradoxum.dev",
	integrations: [
		starlight({
			title: "Commander",
			description: "Flexible command framework for roblox-ts",
			social: {
				github: "https://github.com/paradoxuum/commander",
				discord: "https://discord.roblox-ts.com/",
			},
			logo: {
				dark: "src/assets/logo-dark.svg",
				light: "src/assets/logo-light.svg",
			},
			sidebar: [
				{
					label: "Guides",
					collapsed: true,
					items: [
						{
							label: "Quick Start",
							items: [
								{
									label: "Getting Started",
									link: "/guides",
								},
								{
									label: "Examples",
									link: "/guides/examples",
								},
							],
						},
						{
							label: "Commands",
							autogenerate: {
								directory: "/guides/commands",
							},
						},
						{
							label: "Types",
							autogenerate: {
								directory: "/guides/types",
							},
						},
						{
							label: "Registration",
							autogenerate: {
								directory: "/guides/registration",
							},
						},
					],
				},
				{
					label: "Reference",
					collapsed: true,
					autogenerate: {
						directory: "/reference",
					},
				},
				{
					label: "leading",
					items: [
						{ label: "Guides", link: "/guides" },
						{
							label: "Reference",
							link: "/reference/decorators",
						},
					],
				},
			],
			customCss: ["./src/custom.scss"],
			plugins: [
				starlightLinksValidator({
					errorOnRelativeLinks: false,
				}),
				starlightUtils({
					multiSidebar: {
						switcherStyle: "horizontalList",
					},
					navLinks: {
						leading: {
							useSidebarLabelled: "leading",
						},
					},
				}),
			],
		}),
	],
});
