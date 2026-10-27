import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Flame, History } from "lucide-react";

const MODE_OPTIONS = [
  { value: "command", label: "Command", description: "Analyse a shell command" },
  { value: "log",     label: "Log",     description: "Read system logs" },
  { value: "whisper", label: "Whisper", description: "Speak into the void" },
];

/**
 * TerminalInput — text area + mode selector + submit controls.
 */
export default function TerminalInput({
  value,
  onChange,
  mode,
  onModeChange,
  onSubmit,
  isDisabled,
  connectionStatus,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!isDisabled) onSubmit();
      }
    },
    [isDisabled, onSubmit]
  );

  const isOffline = connectionStatus === "disconnected" || connectionStatus === "error";
  const canSubmit = !isDisabled && value.trim().length > 0;

  return (
    <div className="glass rounded-2xl p-4 border-white/5 space-y-3">
      {/* Mode selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-terminal text-xs text-slate-500 uppercase tracking-wider">Mode:</span>
        <div className="flex gap-1">
          {MODE_OPTIONS.map(({ value: v, label }) => (
            <button
              key={v}
              onClick={() => onModeChange(v)}
              className={`font-terminal text-xs px-3 py-1 rounded-lg border transition-all duration-200
                ${mode === v
                  ? "bg-teal-500/15 border-teal-500/40 text-teal-300"
                  : "bg-white/3 border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="font-terminal text-xs text-slate-600 ml-auto hidden sm:block">
          Ctrl + Enter to submit
        </span>
      </div>

      {/* Textarea */}
      <div className="relative">
        <span className="absolute top-3 left-3 font-terminal text-teal-400/60 text-sm select-none pointer-events-none">
          ❯
        </span>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={
            mode === "command"
              ? "Enter a shell command to interpret… (e.g. find / -name '*.log' -mtime -7)"
              : mode === "log"
              ? "Paste a system log, stack trace, or error output…"
              : "Whisper something into the terminal void…"
          }
          className="ghost-input w-full pl-8 pr-4 pt-3 pb-3 min-h-[80px] max-h-[240px]
                     disabled:opacity-40 disabled:cursor-not-allowed"
          rows={3}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isOffline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-xs font-terminal text-red-400"
            >
              <Flame size={12} />
              Ollama offline — start with: ollama serve
            </motion.div>
          )}
          {value.length > 0 && (
            <span className="font-terminal text-xs text-slate-600">
              {value.length.toLocaleString()} chars
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSubmit}
            disabled={!canSubmit}
            className="btn-ghost btn-primary flex items-center gap-2"
          >
            <Send size={15} />
            <span>Invoke Ghost</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
