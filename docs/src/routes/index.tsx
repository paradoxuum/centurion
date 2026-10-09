import { CodeShowcase } from "@/components/home/code-showcase";
import { ShaderLayer, useMounted } from "@/components/home/shader-layer";
import { TerminalDemo } from "@/components/home/terminal-demo";
import { baseOptions } from "@/lib/layout.shared";
import { Dithering, GrainGradient, LiquidMetal, MeshGradient } from "@paper-design/shaders-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { useTheme } from "fumadocs-ui/provider/base";
import {
	ArrowRight,
	Check,
	Copy,
	Crown,
	Layers,
	type LucideIcon,
	RefreshCw,
	ShieldCheck,
	SquareTerminal,
	Variable,
	X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useState } from "react";

export const Route = createFileRoute("/")({
	component: Home,
});

const fill = { width: "100%", height: "100%" };

function useShaderSettings() {
	const { resolvedTheme } = useTheme();
	const reduced = useReducedMotion();
	return {
		dark: resolvedTheme !== "light",
		speed: (value: number) => (reduced ? 0 : value),
	};
}

function Home() {
	return (
		<HomeLayout {...baseOptions()}>
			<main className="flex flex-col overflow-x-clip">
				<Hero />
				<Features />
				<CodeSection />
				<CallToAction />
			</main>
			<Footer />
		</HomeLayout>
	);
}

/* -------------------------------------------------------------------------- */
/*                                    Hero                                    */
/* -------------------------------------------------------------------------- */

function Hero() {
	const { dark, speed } = useShaderSettings();

	return (
		<section className="relative isolate px-6 pt-16 sm:pt-24 pb-12">
			{/* Dithered field, faded out towards the edges */}
			<ShaderLayer
				className="-z-10 opacity-35 dark:opacity-45"
				style={{
					maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 10%, transparent 75%)",
					WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 10%, transparent 75%)",
				}}
			>
				<Dithering
					colorBack="#00000000"
					colorFront={dark ? "#f59e0b" : "#b45309"}
					shape="warp"
					type="4x4"
					size={2}
					speed={speed(0.18)}
					minPixelRatio={1}
					style={fill}
				/>
			</ShaderLayer>

			{/* Warm glow behind the logo */}
			<div
				aria-hidden
				className="absolute inset-x-0 top-0 -z-10 h-[520px] opacity-60 dark:opacity-40"
				style={{
					background: "radial-gradient(40% 50% at 50% 20%, rgb(245 158 11 / 0.35), transparent 70%)",
				}}
			/>

			<div className="relative max-w-3xl mx-auto flex flex-col items-center text-center">
				<HeroLogo />

				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
					className="flex flex-col items-center"
				>
					<Link
						to="/docs/$"
						params={{ _splat: "guides/migration" }}
						className="group mt-6 inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card/60 px-3 py-1 text-xs text-fd-muted-foreground backdrop-blur-sm transition-colors hover:text-fd-foreground"
					>
						<span className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_8px] shadow-amber-500" />
						Centurion v2 — rewritten in Luau
						<ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
					</Link>

					<h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tight text-balance bg-gradient-to-b from-fd-foreground to-fd-foreground/60 bg-clip-text text-transparent">
						A command framework for Roblox
					</h1>
					<p className="mt-5 max-w-xl text-base sm:text-lg text-fd-muted-foreground text-balance">
						Define commands with typed arguments, guards and role-based permissions, then run them from an
						in-game terminal. Works with Luau and roblox-ts.
					</p>

					<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
						<Link
							to="/docs/$"
							params={{ _splat: "" }}
							className="group inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
						>
							Get started
							<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
						</Link>
						<InstallCommand />
					</div>
				</motion.div>
			</div>

			<TerminalStage />
		</section>
	);
}

function HeroLogo() {
	const { speed } = useShaderSettings();
	const mounted = useMounted();

	return (
		<div className="relative size-36 sm:size-44">
			{/* Static logo, shown until the liquid metal shader has taken over */}
			<img
				src="/logo.svg"
				alt="Centurion"
				className={`absolute inset-0 size-full object-contain p-[9%] invert dark:invert-0 transition-opacity duration-700 ${
					mounted ? "opacity-0 delay-500" : "opacity-100"
				}`}
			/>
			{mounted && (
				<LiquidMetal
					aria-hidden
					image="/logo.svg"
					colorBack="#00000000"
					colorTint="#fbbf24"
					repetition={4}
					softness={0.45}
					shiftRed={0.3}
					shiftBlue={0.3}
					distortion={0.1}
					contour={0.6}
					angle={70}
					speed={speed(0.6)}
					fit="contain"
					scale={0.82}
					className="absolute inset-0 animate-fd-fade-in duration-1000"
					style={fill}
				/>
			)}
		</div>
	);
}

function InstallCommand() {
	const command = "wally install centurion";
	const [copied, setCopied] = useState(false);

	const copy = () => {
		navigator.clipboard.writeText(command).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	};

	return (
		<button
			type="button"
			onClick={copy}
			className="group inline-flex items-center gap-3 rounded-lg border border-fd-border bg-fd-card/60 px-4 py-2.5 font-mono text-sm text-fd-muted-foreground backdrop-blur-sm transition-colors hover:text-fd-foreground"
			aria-label={`Copy install command: ${command}`}
		>
			<span>
				<span className="text-amber-600 dark:text-amber-400">$</span> {command}
			</span>
			{copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5 opacity-60" />}
		</button>
	);
}

function TerminalStage() {
	const { speed } = useShaderSettings();

	return (
		<motion.div
			initial={{ opacity: 0, y: 32 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
			className="relative mx-auto mt-16 sm:mt-20 max-w-5xl"
		>
			{/* Glow that bleeds out from under the stage */}
			<div
				aria-hidden
				className="absolute -inset-x-10 -inset-y-8 -z-10 rounded-[3rem] bg-gradient-to-tr from-amber-500/30 via-orange-500/10 to-sky-500/20 blur-3xl"
			/>

			<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#11111b] shadow-2xl shadow-black/40">
				{/* "Game viewport" behind the terminal */}
				<ShaderLayer className="opacity-90">
					<MeshGradient
						colors={["#11111b", "#1e1e2e", "#7c2d12", "#b45309", "#1e3a5f"]}
						distortion={0.85}
						swirl={0.5}
						grainOverlay={0.25}
						speed={speed(0.25)}
						minPixelRatio={1}
						style={fill}
					/>
				</ShaderLayer>
				<div
					aria-hidden
					className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:48px_48px]"
				/>

				{/* Window chrome */}
				<div className="relative flex items-center gap-1.5 border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-sm">
					<span className="size-2.5 rounded-full bg-white/20" />
					<span className="size-2.5 rounded-full bg-white/20" />
					<span className="size-2.5 rounded-full bg-white/20" />
					<span className="ml-3 font-mono text-xs text-white/50">Centurion — press F2 to toggle</span>
				</div>

				<div className="relative px-4 py-6 sm:px-8 sm:py-8">
					<TerminalDemo />
				</div>
			</div>
		</motion.div>
	);
}

/* -------------------------------------------------------------------------- */
/*                                  Features                                  */
/* -------------------------------------------------------------------------- */

function Features() {
	return (
		<section className="px-6 py-24 sm:py-32 max-w-6xl mx-auto w-full">
			<SectionHeading
				eyebrow="Features"
				title="What's included"
				description="Centurion parses arguments, checks permissions and syncs commands to clients, so your callbacks only have to do the actual work."
			/>

			<div className="mt-14 grid grid-cols-1 lg:grid-cols-6 gap-4">
				<ArgumentsCard />
				<GuardsCard />
				<RolesCard />
				<TerminalCard />
				<SyncCard />
				<LanguagesCard />
			</div>
		</section>
	);
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-80px" }}
			transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
			className="mx-auto max-w-2xl text-center"
		>
			<p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">{eyebrow}</p>
			<h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-balance">{title}</h2>
			<p className="mt-4 text-fd-muted-foreground text-balance">{description}</p>
		</motion.div>
	);
}

function Card({
	icon: Icon,
	title,
	description,
	className = "",
	background,
	children,
	index = 0,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	className?: string;
	background?: ReactNode;
	children?: ReactNode;
	index?: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-60px" }}
			transition={{
				duration: 0.6,
				delay: (index % 3) * 0.08,
				ease: [0.22, 1, 0.36, 1],
			}}
			className={`group relative isolate flex flex-col overflow-hidden rounded-2xl border border-fd-border bg-fd-card p-6 ${className}`}
		>
			{background}
			<div className="flex size-9 items-center justify-center rounded-lg border border-fd-border bg-fd-background/80 backdrop-blur-sm">
				<Icon className="size-4 text-amber-600 dark:text-amber-400" />
			</div>
			<h3 className="mt-4 font-semibold">{title}</h3>
			<p className="mt-1.5 max-w-md text-sm text-fd-muted-foreground">{description}</p>
			{children && <div className="mt-6 flex-1 flex flex-col justify-end">{children}</div>}
		</motion.div>
	);
}

const argumentTypes = [
	"string",
	"number",
	"integer",
	"boolean",
	"player",
	"players",
	"team",
	"duration",
	"vector2",
	"vector3",
	"hex_color",
	"rgb_color",
	"brick_color",
];

function ArgumentsCard() {
	const { dark, speed } = useShaderSettings();

	return (
		<Card
			index={0}
			icon={Variable}
			title="Typed arguments"
			description="Arguments are parsed and validated before your command runs. There are built-in types for common values, and you can add your own with custom parsing and suggestions."
			className="lg:col-span-4"
			background={
				<ShaderLayer
					className="-z-10 opacity-50 dark:opacity-60"
					style={{
						maskImage: "linear-gradient(to left, black, transparent 70%)",
						WebkitMaskImage: "linear-gradient(to left, black, transparent 70%)",
					}}
				>
					<Dithering
						colorBack="#00000000"
						colorFront={dark ? "#f59e0b" : "#d97706"}
						shape="swirl"
						type="4x4"
						size={2}
						speed={speed(0.3)}
						minPixelRatio={1}
						style={fill}
					/>
				</ShaderLayer>
			}
		>
			<div className="flex flex-wrap gap-1.5">
				{argumentTypes.map((type) => (
					<span
						key={type}
						className="rounded-md border border-fd-border bg-fd-background/80 px-2 py-1 font-mono text-xs text-fd-muted-foreground backdrop-blur-sm"
					>
						{type}
					</span>
				))}
				<span className="rounded-md border border-dashed border-amber-500/50 px-2 py-1 font-mono text-xs text-amber-600 dark:text-amber-400">
					+ your own
				</span>
			</div>
		</Card>
	);
}

function GuardsCard() {
	const guards = [
		{ name: "in-game", pass: true },
		{ name: "is-alive", pass: true },
		{ name: "cooldown", pass: false },
	];

	return (
		<Card
			index={1}
			icon={ShieldCheck}
			title="Guards"
			description="Checks that run before a command executes. Attach them to individual commands or register them globally."
			className="lg:col-span-2"
		>
			<div className="flex flex-col gap-1.5 font-mono text-xs">
				{guards.map((guard, i) => (
					<motion.div
						key={guard.name}
						initial={{ opacity: 0, x: -8 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.3 + i * 0.15 }}
						className="flex items-center justify-between rounded-md border border-fd-border bg-fd-background px-3 py-2"
					>
						<span className="text-fd-muted-foreground">{guard.name}</span>
						{guard.pass ? (
							<Check className="size-3.5 text-emerald-500" />
						) : (
							<X className="size-3.5 text-rose-500" />
						)}
					</motion.div>
				))}
			</div>
		</Card>
	);
}

function RolesCard() {
	const roles = [
		{ name: "admin", priority: 100 },
		{ name: "moderator", priority: 50 },
		{ name: "user", priority: 1 },
	];

	return (
		<Card
			index={2}
			icon={Crown}
			title="Roles & permissions"
			description="Roles have a priority, and a role inherits the permissions of every role below it. Permission checks run on the server."
			className="lg:col-span-2"
		>
			<div className="flex flex-col gap-2 font-mono text-xs">
				{roles.map((role, i) => (
					<div key={role.name} className="flex items-center gap-3">
						<span className="w-20 text-fd-muted-foreground">{role.name}</span>
						<div className="h-2 flex-1 overflow-hidden rounded-full bg-fd-muted">
							<motion.div
								initial={{ width: 0 }}
								whileInView={{ width: `${Math.max(role.priority, 6)}%` }}
								viewport={{ once: true }}
								transition={{
									duration: 0.9,
									delay: 0.3 + i * 0.12,
									ease: [0.22, 1, 0.36, 1],
								}}
								className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
							/>
						</div>
						<span className="w-8 text-right tabular-nums text-fd-muted-foreground">{role.priority}</span>
					</div>
				))}
			</div>
		</Card>
	);
}

// From `themes` in centurion-ui's theme.luau
const uiThemes = [
	{
		name: "mocha",
		background: "#1e1e2e",
		surface: "#313244",
		text: "#cdd6f4",
		highlight: "#89b4fa",
	},
	{
		name: "macchiato",
		background: "#24273a",
		surface: "#363a4f",
		text: "#cad3f5",
		highlight: "#8aadf4",
	},
	{
		name: "frappe",
		background: "#303446",
		surface: "#414559",
		text: "#c6d0f5",
		highlight: "#8caaee",
	},
	{
		name: "latte",
		background: "#e6e9ef",
		surface: "#dce0e8",
		text: "#4c4f69",
		highlight: "#1e66f5",
	},
	{
		name: "roblox",
		background: "#111216",
		surface: "#1f2024",
		text: "#ffffff",
		highlight: "#335fff",
	},
];

function TerminalCard() {
	const { dark, speed } = useShaderSettings();

	return (
		<Card
			index={3}
			icon={SquareTerminal}
			title="In-game terminal"
			description="centurion-ui provides a terminal with fuzzy suggestions, tab completion, command history and theming."
			className="lg:col-span-4"
			background={
				<ShaderLayer
					className="-z-10 opacity-70 dark:opacity-50"
					style={{
						maskImage: "linear-gradient(to top, black, transparent 80%)",
						WebkitMaskImage: "linear-gradient(to top, black, transparent 80%)",
					}}
				>
					<GrainGradient
						colors={dark ? ["#89b4fa", "#b45309", "#1e1e2e"] : ["#93c5fd", "#fcd34d", "#fde68a"]}
						colorBack="#00000000"
						softness={0.8}
						intensity={0.5}
						noise={0.35}
						shape="wave"
						speed={speed(0.6)}
						minPixelRatio={1}
						style={fill}
					/>
				</ShaderLayer>
			}
		>
			<div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
				{uiThemes.map((t) => (
					<div
						key={t.name}
						className="rounded-lg border p-2 font-mono text-[11px] shadow-sm transition-transform group-hover:-translate-y-0.5"
						style={{
							background: t.background,
							borderColor: t.surface,
							color: t.text,
						}}
					>
						<div className="rounded px-1.5 py-1" style={{ background: t.surface }}>
							<span style={{ color: t.highlight }}>›</span> {t.name}
						</div>
						<div className="mt-1.5 flex gap-1">
							<span className="h-1 w-6 rounded-full" style={{ background: t.highlight }} />
							<span className="h-1 w-3 rounded-full opacity-50" style={{ background: t.text }} />
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}

function SyncCard() {
	const reduced = useReducedMotion();

	return (
		<Card
			index={4}
			icon={RefreshCw}
			title="Client–server sync"
			description="Commands registered on the server are sent to clients and kept up to date with patches. Commands a player can't run can be hidden from them."
			className="lg:col-span-3"
		>
			<div className="flex items-center gap-3 font-mono text-xs">
				<span className="rounded-md border border-fd-border bg-fd-background px-3 py-2">server</span>
				<div className="relative h-px flex-1 bg-gradient-to-r from-fd-border via-amber-500/60 to-fd-border">
					{!reduced &&
						[0, 1, 2].map((i) => (
							<motion.span
								key={i}
								className="absolute -top-[3px] size-[7px] rounded-full bg-amber-500 shadow-[0_0_10px] shadow-amber-500"
								initial={{ left: "0%", opacity: 0 }}
								animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
								transition={{
									duration: 2.4,
									delay: i * 0.8,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}}
							/>
						))}
				</div>
				<span className="rounded-md border border-fd-border bg-fd-background px-3 py-2">client</span>
			</div>
		</Card>
	);
}

function LanguagesCard() {
	const decorators = ["@Command", "@Group", "@Guard", "@Role", "@Permission"];

	return (
		<Card
			index={5}
			icon={Layers}
			title="Luau and TypeScript"
			description="Register commands with function calls in Luau, or with class decorators in roblox-ts. Flamework dependency injection is supported."
			className="lg:col-span-3"
		>
			<div className="flex flex-wrap gap-1.5 font-mono text-xs">
				{decorators.map((d) => (
					<span key={d} className="rounded-md bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-300">
						{d}
					</span>
				))}
			</div>
		</Card>
	);
}

/* -------------------------------------------------------------------------- */
/*                                    Code                                    */
/* -------------------------------------------------------------------------- */

function CodeSection() {
	return (
		<section className="relative px-6 pb-24 sm:pb-32">
			<div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[2fr_3fr]">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
				>
					<p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
						Example
					</p>
					<h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
						Defining a command
					</h2>
					<p className="mt-4 text-fd-muted-foreground">
						A command is a table with a name, its arguments, who is allowed to run it and a callback.
						The terminal's suggestions and the validation and permission checks are all based on it.
					</p>
					<ul className="mt-6 flex flex-col gap-2 text-sm">
						{[
							"The callback receives arguments already parsed",
							"Permissions are checked before the callback runs",
							"Return a string to send a reply to the executor",
						].map((item) => (
							<li key={item} className="flex items-center gap-2.5">
								<span className="flex size-5 items-center justify-center rounded-full bg-amber-500/15">
									<Check className="size-3 text-amber-600 dark:text-amber-400" />
								</span>
								{item}
							</li>
						))}
					</ul>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
					className="min-w-0"
				>
					<CodeShowcase />
				</motion.div>
			</div>
		</section>
	);
}

/* -------------------------------------------------------------------------- */
/*                               Call to action                               */
/* -------------------------------------------------------------------------- */

function CallToAction() {
	const { dark, speed } = useShaderSettings();

	return (
		<section className="px-6 pb-24">
			<div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl border border-fd-border bg-fd-card px-6 py-20 text-center">
				<ShaderLayer className="-z-10">
					<GrainGradient
						colors={dark ? ["#f59e0b", "#9a3412", "#7a2a0000"] : ["#fcd34d", "#fb923c", "#fde68a40"]}
						colorBack="#00000000"
						softness={1}
						intensity={0.8}
						noise={0.5}
						shape="corners"
						speed={speed(0.8)}
						minPixelRatio={1}
						style={fill}
					/>
				</ShaderLayer>

				<h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-balance">
					Getting started
				</h2>
				<p className="mx-auto mt-4 max-w-lg text-fd-muted-foreground text-balance">
					The docs cover installing Centurion, registering commands and setting up the terminal.
				</p>
				<div className="mt-8 flex flex-wrap justify-center gap-3">
					<Link
						to="/docs/$"
						params={{ _splat: "" }}
						className="group inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
					>
						Read the docs
						<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
					</Link>
					<a
						href="https://github.com/paradoxuum/centurion"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-background/60 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-fd-background"
					>
						<GitHubIcon />
						View on GitHub
					</a>
				</div>
			</div>
		</section>
	);
}

function Footer() {
	return (
		<footer className="border-t border-fd-border px-6 py-8">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-fd-muted-foreground">
				<span className="flex items-center gap-2">
					<img src="/logo.svg" alt="" className="h-4 w-auto invert dark:invert-0 opacity-70" />
					Centurion · MIT License
				</span>
				<a
					href="https://github.com/paradoxuum/centurion"
					target="_blank"
					rel="noopener noreferrer"
					className="transition-colors hover:text-fd-foreground"
				>
					GitHub
				</a>
			</div>
		</footer>
	);
}

function GitHubIcon() {
	return (
		<svg className="size-3.5" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg" aria-hidden>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
				fill="currentColor"
			/>
		</svg>
	);
}
