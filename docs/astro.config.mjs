import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	site: "https://paradoxuum.github.io",
	base: "/commander",
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
					label: "Quick Start",
					items: [
						{
							label: "Getting Started",
							link: "getting-started",
						},
						{
							label: "Examples",
							link: "examples",
						},
					],
				},
				{
					label: "Commands",
					autogenerate: {
						directory: "commands",
					},
				},
				{
					label: "Types",
					autogenerate: {
						directory: "types",
					},
				},
				{
					label: "Registration",
					autogenerate: {
						directory: "registration",
					},
				},
			],
			customCss: ["./src/tailwind.css", "./src/custom.css"],
		}),
		tailwind({
			applyBaseStyles: false,
		}),
	],
});
