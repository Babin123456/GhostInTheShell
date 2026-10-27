import { useState, useEffect, useRef, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  History,
  Lock,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

import TerminalHeader   from "./components/TerminalHeader";
import TerminalInput    from "./components/TerminalInput";
import MessageBubble    from "./components/MessageBubble";
import CommandHistory   from "./components/CommandHistory";

// ─── Constants ───────────────────────────────────────────────────────────────
const API_BASE        = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
const WHISPER_URL     = `${API_BASE}/api/whisper`;
const HEALTH_URL      = `${API_BASE}/api/health`;
const DEFAULT_MODEL   = import.meta.env.VITE_MODEL ?? "gemma2:2b";
const HEALTH_INTERVAL = 30_000; // ms

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  // Connection
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [model, setModel]                       = useState(DEFAULT_MODEL);

  // Conversation
  const [messages,       setMessages]       = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);

  // Input
  const [inputValue, setInputValue] = useState("");
  const [mode,       setMode]       = useState("command");

  // Streaming
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  // UI
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);

  // ── Scroll to bottom whenever messages update ─────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Health check ─────────────────────────────────────────────────────────
  const checkHealth = useCallback(async () => {
    setConnectionStatus("checking");
    try {
      const res  = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(6000) });
      const data = await res.json();
      if (data.ollama_connected) {
        setConnectionStatus("connected");
        setModel(data.model ?? DEFAULT_MODEL);
      } else {
        setConnectionStatus("disconnected");
      }
    } catch {
      setConnectionStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, HEALTH_INTERVAL);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsgId  = uid();
    const ghostMsgId = uid();
    const timestamp  = Date.now();

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: trimmed, mode, timestamp },
      { id: ghostMsgId, role: "ghost", content: "", mode, isStreaming: true, timestamp: Date.now() },
    ]);

    // Add to command history
    setCommandHistory((prev) => [
      ...prev,
      { id: userMsgId, input: trimmed, mode, timestamp },
    ]);

    setInputValue("");
    setIsStreaming(true);

    try {
      const res = await fetch(WHISPER_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body:    JSON.stringify({ input: trimmed, mode }),
        signal:  controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server responded ${res.status}: ${errText}`);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines[lines.length - 1]; // keep incomplete tail

        for (const line of lines.slice(0, -1)) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data:")) continue;

          const jsonStr = trimmedLine.slice(5).trim();
          if (!jsonStr) continue;

          let event;
          try { event = JSON.parse(jsonStr); }
          catch { continue; }

          if (event.type === "token") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === ghostMsgId
                  ? { ...m, content: m.content + event.content }
                  : m
              )
            );
          } else if (event.type === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === ghostMsgId ? { ...m, isStreaming: false } : m
              )
            );
            setIsStreaming(false);
            return;
          } else if (event.type === "error") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === ghostMsgId
                  ? { ...m, content: event.message, isStreaming: false, isError: true }
                  : m
              )
            );
            setIsStreaming(false);
            return;
          }
        }
      }

      // Stream ended without explicit "done"
      setMessages((prev) =>
        prev.map((m) =>
          m.id === ghostMsgId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err) {
      if (err.name === "AbortError") return;

      const errMsg =
        err.message?.includes("fetch")
          ? "Cannot reach the backend. Is the FastAPI server running on port 8000?"
          : err.message ?? "An unexpected error occurred.";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === ghostMsgId
            ? { ...m, content: errMsg, isStreaming: false, isError: true }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [inputValue, mode, isStreaming]);

  // ── Clear conversation ────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
  }, []);

  // ── Restore from history ──────────────────────────────────────────────────
  const handleRestore = useCallback((entry) => {
    setInputValue(entry.input);
    setMode(entry.mode);
    setShowHistory(false);
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "#050a0e" }}>
      {/* Aurora background */}
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
      </div>

      {/* Layout */}
      <div className="relative z-10 flex flex-col min-h-screen max-w-7xl mx-auto w-full px-4 py-6 gap-4">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-1"
        >
          <p className="font-terminal text-xs text-slate-600 uppercase tracking-widest">
            Hacktoberfest 2026 · Ghost in the Machine · Week 4
          </p>
        </motion.div>

        {/* Main terminal window */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 flex flex-col rounded-2xl overflow-hidden glow-teal"
          style={{ minHeight: "calc(100vh - 180px)" }}
        >
          {/* Header */}
          <TerminalHeader
            connectionStatus={connectionStatus}
            model={model}
            isStreaming={isStreaming}
            onRefreshConnection={checkHealth}
          />

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* History sidebar */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  key="sidebar"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0 border-r border-white/5 overflow-hidden"
                >
                  <div className="w-[280px] h-full p-3">
                    <CommandHistory
                      history={commandHistory}
                      onRestore={handleRestore}
                      onClear={() => setCommandHistory([])}
                      isVisible={true}
                      onToggle={() => setShowHistory(false)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "rgba(5,10,14,0.55)" }}>
              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className={`btn-ghost btn-secondary px-2.5 py-1.5 text-xs ${showHistory ? "border-teal-500/30 text-teal-400" : ""}`}
                  title="Toggle command history"
                >
                  <History size={13} />
                  <span className="hidden sm:inline">History</span>
                </button>

                <div className="flex-1" />

                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/8 border border-purple-500/15">
                  <Lock size={11} className="text-purple-400" />
                  <span className="font-terminal text-[10px] text-purple-300">100% local inference</span>
                </div>

                <button
                  onClick={handleClear}
                  disabled={messages.length === 0 && !isStreaming}
                  className="btn-ghost btn-danger px-2.5 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Clear terminal"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <AnimatePresence initial={false}>
                  {messages.length === 0 && (
                    <motion.div
                      key="welcome"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6 text-center px-4"
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/15 to-purple-500/15
                                   border border-teal-500/25 flex items-center justify-center glow-teal"
                      >
                        <Sparkles size={36} className="text-teal-400" />
                      </motion.div>
                      <div className="space-y-2 max-w-sm">
                        <h2 className="font-terminal text-xl font-bold neon-teal">
                          The machine awaits.
                        </h2>
                        <p className="font-terminal text-sm text-slate-500 leading-relaxed">
                          Submit a shell command, paste system logs, or whisper into the void.
                          The ghost will interpret, illuminate, and warn.
                        </p>
                        <p className="font-terminal text-xs text-slate-600 mt-3">
                          All inference runs locally via Ollama · Zero cloud dependency
                        </p>
                      </div>
                      {connectionStatus === "disconnected" && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 px-4 py-3 rounded-xl
                                     bg-red-500/8 border border-red-500/20 text-left max-w-sm"
                        >
                          <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="font-terminal text-xs text-red-300 font-medium">
                              Ollama daemon not detected
                            </p>
                            <p className="font-terminal text-xs text-slate-500">
                              Run <code className="text-teal-400 bg-black/30 px-1 rounded">ollama serve</code> and{" "}
                              <code className="text-teal-400 bg-black/30 px-1 rounded">ollama pull gemma2:2b</code> to awaken the ghost.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-white/5 p-4">
                <TerminalInput
                  value={inputValue}
                  onChange={setInputValue}
                  mode={mode}
                  onModeChange={setMode}
                  onSubmit={handleSubmit}
                  isDisabled={isStreaming}
                  connectionStatus={connectionStatus}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center font-terminal text-xs text-slate-700"
        >
          GhostInTheShell · Powered by Ollama + Gemma 2 · Your data never leaves this machine
        </motion.p>
      </div>
    </div>
  );
}
