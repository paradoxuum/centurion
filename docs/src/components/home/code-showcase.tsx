import { motion } from "motion/react";
import { type ReactNode, useState } from "react";

const samples = {
	luau: {
		label: "Luau",
		file: "commands.luau",
		code: `local centurion = require(path.to.centurion)

centurion.create_role("moderator", 50, { "kick" })

centurion.register_command("kick", {
    description = "Kick a player from the server",
    permissions = { "kick" },
    arguments = function()
        return centurion.args.player("target"),
            centurion.optional(centurion.args.string("reason"))
    end,
    callback = function(ctx, target: Player, reason: string?)
        target:Kick(reason or "No reason provided")
        return \`Kicked {target.Name}\`
    end,
})`,
	},
	ts: {
		label: "TypeScript",
		file: "moderation.ts",
		code: `import { Command, Permission, args, optional } from "@rbxts/centurion";
import type { ExecutionContext } from "@rbxts/centurion";

class ModerationCommands {
    @Command({
        description: "Kick a player from the server",
        arguments: () => [args.player("target"), optional(args.string("reason"))],
    })
    @Permission("kick")
    kick(ctx: ExecutionContext, target: Player, reason?: string) {
        target.Kick(reason ?? "No reason provided");
        ctx.reply(\`Kicked \${target.Name}\`);
    }
}`,
	},
} as const;

type Lang = keyof typeof samples;

const keywords = new Set([
	"local",
	"function",
	"return",
	"end",
	"or",
	"and",
	"not",
	"if",
	"then",
	"import",
	"from",
	"type",
	"class",
	"const",
	"export",
]);

const tokenPattern =
	/(--[^\n]*|\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(@[A-Za-z_]\w*)|(\b\d+\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)|(\s+|.)/g;

function highlight(code: string): ReactNode[] {
	const out: ReactNode[] = [];
	let i = 0;

	for (const match of code.matchAll(tokenPattern)) {
		const [text, comment, string, decorator, number, call, word] = match;
		let className: string | undefined;

		if (comment) className = "text-fd-muted-foreground italic";
		else if (string) className = "text-emerald-600 dark:text-emerald-300";
		else if (decorator) className = "text-amber-600 dark:text-amber-300";
		else if (number) className = "text-orange-600 dark:text-orange-300";
		else if (call) className = "text-sky-600 dark:text-sky-300";
		else if (word && keywords.has(word)) className = "text-violet-600 dark:text-violet-300";
		else if (word && /^[A-Z]/.test(word)) className = "text-yellow-700 dark:text-yellow-200";

		out.push(
			className ? (
				<span key={i++} className={className}>
					{text}
				</span>
			) : (
				text
			),
		);
	}

	return out;
}

export function CodeShowcase() {
	const [lang, setLang] = useState<Lang>("luau");
	const sample = samples[lang];

	return (
		<div className="w-full rounded-2xl border border-fd-border bg-fd-card/80 backdrop-blur-md overflow-hidden shadow-2xl shadow-black/10">
			<div className="flex items-center gap-1 px-3 border-b border-fd-border bg-fd-muted/40">
				<div role="tablist" aria-label="Language" className="flex">
					{(Object.keys(samples) as Lang[]).map((key) => (
						<button
							key={key}
							type="button"
							role="tab"
							aria-selected={lang === key}
							onClick={() => setLang(key)}
							className={`relative px-3 py-2.5 text-xs font-medium transition-colors ${
								lang === key
									? "text-fd-foreground"
									: "text-fd-muted-foreground hover:text-fd-foreground"
							}`}
						>
							{samples[key].label}
							{lang === key && (
								<motion.span
									layoutId="code-tab"
									className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-amber-500"
								/>
							)}
						</button>
					))}
				</div>
				<span className="ml-auto text-xs text-fd-muted-foreground font-mono">{sample.file}</span>
			</div>
			<pre className="p-5 text-[12.5px] leading-relaxed overflow-x-auto">
				<code className="font-mono whitespace-pre text-fd-foreground">{highlight(sample.code)}</code>
			</pre>
		</div>
	);
}
