import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Fragment, type ReactNode, useEffect, useState } from "react";

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

interface Argument {
  name: string;
  type: string;
  optional?: boolean;
  description?: string;
}

interface SuggestionState {
  /** The command being typed and which of its arguments the cursor is on */
  usage?: { command: string; args: Argument[]; index: number };
  /** Shown at the top of the popover when the input can't be run */
  error?: string;
  options: Suggestion[];
  /** The text typed so far for the current token, used for ghost text and matching */
  prefix: string;
}

interface Log {
  id: number;
  command: string;
  success: boolean;
  message: string;
  time: string;
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

const players = [
  { name: "Builderman" },
  { name: "Bubbles_Dev" },
  { name: "Noob2763" },
];

const kickArgs: Argument[] = [
  { name: "target", type: "player", description: "The player to kick" },
  {
    name: "reason",
    type: "string",
    optional: true,
    description: "The reason for the kick",
  },
];

const toArgs: Argument[] = [
  { name: "position", type: "vector3", description: "x, y and z coordinates" },
];

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
      usage: { command: "kick", args: kickArgs, index: 0 },
      options: players,
      prefix: "",
    },
  },
  { kind: "wait", ms: 500 },
  { kind: "type", text: "Bu" },
  {
    kind: "suggest",
    state: {
      usage: { command: "kick", args: kickArgs, index: 0 },
      options: players.slice(0, 2),
      prefix: "Bu",
    },
  },
  { kind: "wait", ms: 800 },
  { kind: "complete", input: "kick Builderman " },
  {
    kind: "suggest",
    state: {
      usage: { command: "kick", args: kickArgs, index: 1 },
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
      usage: { command: "to", args: toArgs, index: 0 },
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
      usage: { command: "kick", args: kickArgs, index: 0 },
      options: players,
      prefix: "",
    },
  },
  { kind: "type", text: "Guest" },
  {
    kind: "suggest",
    state: {
      usage: { command: "kick", args: kickArgs, index: 0 },
      error: 'Invalid player: "Guest"',
      options: [],
      prefix: "Guest",
    },
  },
  { kind: "wait", ms: 700 },
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
    time: "12:01 PM",
  },
  {
    id: 1,
    command: "kick Builderman spamming",
    success: true,
    message: "Kicked Builderman",
    time: "12:00 PM",
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatTime = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

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
                  {
                    id,
                    command,
                    success: step.success,
                    message: step.message,
                    time: formatTime(),
                  },
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

  const invalid = flash || suggestions?.error !== undefined;
  const showPopover =
    suggestions !== undefined &&
    (suggestions.usage !== undefined ||
      suggestions.error !== undefined ||
      suggestions.options.length > 0);

  return (
    <div
      className="w-full max-w-xl font-mono text-[13px] leading-relaxed text-left select-none"
      style={{ color: theme.text }}
      role="img"
      aria-label="Animated preview of the Centurion terminal: commands are typed with live suggestions and their results are logged."
    >
      {/* Console: header, history and input */}
      <div
        className="rounded-[10px] border backdrop-blur-sm"
        style={{
          background: `${theme.background}cc`,
          borderColor: theme.border,
        }}
      >
        {/* Header */}
        <div className="flex h-[34px] items-center justify-between px-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-3.5 [mask:url(/logo.svg)_center/contain_no-repeat]"
              style={{ background: theme.highlight }}
            />
            <span className="font-bold" style={{ color: theme.subtext }}>
              Centurion
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="rounded px-1.5 py-px font-bold"
              style={{ background: theme.surface }}
            >
              F2
            </span>
            <span style={{ color: theme.subtext }}>to close</span>
          </div>
        </div>
        <div className="h-px" style={{ background: theme.border }} />

        {/* History, newest at the bottom */}
        <div className="flex h-[148px] flex-col-reverse gap-0.5 overflow-hidden px-1 pt-1 [mask-image:linear-gradient(to_bottom,transparent,black_35%)]">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-md px-2 py-1.5"
              style={{
                background: log.success ? undefined : `${theme.error}1f`,
              }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 font-bold">
                  <span
                    className="w-[18px] shrink-0"
                    style={{
                      color: log.success ? theme.highlight : theme.error,
                    }}
                  >
                    &gt;
                  </span>
                  <span className="truncate">{log.command}</span>
                </span>
                <span
                  className="shrink-0 text-xs opacity-60"
                  style={{ color: theme.subtext }}
                >
                  {log.time}
                </span>
              </div>
              <div
                className="pl-[18px]"
                style={{ color: log.success ? theme.text : theme.error }}
              >
                {log.message}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="p-2">
          <motion.div
            key={failed}
            animate={
              failed && !reduced ? { x: [0, -7, 6, -4, 3, 0] } : undefined
            }
            transition={{ duration: 0.35 }}
            className="flex items-center rounded-md border py-2 pr-2.5 transition-colors duration-150"
            style={{
              background: theme.surface,
              borderColor: invalid ? theme.error : theme.highlight,
            }}
          >
            <span
              className="w-[34px] shrink-0 pl-3 font-bold"
              style={{ color: invalid ? theme.error : theme.highlight }}
            >
              &gt;
            </span>
            <span className="flex items-center whitespace-pre">
              <HighlightedInput
                value={input}
                invalid={suggestions?.error !== undefined}
              />
              <span
                className="inline-block w-[2px] h-4 -mr-[2px] animate-[terminal-caret_1.1s_steps(1)_infinite]"
                style={{ background: theme.text }}
              />
              <span style={{ color: theme.subtext, opacity: 0.7 }}>
                {ghost}
              </span>
              {!input && (
                <span style={{ color: theme.subtext }}>Type a command</span>
              )}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Completion popover, sized to its contents */}
      <div className="h-[184px] pl-2 pt-1.5">
        <AnimatePresence>
          {showPopover && suggestions && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="w-fit min-w-[280px] max-w-full rounded-lg border"
              style={{
                background: theme.background,
                borderColor: theme.border,
              }}
            >
              <Popover state={suggestions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Popover({ state }: { state: SuggestionState }) {
  const { usage, error, options, prefix } = state;
  const arg = usage?.args[usage.index];
  const hasDetails = error !== undefined || arg !== undefined;

  return (
    <>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs">
          <Pill color={theme.error}>error</Pill>
          <span style={{ color: theme.error }}>{error}</span>
        </div>
      )}

      {usage && arg && (
        <div className="flex flex-col gap-1.5 px-3 py-2">
          <div className="text-xs">
            <span className="font-bold">{usage.command}</span>
            {usage.args.map((value, i) => (
              <Fragment key={value.name}>
                {" "}
                <span
                  className={i === usage.index ? "font-bold" : undefined}
                  style={{
                    color: i === usage.index ? theme.highlight : theme.subtext,
                  }}
                >
                  {formatArgument(value)}
                </span>
              </Fragment>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Pill color={theme.highlight}>{arg.type}</Pill>
            <span className="font-bold">{arg.name}</span>
            {arg.description && (
              <span className="text-xs" style={{ color: theme.subtext }}>
                {arg.description}
              </span>
            )}
          </div>
        </div>
      )}

      {options.length > 0 && (
        <>
          {hasDetails && (
            <div className="h-px" style={{ background: theme.border }} />
          )}
          <div className="flex flex-col p-1">
            {options.map((option, i) => (
              <div
                key={option.name}
                className="flex items-baseline justify-between rounded px-2 py-[3px]"
                style={{
                  background: i === 0 ? `${theme.surface}cc` : undefined,
                }}
              >
                <span className="flex">
                  <span
                    className="w-[18px] font-bold"
                    style={{ color: theme.highlight, opacity: i === 0 ? 1 : 0 }}
                  >
                    &gt;
                  </span>
                  <span style={{ color: i === 0 ? theme.text : theme.subtext }}>
                    <MatchedName name={option.name} prefix={prefix} />
                  </span>
                </span>
                {option.description && (
                  <span
                    className="pl-8 text-xs"
                    style={{ color: theme.subtext }}
                  >
                    {option.description}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="h-px" style={{ background: theme.border }} />
          <div
            className="flex gap-4 px-3 py-1.5 text-xs"
            style={{ color: theme.subtext }}
          >
            {[
              ["Tab", "complete"],
              ["↑↓", "select"],
              ["Enter", "run"],
            ].map(([key, action]) => (
              <span key={key}>
                <span className="font-bold" style={{ color: theme.text }}>
                  {key}
                </span>{" "}
                {action}
              </span>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function Pill({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="rounded px-1.5 py-px text-xs font-bold"
      style={{ background: color, color: theme.background }}
    >
      {children}
    </span>
  );
}

// e.g. <name: type>, or [name: type] if optional
function formatArgument(arg: Argument) {
  const label = `${arg.name}: ${arg.type}`;
  return arg.optional ? `[${label}]` : `<${label}>`;
}

// characters matching the input are emphasised
function MatchedName({ name, prefix }: { name: string; prefix: string }) {
  const matched = name.toLowerCase().startsWith(prefix.toLowerCase())
    ? prefix.length
    : 0;
  return (
    <>
      <span className="font-bold" style={{ color: theme.highlight }}>
        {name.slice(0, matched)}
      </span>
      {name.slice(matched)}
    </>
  );
}

function HighlightedInput({
  value,
  invalid,
}: {
  value: string;
  invalid: boolean;
}) {
  const space = value.indexOf(" ");
  if (space === -1)
    return <span style={{ color: theme.highlight }}>{value}</span>;

  // the last argument is the one being validated
  const rest = value.slice(space);
  const last = rest.lastIndexOf(" ") + 1;
  return (
    <>
      <span style={{ color: theme.highlight }}>{value.slice(0, space)}</span>
      {/* wrapped in spans, since the parent is a flex container and would drop a bare " " */}
      {invalid ? (
        <>
          <span>{rest.slice(0, last)}</span>
          <span style={{ color: theme.error }}>{rest.slice(last)}</span>
        </>
      ) : (
        <span>{rest}</span>
      )}
    </>
  );
}
