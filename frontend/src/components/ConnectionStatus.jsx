import { motion } from "framer-motion";
import { Wifi, WifiOff, Cpu, RefreshCw, ShieldCheck } from "lucide-react";

/**
 * ConnectionStatus — displays Ollama daemon connectivity and model info.
 * Shows accurate status only after a real health-check response.
 */
export default function ConnectionStatus({ status, model, onRefresh }) {
  const isConnected = status === "connected";
  const isChecking  = status === "checking";
  const isError     = status === "disconnected" || status === "error";

  const statusConfig = {
    connected: {
      label: "Daemon Online",
      dotClass: "connected",
      textColor: "text-emerald-400",
      Icon: Wifi,
      iconColor: "text-emerald-400",
    },
    checking: {
      label: "Probing the void…",
      dotClass: "streaming",
      textColor: "text-amber-400",
      Icon: RefreshCw,
      iconColor: "text-amber-400",
    },
    disconnected: {
      label: "Daemon Offline",
      dotClass: "disconnected",
      textColor: "text-red-400",
      Icon: WifiOff,
      iconColor: "text-red-400",
    },
    error: {
      label: "Connection Error",
      dotClass: "disconnected",
      textColor: "text-red-400",
      Icon: WifiOff,
      iconColor: "text-red-400",
    },
  };

  const cfg = statusConfig[status] ?? statusConfig.disconnected;
  const { label, dotClass, textColor, Icon, iconColor } = cfg;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 text-sm"
    >
      {/* Ollama status */}
      <div className="flex items-center gap-2">
        <span className={`status-dot ${dotClass}`} />
        <Icon
          size={14}
          className={`${iconColor} ${isChecking ? "animate-spin" : ""}`}
        />
        <span className={`font-terminal ${textColor}`}>{label}</span>
      </div>

      {/* Model badge */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
                     bg-emerald-500/10 border border-emerald-500/25"
        >
          <Cpu size={12} className="text-emerald-400" />
          <span className="font-terminal text-emerald-300 text-xs">{model}</span>
        </motion.div>
      )}

      {/* Privacy badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
                      bg-purple-500/10 border border-purple-500/20 hidden sm:flex">
        <ShieldCheck size={12} className="text-purple-400" />
        <span className="font-terminal text-purple-300 text-xs">Local-only</span>
      </div>

      {/* Refresh button */}
      {(isError || status === "disconnected") && (
        <button
          onClick={onRefresh}
          className="btn-ghost btn-secondary px-2 py-1 text-xs"
          title="Re-check Ollama connection"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </motion.div>
  );
}
