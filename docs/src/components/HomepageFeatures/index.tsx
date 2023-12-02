import { useColorMode } from "@docusaurus/theme-common";
import Heading from "@theme/Heading";
import clsx from "clsx";
import styles from "./styles.module.css";

type FeatureItem = {
	title: string;
	SvgDark: React.ComponentType<React.ComponentProps<"svg">>;
	SvgLight: React.ComponentType<React.ComponentProps<"svg">>;
	description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
	{
		title: "Easy to Use",
		SvgDark: require("@site/static/img/hero_rocket_dark.svg").default,
		SvgLight: require("@site/static/img/hero_rocket_light.svg").default,
		description: (
			<>
				Commander uses <b>decorators</b> to make defining commands easy and
				readable.
			</>
		),
	},
	{
		title: "Extensible",
		SvgDark: require("@site/static/img/hero_arrow_dark.svg").default,
		SvgLight: require("@site/static/img/hero_arrow_light.svg").default,
		description: (
			<>
				Commander allows for a custom user interface, custom <b>types</b> and
				more.
			</>
		),
	},
	{
		title: "Powerful",
		SvgDark: require("@site/static/img/hero_bolt_dark.svg").default,
		SvgLight: require("@site/static/img/hero_bolt_light.svg").default,
		description: (
			<>
				Features like command <b>guards</b> and custom <b>types</b> are
				provided, allowing for a wide range of customization.
			</>
		),
	},
];

function Feature({ title, SvgDark, SvgLight, description }: FeatureItem) {
	const { colorMode } = useColorMode();

	const Svg = colorMode === "dark" ? SvgDark : SvgLight;

	return (
		<div className={clsx("col col--4")}>
			<div className="text--center">
				<Svg className={styles.featureSvg} role="img" />
			</div>
			<div className="text--center padding-horiz--md">
				<Heading as="h3">{title}</Heading>
				<p>{description}</p>
			</div>
		</div>
	);
}

export default function HomepageFeatures(): JSX.Element {
	return (
		<section className={styles.features}>
			<div className="container">
				<div className="row">
					{FeatureList.map((props, idx) => (
						<Feature key={`${props.title}-${idx}`} {...props} />
					))}
				</div>
			</div>
		</section>
	);
}
