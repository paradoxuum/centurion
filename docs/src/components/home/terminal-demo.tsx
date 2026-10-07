import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// Catppuccin Mocha, matching `themes.mocha` in centurion-ui
const theme = {
  background: "#1e1e2e",
  surface: "#313244",
  border: "#45475a",
  text: "#cdd6f4",
  subtext: "#a6adc8",
  highlight: "#89b4fa",
  success: "#a6e3a1",
  error: "#f38ba8",
};

interface Suggestion {
  name: string;
  description?: string;
}

interface SuggestionState {
  /** Shown above the options when suggesting an argument */
  argument?: { name: string; type: string; description: string };
  options: Suggestion[];
  /** The text typed so far for the current token, used for ghost text */
  prefix: string;
}

interface Log {
  id: number;
  command: string;
  success: boolean;
  message: string;
}

type Step =
  | { kind: "type"; text: string }
  | { kind: "suggest"; state: SuggestionState }
  | { kind: "complete"; input: string }
  | { kind: "submit"; success: boolean; message: string }
  | { kind: "wait"; ms: number };

const commands = {
  kick: { name: "kick", description: "Kick a player from the server" },
  kill: { name: "kill", description: "Kill player(s)" },
  to: { name: "to", description: "Teleport to a position" },
};

const script: Step[] = [
  { kind: "type", text: "ki" },
  {
    kind: "suggest",
    state: { options: [commands.kick, commands.kill], prefix: "ki" },
  },
  { kind: "wait", ms: 900 },
  { kind: "complete", input: "kick " },
  {
    kind: "suggest",
    state: {
      argument: {
        name: "target",
        type: "player",
        description: "The player to kick",
      },
      options: [
        { name: "Builderman" },
        { name: "Bubbles_Dev" },
        { name: "Noob2763" },
      ],
      prefix: "",
    },
  },
  { kind: "wait", ms: 500 },
  { kind: "type", text: "Bu" },
  {
    kind: "suggest",
    state: {
      argument: {
        name: "target",
        type: "player",
        description: "The player to kick",
      },
      options: [{ name: "Builderman" }, { name: "Bubbles_Dev" }],
      prefix: "Bu",
    },
  },
  { kind: "wait", ms: 800 },
  { kind: "complete", input: "kick Builderman " },
  {
    kind: "suggest",
    state: {
      argument: {
        name: "reason",
        type: "string?",
        description: "The reason for the kick",
      },
      options: [],
      prefix: "",
    },
  },
  { kind: "type", text: "spamming" },
  { kind: "wait", ms: 500 },
  { kind: "submit", success: true, message: "Kicked Builderman" },
  { kind: "wait", ms: 1100 },

  { kind: "type", text: "to" },
  { kind: "suggest", state: { options: [commands.to], prefix: "to" } },
  { kind: "wait", ms: 500 },
  { kind: "complete", input: "to " },
  {
    kind: "suggest",
    state: {
      argument: {
        name: "position",
        type: "vector3",
        description: "x, y and z coordinates",
      },
      options: [],
      prefix: "",
    },
  },
  { kind: "type", text: "0 50 0" },
  { kind: "wait", ms: 450 },
  { kind: "submit", success: true, message: "Teleported to (0, 50, 0)" },
  { kind: "wait", ms: 1100 },

  { kind: "type", text: "kick " },
  {
    kind: "suggest",
    state: {
      argument: {
        name: "target",
        type: "player",
        description: "The player to kick",
      },
      options: [
        { name: "Builderman" },
        { name: "Bubbles_Dev" },
        { name: "Noob2763" },
      ],
      prefix: "",
    },
  },
  { kind: "type", text: "Guest" },
  {
    kind: "suggest",
    state: {
      argument: {
        name: "target",
        type: "player",
        description: "The player to kick",
      },
      options: [],
      prefix: "Guest",
    },
  },
  { kind: "wait", ms: 500 },
  { kind: "submit", success: false, message: 'Invalid player: "Guest"' },
  { kind: "wait", ms: 2400 },
];

// Static state shown when the user prefers reduced motion
const staticLogs: Log[] = [
  {
    id: 2,
    command: "to 0 50 0",
    success: true,
    message: "Teleported to (0, 50, 0)",
  },
  {
    id: 1,
    command: "kick Builderman spamming",
    success: true,
    message: "Kicked Builderman",
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function TerminalDemo() {
  const reduced = useReducedMotion();
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionState | undefined>();
  const [logs, setLogs] = useState<Log[]>(staticLogs);
  const [failed, setFailed] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (reduced) return;

    let cancelled = false;
    let logId = 0;
    let current = "";

    const run = async () => {
      setLogs([]);
      await sleep(900);

      while (!cancelled) {
        for (const step of script) {
          if (cancelled) return;

          switch (step.kind) {
            case "type":
              for (const char of step.text) {
                if (cancelled) return;
                current += char;
                setInput(current);
                await sleep(55 + Math.random() * 70);
              }
              break;
            case "suggest":
              setSuggestions(step.state);
              break;
            case "complete":
              current = step.input;
              setInput(current);
              setSuggestions(undefined);
              await sleep(250);
              break;
            case "submit": {
              const command = current.trim();
              const id = ++logId;
              current = "";
              setInput("");
              setSuggestions(undefined);
              setLogs((prev) =>
                [
                  { id, command, success: step.success, message: step.message },
                  ...prev,
                ].slice(0, 4),
              );
              if (!step.success) {
                setFailed(id);
                setFlash(true);
                setTimeout(() => setFlash(false), 600);
              }
              break;
            }
            case "wait":
              await sleep(step.ms);
              break;
          }
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [reduced]);

  const selected = suggestions?.options[0];
  const ghost = selected?.name
    .toLowerCase()
    .startsWith(suggestions?.prefix.toLowerCase() ?? "")
    ? selected.name.slice(suggestions?.prefix.length ?? 0)
    : "";

  return (
    <div
      className="w-full max-w-xl font-mono text-[13px] leading-relaxed text-left select-none"
      style={{ color: theme.text }}
      role="img"
      aria-label="Animated preview of the Centurion terminal: commands are typed with live suggestions and their results are logged."
    >
      {/* History */}
      <div className="flex flex-col-reverse gap-1.5 h-[132px] overflow-hidden mb-2 px-1 [mask-image:linear-gradient(to_bottom,transparent,black_45%)]">
        {logs.map((log) => (
          <motion.div
            key={log.id}
            layout={!reduced}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
          >
            <span style={{ color: theme.subtext }}>
              <span style={{ color: theme.highlight }}>›</span> {log.command}
            </span>
            <span style={{ color: log.success ? theme.success : theme.error }}>
              {log.message}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <motion.div
        key={failed}
        animate={failed && !reduced ? { x: [0, -7, 6, -4, 3, 0] } : undefined}
        transition={{ duration: 0.35 }}
        className="relative flex items-center gap-2 rounded-lg px-3.5 py-2.5 border transition-colors duration-300"
        style={{
          background: theme.background,
          borderColor: flash ? theme.error : theme.border,
        }}
      >
        <span style={{ color: theme.highlight }}>›</span>
        <span className="flex items-center whitespace-pre">
          <HighlightedInput value={input} />
          <span
            className="inline-block w-[2px] h-4 -mr-[2px] animate-[terminal-caret_1.1s_steps(1)_infinite]"
            style={{ background: theme.text }}
          />
          <span style={{ color: theme.subtext, opacity: 0.55 }}>{ghost}</span>
          {!input && (
            <span style={{ color: theme.subtext, opacity: 0.45 }}>
              Enter a command…
            </span>
          )}
        </span>
      </motion.div>

      {/* Suggestions */}
      <div className="h-[132px] pt-2">
        {suggestions &&
          (suggestions.argument || suggestions.options.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="rounded-lg border overflow-hidden"
              style={{
                background: theme.background,
                borderColor: theme.border,
              }}
            >
              {suggestions.argument && (
                <div
                  className="px-3.5 py-2"
                  style={{ background: theme.surface }}
                >
                  <div>
                    <span style={{ color: theme.highlight }}>
                      {suggestions.argument.name}
                    </span>
                    <span style={{ color: theme.subtext }}>
                      : {suggestions.argument.type}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: theme.subtext }}>
                    {suggestions.argument.description}
                  </div>
                </div>
              )}
              {suggestions.options.map((option, i) => (
                <div
                  key={option.name}
                  className="flex items-baseline gap-3 px-3.5 py-1"
                  style={{
                    background: i === 0 ? `${theme.highlight}1f` : undefined,
                  }}
                >
                  <span
                    style={{ color: i === 0 ? theme.highlight : theme.text }}
                  >
                    {option.name}
                  </span>
                  {option.description && (
                    <span
                      className="truncate text-xs"
                      style={{ color: theme.subtext }}
                    >
                      {option.description}
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
      </div>
    </div>
  );
}

function HighlightedInput({ value }: { value: string }) {
  const space = value.indexOf(" ");
  if (space === -1)
    return <span style={{ color: theme.highlight }}>{value}</span>;

  return (
    <>
      <span style={{ color: theme.highlight }}>{value.slice(0, space)}</span>
      {value.slice(space)}
    </>
  );
}
