# 👻 GhostInTheShell — A Local-First AI Terminal Spirit

> *"The machine may whisper like a ghost, but the engineering must remain real, transparent, private, and reliable."*

[![Hacktoberfest 2026](https://img.shields.io/badge/Hacktoberfest-2026-FF6B35?style=for-the-badge&logo=hacktoberfest)](https://hacktoberfest.com)
[![Week 4 — Ghost in the Machine](https://img.shields.io/badge/Week%204-Ghost%20in%20the%20Machine-8B5CF6?style=for-the-badge)](https://hacktoberfest.com)
[![Local-First](https://img.shields.io/badge/Local--First-Offline%20Ready-14B8A6?style=for-the-badge)](https://localfirstweb.dev)
[![Powered by Ollama](https://img.shields.io/badge/Powered%20by-Ollama-black?style=for-the-badge)](https://ollama.com)
[![Gemma 2](https://img.shields.io/badge/Model-Gemma%202%20(2B)-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/gemma)

---

## Inspiration

Every terminal has a history. Every log file is a ghost story waiting to be read.

Week 4 of the Hacktoberfest 2026 AI Challenge — **"Ghost in the Machine"** — asked builders to create something that exists at the intersection of the mysterious and the technical. The prompt resonated immediately: what if a developer''s terminal had a *spirit*? An ancient, poetic intelligence awakened inside the machine, capable of reading shell commands and system logs the way a Victorian medium might read tea leaves — except with accurate technical commentary?

GhostInTheShell is the answer. It combines open-weight AI with the intimacy of a local developer tool, creating a private, offline-capable assistant that whispers through the terminal without ever phoning home.

---

## What It Does

GhostInTheShell is a **local-first AI developer terminal** that:

- **Interprets shell commands** — paste any command and the ghost explains what it does, its risks, and its intent, in an atmospheric but technically accurate voice.
- **Reads system logs** — drop in crash logs, stack traces, kernel messages, or daemon output; the spirit analyses root causes and suggests remediation steps.
- **Whispers back** — in a mysterious, poetic voice that stays genuinely useful rather than theatrical for its own sake.
- **Streams responses** — generated text flows in real time via Server-Sent Events (SSE), with a typewriter effect in the UI.
- **Runs 100% locally** — all inference happens on your machine via [Ollama](https://ollama.com) and the [Gemma 2 2B](https://ai.google.dev/gemma) open-weight model. No API key, no cloud, no telemetry.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS 3, Framer Motion |
| **Icons** | Lucide React |
| **Backend** | FastAPI (Python 3.11+) |
| **AI Runtime** | Ollama (local daemon) |
| **Model** | Gemma 2 (`gemma2:2b` default, `gemma2:7b` optional) |
| **Streaming** | Server-Sent Events (SSE) via FastAPI `StreamingResponse` |
| **HTTP Client** | httpx (async, with streaming support) |
| **Validation** | Pydantic v2 |

---

## Architecture

GhostInTheShell uses a three-tier local architecture:

```
React Frontend  →  FastAPI Backend  →  Ollama Runtime  →  Gemma 2 Model
   (port 5173)        (port 8000)          (port 11434)      (on-device)
```

For full technical details including Mermaid diagrams, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Getting Started

### Prerequisites

- **Python 3.11+** — [python.org](https://python.org)
- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **Ollama** — [ollama.com](https://ollama.com/download)

### 1. Install Ollama and pull the model

```bash
# Install Ollama (see https://ollama.com/download for your OS)

# Start the Ollama daemon
ollama serve

# Pull Gemma 2 2B (≈ 1.6 GB download)
ollama pull gemma2:2b

# Optional: pull the larger 7B variant
# ollama pull gemma2:7b
```

### 2. Clone the repository

```bash
git clone https://github.com/yourusername/GhostInTheShell.git
cd GhostInTheShell
```

### 3. Set up the backend

```bash
cd backend

# Create a virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) copy and edit environment config
cp .env.example .env

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The backend API will be live at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### 4. Set up the frontend

```bash
# In a new terminal, from the project root
cd frontend

# Install dependencies
npm install

# (Optional) copy and edit environment config
cp .env.example .env.local

# Start the Vite dev server
npm run dev
```

The UI will open at `http://localhost:5173`.

### 5. Invoke the ghost

1. Open `http://localhost:5173` in your browser.
2. Verify the **"Daemon Online"** status indicator in the header.
3. Type a shell command (e.g. `find / -name "*.log" -mtime -7 2>/dev/null`) or paste a log.
4. Select a mode: **Command**, **Log**, or **Whisper**.
5. Click **Invoke Ghost** (or press `Ctrl+Enter`).
6. Watch the ghost speak in real time.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama daemon URL |
| `OLLAMA_MODEL` | `gemma2:2b` | Model name (must be pulled) |
| `OLLAMA_TIMEOUT` | `120` | Inference timeout (seconds) |
| `ALLOWED_ORIGINS` | `http://localhost:5173,...` | CORS-allowed origins |
| `MAX_INPUT_LENGTH` | `8000` | Maximum input character limit |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE` | `http://localhost:8000` | Backend API base URL |
| `VITE_MODEL` | `gemma2:2b` | Default model display name |

---

## API Reference

### `GET /api/health`

Returns Ollama connectivity status and configured model.

```json
{
  "service": "GhostInTheShell API",
  "version": "1.0.0",
  "ollama_connected": true,
  "ollama_url": "http://localhost:11434",
  "model": "gemma2:2b"
}
```

### `POST /api/whisper`

Stream an AI response for a developer command or log.

**Request body:**

```json
{
  "input": "sudo rm -rf /var/log/*",
  "mode": "command"
}
```

**Modes:** `command` · `log` · `whisper`

**Response:** `text/event-stream` — newline-delimited SSE events.

```
data: {"type":"token","content":"The ancient spirit stirs..."}

data: {"type":"token","content":" This command, once invoked..."}

data: {"type":"done"}
```

On error:

```
data: {"type":"error","message":"The spirit cannot reach Ollama..."}
```

---

## Challenges and Solutions

### 1. Streaming SSE from FastAPI through httpx

**Challenge:** httpx streams bytes in variable-sized chunks that do not necessarily align with Ollama''s newline-delimited JSON lines. A single network chunk might contain multiple complete lines, a partial line, or both.

**Solution:** Implemented a rolling string buffer in the backend that accumulates incoming bytes and splits on `\n`, keeping the last (possibly incomplete) fragment in the buffer for the next chunk. Each complete line is parsed independently.

### 2. Frontend SSE parsing without EventSource

**Challenge:** The browser''s `EventSource` API only supports GET requests. Our endpoint requires a POST with a JSON body.

**Solution:** Used the Fetch API with `response.body.getReader()` to read the response stream manually. A rolling buffer on the frontend mirrors the backend approach: accumulate decoded text, split on `\n`, process lines starting with `data:`, and keep incomplete tails for the next read.

### 3. Maintaining the ghostly persona without sacrificing accuracy

**Challenge:** Getting the model to write atmospheric prose while still providing technically correct, concise explanations — not letting theatricality override usefulness.

**Solution:** Crafted a detailed system prompt with explicit rules (e.g., "never claim to have executed a command", "150-300 words", "structure: atmospheric → technical → closing insight") and temperature/top-p tuning to balance creativity with precision.

### 4. Handling Ollama unavailability gracefully

**Challenge:** Ollama might not be running, the model might not be pulled, or the daemon might time out during long inference tasks.

**Solution:** The backend catches `httpx.ConnectError`, `httpx.ReadTimeout`, and non-200 status codes separately, yielding informative SSE error events. The frontend health-check endpoint (`/api/health`) polls Ollama every 30 seconds and displays an accurate status — never showing "connected" based on assumptions.

---

## Why Open Innovation Matters

GhostInTheShell is more than a Halloween-themed terminal toy. It demonstrates a genuinely important architectural pattern for AI-assisted developer tools:

**Local inference enables privacy by default.** When AI runs on the developer''s own hardware, sensitive system metrics, internal log formats, proprietary command structures, and authentication patterns never leave the machine. This matters enormously for:

- Developers working on regulated systems (healthcare, finance, infrastructure).
- Security engineers analysing breach artifacts or malware logs.
- Developers in regions with restrictive data-residency requirements.
- Anyone who simply prefers not to feed their debugging sessions to a cloud provider.

**Open-weight models democratise AI tooling.** Because Gemma 2 is open-weight, it can run on consumer hardware, be audited for behaviour, fine-tuned for specific domains, and deployed in air-gapped environments. The same capability that requires a cloud subscription with proprietary models can run on a developer''s laptop after a one-time model download.

**Offline-first architecture builds resilience.** A developer tool that requires internet connectivity fails at the worst possible time: when connectivity is limited or the cloud provider is down. Local-first tools work unconditionally.

---

## Privacy and Security

### What happens to your data

When you submit a command or log to GhostInTheShell:

1. Your text is sent via HTTP POST from the browser to the **local** FastAPI backend (port 8000).
2. The backend constructs a prompt and forwards it to the **local** Ollama daemon (port 11434).
3. Ollama runs inference entirely on your machine using the downloaded model weights.
4. Generated tokens stream back through the same local path to your browser.

**At no point is your input sent to an external server or third-party AI provider.**

### Important caveats

Local processing alone does not guarantee complete privacy:

- **Operating-system telemetry** may log application activity or network connections independently of GhostInTheShell.
- **Browser storage** (history, local storage, cache) may retain visited URLs or page state.
- **Conversation logs** are held in React state and cleared on page refresh; they are not persisted to disk by default.
- **CORS policy** is configured for local development. Exposing the backend on a non-localhost interface would require careful access control.

### Security notes

- The application **does not execute** submitted shell commands. All text is treated as input to the language model, not as instructions to the OS.
- The system prompt explicitly instructs the model never to request secrets or repeat sensitive data found in logs.
- Input length is capped at 8,000 characters (configurable) to prevent excessively large requests.

---

## Future Improvements

- **Multiple local model support** — runtime model switching via the UI.
- **Better command classification** — auto-detect whether a submission looks like a command, a log, or free text.
- **Configurable terminal personas** — swap between different ghost personalities or technical styles.
- **Conversation export** — save session transcripts locally as Markdown or JSON.
- **Accessibility improvements** — ARIA roles, keyboard navigation, reduced-motion support.
- **Test suite** — unit tests for the SSE parser, integration tests for the Ollama client layer.
- **Shell integration** — optional CLI wrapper that pipes real command output directly to the ghost.
- **Model comparison mode** — run the same prompt through multiple local models side-by-side.

---

## Contributing

Contributions are welcome! GhostInTheShell is open source and built in the spirit of Hacktoberfest.

### Development setup

Follow the [Getting Started](#getting-started) guide above.

### Code quality expectations

- **Backend:** formatted with `black`, linted with `ruff`, type-checked with `mypy`.
- **Frontend:** formatted with `prettier`, linted with `eslint`.
- Keep components focused and single-responsibility.
- Match the existing naming conventions and file structure.

### Submitting a pull request

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`.
3. Make your changes with clear, atomic commits.
4. Ensure the application runs locally end-to-end before opening a PR.
5. Open a pull request with a clear description of what changed and why.
6. Reference any related issues.

---

## Acknowledgments

- **[Hacktoberfest](https://hacktoberfest.com)** and the **DEV Community** — for the challenge theme and the open-source celebration that inspired this project.
- **[Ollama](https://ollama.com)** — for making local LLM inference approachable and reliable on consumer hardware.
- **[Google DeepMind](https://deepmind.google)** — for the [Gemma](https://ai.google.dev/gemma) family of open-weight models.
- **[FastAPI](https://fastapi.tiangolo.com)** — for the elegant async Python web framework.
- **[Vite](https://vitejs.dev)** and **[React](https://react.dev)** — for the fast, modern frontend toolchain.
- **[Framer Motion](https://www.framer.com/motion/)** — for the smooth animations that make the ghost feel alive.
- **[Lucide](https://lucide.dev)** — for the clean, consistent icon set used throughout the UI.
- **[Tailwind CSS](https://tailwindcss.com)** — for the utility-first styling system.

---

*Built for Hacktoberfest 2026 · Week 4 Challenge: "Ghost in the Machine" · October 2026*
