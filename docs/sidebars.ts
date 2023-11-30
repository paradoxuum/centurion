import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
	docsSidebar: [
		{
			type: "category",
			label: "Getting Started",
			link: {
				type: "doc",
				id: "getting-started/index",
			},
			items: ["getting-started/installation", "getting-started/examples"],
		},
		{
			type: "category",
			label: "Guides",
			link: {
				type: "doc",
				id: "guides/index",
			},
			items: ["guides/commands", "guides/types", "guides/registration"],
		},
	],
};

export default sidebars;
