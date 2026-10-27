import { motion, AnimatePresence } from "framer-motion";
import { History, Terminal, X, ChevronRight } from "lucide-react";

/**
 * CommandHistory — a collapsible sidebar panel showing previous inputs.
 */
export default function CommandHistory({ history, onRestore, onClear, isVisible, onToggle }) {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
        className="glass rounded-2xl border-white/5 p-4 space-y-3 h-full overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <History size={15} className="text-purple-400" />
            <span className="font-terminal text-sm text-slate-300 font-medium">History</span>
            <span className="font-terminal text-xs text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">
              {history.length}
            </span>
          </div>
          <div className="flex gap-1">
            {history.length > 0 && (
              <button
                onClick={onClear}
                className="btn-ghost btn-danger px-2 py-1 text-xs"
                title="Clear history"
              >
                <X size={12} />
              </button>
            )}
            <button
              onClick={onToggle}
              className="btn-ghost btn-secondary px-2 py-1"
              title="Hide history"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-600">
              <Terminal size={24} className="opacity-30" />
              <span className="font-terminal text-xs text-center">
                No history yet.{"\n"}Invoke the ghost to begin.
              </span>
            </div>
          ) : (
            [...history].reverse().map((entry, idx) => (
              <motion.button
                key={entry.id ?? idx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onRestore(entry)}
                className="w-full text-left px-3 py-2 rounded-lg border border-white/5
                           bg-white/2 hover:bg-white/5 hover:border-teal-500/20
                           transition-all duration-200 group"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-terminal text-[10px] px-1 py-0.5 rounded border
                    ${entry.mode === "log"
                      ? "text-purple-400 border-purple-400/30 bg-purple-400/5"
                      : entry.mode === "whisper"
                      ? "text-amber-400 border-amber-400/30 bg-amber-400/5"
                      : "text-teal-400 border-teal-400/30 bg-teal-400/5"
                    }`}>
                    {entry.mode?.toUpperCase()}
                  </span>
                  <ChevronRight
                    size={10}
                    className="text-slate-600 group-hover:text-teal-400 transition-colors ml-auto"
                  />
                </div>
                <p className="font-terminal text-xs text-slate-400 truncate leading-relaxed">
                  {entry.input}
                </p>
              </motion.button>
            ))
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
