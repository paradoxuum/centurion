import Heading from "@theme/Heading";
import clsx from "clsx";
import styles from "./styles.module.css";

type FeatureItem = {
	title: string;
	Svg: React.ComponentType<React.ComponentProps<"svg">>;
	description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
	{
		title: "Easy to Use",
		Svg: require("@site/static/img/undraw_docusaurus_mountain.svg").default,
		description: (
			<>
				Commander uses <b>decorators</b> to make defining commands easy and readable.
			</>
		),
	},
	{
		title: "Extensible",
		Svg: require("@site/static/img/undraw_docusaurus_tree.svg").default,
		description: (
			<>
				Commander allows for a custom user interface, custom <b>types</b> and more, providing a wide range of
				extensibility for your commands.
			</>
		),
	},
	{
		title: "Powerful",
		Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
		description: (
			<>
				Features like command <b>guards</b> and custom <b>types</b> are provided, allowing for a wide range of
				customization.
			</>
		),
	},
];

function Feature({ title, Svg, description }: FeatureItem) {
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
						<Feature key={idx} {...props} />
					))}
				</div>
			</div>
		</section>
	);
}
