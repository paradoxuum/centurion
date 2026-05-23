import { createFileRoute, Link } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";
import { Dithering, GrainGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { NavbarMenu, NavbarMenuTrigger } from "fumadocs-ui/layouts/home/navbar";
import { useTheme } from "next-themes";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	const [showShaders, setShowShaders] = useState(false);

	useEffect(() => {
		// apply some delay, otherwise on slower devices, it errors with uniform images not being fully loaded.
		setTimeout(() => {
			setShowShaders(true);
		}, 400);
	}, []);

	return (
		<HomeLayout
			{...baseOptions()}
			links={[
				{
					type: "custom",
					on: "nav",
					children: (
						<NavbarMenu>
							<NavbarMenuTrigger>
								<Link to="/docs/$">Documentation</Link>
							</NavbarMenuTrigger>
						</NavbarMenu>
					),
				},
			]}
		>
			<main className="flex flex-col">
				<Hero showShaders={showShaders} />
				<Features showShaders={showShaders} />
				<CodePreview showShaders={showShaders} />
			</main>
		</HomeLayout>
	);
}

function Hero({ showShaders }: { showShaders: boolean }) {
	const { resolvedTheme } = useTheme();

	return (
		<section className="relative flex flex-col items-center justify-center min-h-[70vh] overflow-hidden px-6 text-center">
			{/* Background dithering shader */}
			{/*<div className="absolute inset-0 -z-10">*/}
			{/*<Dithering
					// colorBack="oklch(0.145 0 0)"
					// colorFront="oklch(0.25 0.02 280)"
					shape="warp"
					type="8x8"
					size={2}
					speed={0.2}
					style={{ width: "100%", height: "100%" }}
				/>*/}
			{/*</div>*/}

			{showShaders && (
				<GrainGradient
					className="absolute inset-0 animate-fd-fade-in duration-800"
					colors={
						resolvedTheme === "dark"
							? ["#39BE1C", "#9c2f05", "#7A2A0000"]
							: ["#fcfc51", "#ffa057", "#7A2A0020"]
					}
					colorBack="#00000000"
					softness={1}
					intensity={0.9}
					noise={0.5}
					speed={1}
					shape="corners"
					minPixelRatio={1}
					maxPixelCount={1920 * 1080}
				/>
			)}

			{/* Subtle radial vignette */}
			{/*<div
				className="absolute inset-0 -z-10"
				style={{
					background:
						"radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, oklch(0.145 0 0 / 0.7) 100%)",
				}}
			/>*/}

			<div className="relative max-w-3xl mx-auto flex flex-col items-center gap-6">
				<img
					src="/logo.svg"
					alt="Centurion"
					className="h-70 w-auto drop-shadow-fd-foreground animate-fd-fade-in duration-800 dark:invert-0 invert"
				/>

				<AnimatedTitle />

				<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-fd-border bg-fd-card/60 text-xs text-fd-muted-foreground backdrop-blur-sm font-mono">
					<span className="size-1.5 rounded-full bg-green-400 inline-block" />
					v2.0
				</div>

				<div className="flex flex-wrap items-center justify-center gap-3 mt-2">
					<Link
						to="/docs/$"
						params={{ _splat: "" }}
						className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
					>
						Get Started
						<ArrowRight className="size-3.5" />
					</Link>
					<a
						href="https://github.com/paradoxuum/centurion"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-fd-border bg-fd-card/50 text-fd-foreground font-medium text-sm hover:bg-fd-card transition-colors backdrop-blur-sm"
					>
						<svg
							className="size-3.5"
							viewBox="0, 0, 98, 96"
							xmlns="http://www.w3.org/2000/svg"
							aria-label="GitHub"
							role="img"
						>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
								fill="currentColor"
							/>
						</svg>
						GitHub
					</a>
				</div>
			</div>
		</section>
	);
}

const TITLE = "CENTURION";

function AnimatedTitle() {
	return (
		<motion.h2
			className="flex overflow-hidden text-4xl sm:text-5xl font-bold tracking-[0.25em] text-fd-foreground"
			initial="hidden"
			animate="visible"
			variants={{
				hidden: {},
				visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
			}}
			aria-label={TITLE}
		>
			{TITLE.split("").map((char, i) => (
				<motion.span
					key={i}
					variants={{
						hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
						visible: {
							opacity: 1,
							y: 0,
							filter: "blur(0px)",
							transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
						},
					}}
				>
					{char}
				</motion.span>
			))}
		</motion.h2>
	);
}

interface Feature {
	title: string;
	description: string;
	shader: (theme?: string) => React.ReactNode;
}

const features: Feature[] = [
	{
		title: "Flexible registration",
		description:
			"Register commands directly or use the decorator-based API in TypeScript (@Command, @Guard, @Group). Both styles are fully supported.",
		shader: (theme) => (
			<GrainGradient
				colors={theme === "light" ? ["#818cf8", "#a78bfa", "#c4b5fd"] : ["#6366f1", "#8b5cf6", "#a78bfa"]}
				colorBack={theme === "light" ? "#ede9fe" : "#1e1b4b"}
				noise={0.4}
				softness={0.6}
				shape="blob"
				speed={0.5}
				style={{ width: "100%", height: "100%" }}
			/>
		),
	},
	{
		title: "Rich argument types",
		description:
			"Built-in types for players, colors, teams, durations, vectors, and more. Define your own types with custom suggestion and validation logic.",
		shader: (theme) => (
			<Dithering
				colorBack={theme === "light" ? "#e2e8f0" : "#0f172a"}
				colorFront={theme === "light" ? "#94a3b8" : "#334155"}
				shape="swirl"
				type="4x4"
				size={3}
				speed={0.3}
				style={{ width: "100%", height: "100%" }}
			/>
		),
	},
	{
		title: "Guards & permissions",
		description:
			"Attach named guards to any command in Luau or via the @Guard decorator in TypeScript. Role-based permissions with priority levels keep server-side enforcement simple.",
		shader: (theme) => (
			<Dithering
				colorBack={theme === "light" ? "#dcfce7" : "#0c1a0c"}
				colorFront={theme === "light" ? "#86efac" : "#166534"}
				shape="warp"
				speed={0.2}
				// size={1}
				style={{ width: "100%", height: "100%" }}
			/>
		),
	},
];

function Features({ showShaders }: { showShaders: boolean }) {
	const { resolvedTheme } = useTheme();

	return (
		<section className="px-6 py-24 max-w-5xl mx-auto w-full">
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{features.map((f) => (
					<FeatureCard key={f.title} {...f} theme={resolvedTheme} showShaders={showShaders} />
				))}
			</div>
		</section>
	);
}

function FeatureCard({
	title,
	description,
	shader,
	theme,
	showShaders,
}: Feature & {
	theme?: string;
	showShaders: boolean;
}) {
	return (
		<div className="rounded-xl border border-fd-border overflow-hidden relative h-52">
			{/* Shader fills the whole card */}
			<div className="absolute inset-0">{showShaders && shader(theme)}</div>

			{/* Gradient scrim so text is legible */}
			<div
				className="absolute inset-0"
				style={{
					background:
						theme === "light"
							? "linear-gradient(to top, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.5) 55%, transparent 100%)"
							: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
				}}
			/>

			{/* Text pinned to the bottom */}
			<div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-1.5">
				<h3 className={`font-semibold text-sm ${theme === "light" ? "text-gray-900" : "text-white"}`}>
					{title}
				</h3>
				<p className={`text-xs leading-relaxed ${theme === "light" ? "text-gray-600" : "text-white/60"}`}>
					{description}
				</p>
			</div>
		</div>
	);
}

const EXAMPLE_CODE = `import { Command, Guard, Group } from "@rbxts/centurion";
import { CommandContext } from "@rbxts/centurion";

@Group({ name: "admin", description: "Admin commands" })
class AdminCommands {
  @Command({
    name: "kick",
    description: "Kick a player",
    args: [{ name: "player", type: "player" }],
  })
  @Guard("isAdmin")
  kick(ctx: CommandContext, player: Player) {
    player.Kick("You were kicked by an admin.");
    ctx.reply(\`Kicked \${player.Name}\`);
  }
}`;

function CodePreview({ showShaders }: { showShaders: boolean }) {
	return (
		<section className="relative px-6 py-24 overflow-hidden">
			{/* Background shader */}
			<div className="absolute inset-0 -z-10">
				{/*{showShaders && (
					<Dithering
						colorBack="#0a0a0a"
						colorFront="#171b22"
						shape="wave"
						type="8x8"
						size={2}
						speed={0.2}
						style={{ width: "100%", height: "100%" }}
					/>
				)}*/}
			</div>
			<div
				className="absolute inset-0 -z-10"
				style={{
					background:
						"linear-gradient(to bottom, oklch(0.145 0 0 / 0.3) 0%, transparent 30%, transparent 70%, oklch(0.145 0 0 / 0.3) 100%)",
				}}
			/>

			<div className="max-w-3xl mx-auto flex flex-col items-center gap-8">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-fd-foreground mb-3">Simple, expressive API</h2>
					<p className="text-sm text-fd-muted-foreground max-w-md">
						Define your commands in seconds with decorator-based syntax that feels right at home in
						TypeScript.
					</p>
				</div>

				<div className="w-full rounded-xl border border-fd-border bg-fd-card/80 backdrop-blur-sm overflow-hidden">
					<div className="flex items-center gap-1.5 px-4 py-3 border-b border-fd-border bg-fd-card/50">
						<span className="size-3 rounded-full bg-red-500/70" />
						<span className="size-3 rounded-full bg-yellow-500/70" />
						<span className="size-3 rounded-full bg-green-500/70" />
						<span className="ml-2 text-xs text-fd-muted-foreground font-mono">admin-commands.ts</span>
					</div>
					<pre className="p-5 text-xs leading-relaxed overflow-x-auto">
						<code className="text-fd-foreground font-mono whitespace-pre">{EXAMPLE_CODE}</code>
					</pre>
				</div>

				<Link
					to="/docs/$"
					params={{ _splat: "" }}
					className="px-5 py-2.5 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
				>
					Read the docs
				</Link>
			</div>
		</section>
	);
}
