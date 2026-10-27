import { motion } from "framer-motion";
import { Ghost, Terminal, Sparkles, Activity } from "lucide-react";
import ConnectionStatus from "./ConnectionStatus";

/**
 * TerminalHeader — the top bar of the terminal window.
 * Displays branding, connection status, and inference activity.
 */
export default function TerminalHeader({
  connectionStatus,
  model,
  isStreaming,
  onRefreshConnection,
}) {
  return (
    <div className="glass border-b border-white/5 rounded-t-2xl">
      {/* macOS-style traffic lights */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 text-center">
          <span className="font-terminal text-xs text-slate-500">
            ghost-in-the-shell — bash — 80x24
          </span>
        </div>
      </div>

      {/* Main header content */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4">
        {/* Branding */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-purple-500/20
                            border border-teal-500/30 flex items-center justify-center glow-teal">
              <Ghost size={20} className="text-teal-400 animate-float" />
            </div>
            {isStreaming && (
              <motion.div
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400
                           border-2 border-slate-900 flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="neon-teal font-terminal">Ghost</span>
              <span className="text-slate-300 font-terminal">InTheShell</span>
            </h1>
            <p className="text-xs text-slate-500 font-terminal">
              v1.0.0 · open-weight · offline-first
            </p>
          </div>
        </motion.div>

        {/* Right: status row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Inference indicator */}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-3 py-1 rounded-full
                         bg-amber-500/10 border border-amber-500/25"
            >
              <Activity size={13} className="text-amber-400 animate-pulse" />
              <span className="font-terminal text-amber-300 text-xs">Generating…</span>
            </motion.div>
          )}

          <ConnectionStatus
            status={connectionStatus}
            model={model}
            onRefresh={onRefreshConnection}
          />
        </div>
      </div>
    </div>
  );
}
