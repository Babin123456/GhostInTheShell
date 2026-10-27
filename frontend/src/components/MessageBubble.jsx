import { motion } from "framer-motion";
import { Ghost, Terminal, AlertTriangle, Sparkles } from "lucide-react";

/**
 * MessageBubble — renders a single conversation entry.
 * Handles user messages, streaming ghost responses, completed responses, and errors.
 */
export default function MessageBubble({ message }) {
  const { role, content, mode, isStreaming, isError, timestamp } = message;

  const modeLabels = { command: "COMMAND", log: "LOG", whisper: "WHISPER" };
  const modeColors = {
    command: "text-teal-400 border-teal-400/30 bg-teal-400/5",
    log: "text-purple-400 border-purple-400/30 bg-purple-400/5",
    whisper: "text-amber-400 border-amber-400/30 bg-amber-400/5",
  };

  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      })
    : "";

  if (role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex gap-3 items-start"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-600/30
                        flex items-center justify-center mt-0.5">
          <Terminal size={15} className="text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-terminal text-xs text-slate-500">dev@ghost</span>
            {mode && (
              <span className={`font-terminal text-[10px] px-1.5 py-0.5 rounded border ${modeColors[mode] ?? modeColors.command}`}>
                {modeLabels[mode] ?? mode.toUpperCase()}
              </span>
            )}
            <span className="font-terminal text-xs text-slate-600">{time}</span>
          </div>
          <div className="glass rounded-xl rounded-tl-sm px-4 py-3 border-white/5">
            <pre className="font-terminal text-sm text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
              <span className="prompt-symbol">❯ </span>{content}
            </pre>
          </div>
        </div>
      </motion.div>
    );
  }

  // Ghost (assistant) message
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-3 items-start"
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5
                       ${isError
                         ? "bg-red-500/10 border border-red-500/30"
                         : "bg-teal-500/10 border border-teal-500/25 glow-teal"}`}>
        {isError
          ? <AlertTriangle size={15} className="text-red-400" />
          : <Ghost size={15} className="text-teal-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`font-terminal text-xs ${isError ? "text-red-400" : "neon-teal"}`}>
            {isError ? "system.error" : "ghost.spirit"}
          </span>
          {isStreaming && (
            <motion.div
              className="flex items-center gap-1"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <Sparkles size={11} className="text-amber-400" />
              <span className="font-terminal text-[10px] text-amber-400">channeling…</span>
            </motion.div>
          )}
          <span className="font-terminal text-xs text-slate-600">{time}</span>
        </div>
        <div className={`glass rounded-xl rounded-tl-sm px-4 py-3 ghost-response
                         ${isError ? "border-red-500/20 bg-red-500/5" : "border-teal-500/10"}`}>
          {content ? (
            <div className="font-terminal text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
              {content}
              {isStreaming && <span className="cursor-blink ml-0.5" />}
            </div>
          ) : (
            isStreaming && (
              <div className="flex items-center gap-2">
                <motion.div
                  className="flex gap-1"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {[0, 0.2, 0.4].map((delay) => (
                    <div
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full bg-teal-400"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </motion.div>
                <span className="font-terminal text-xs text-slate-500">
                  The ghost stirs in the machine…
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
