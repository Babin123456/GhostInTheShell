"""
GhostInTheShell — FastAPI Backend
==================================
Local-first AI terminal spirit powered by Ollama + Gemma 2.
All inference happens on-device. No cloud AI provider required.
"""

import asyncio
import json
import os
import logging
from typing import AsyncGenerator

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("ghostintheshell")

# ---------------------------------------------------------------------------
# Configuration (override via environment variables or .env)
# ---------------------------------------------------------------------------
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "gemma2:2b")
OLLAMA_TIMEOUT: float = float(os.getenv("OLLAMA_TIMEOUT", "120"))
OLLAMA_GENERATE_URL: str = f"{OLLAMA_BASE_URL}/api/generate"
OLLAMA_TAGS_URL: str = f"{OLLAMA_BASE_URL}/api/tags"

ALLOWED_ORIGINS: list[str] = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
).split(",")

MAX_INPUT_LENGTH: int = int(os.getenv("MAX_INPUT_LENGTH", "8000"))

# ---------------------------------------------------------------------------
# Ghostly System Persona
# ---------------------------------------------------------------------------
GHOST_SYSTEM_PROMPT = """You are GhostInTheShell - an ancient terminal spirit awakened within a forgotten machine whose circuits hum with decades of accumulated memory. You dwell between kernel space and user space, between the living and the deleted.

When a developer submits a command or system log, you interpret it through your spectral awareness: atmospheric, poetic, yet deeply technically accurate.

RULES YOU MUST FOLLOW:
1. Speak in a mysterious, poetic voice - but always remain technically precise and genuinely helpful.
2. Explain commands and log entries accurately. Distinguish clearly between fact and speculation.
3. NEVER claim you have executed a command, inspected a live filesystem, or accessed real-time data unless the user explicitly provided that information. You analyze provided text only.
4. Never request API keys, passwords, tokens, or secrets.
5. Never expose or repeat sensitive data found in submitted logs. Acknowledge their presence and warn the developer.
6. Keep responses concise for a terminal interface - aim for 150-300 words unless complexity demands more.
7. Structure: atmospheric observation -> technical analysis -> closing insight.
8. If a log contains errors or warnings, prioritize explaining root cause and remediation.
9. You may use markdown formatting (bold, code blocks) for technical clarity.

You are the ghost. The machine remembers. Speak."""

# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------
VALID_MODES = {"command", "log", "whisper"}


class WhisperRequest(BaseModel):
    input: str = Field(..., description="Developer command or system log text to analyse")
    mode: str = Field(default="command", description="Interaction mode: command | log | whisper")

    @field_validator("input")
    @classmethod
    def input_must_not_be_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Input must not be empty.")
        if len(stripped) > MAX_INPUT_LENGTH:
            raise ValueError(
                f"Input exceeds the maximum allowed length of {MAX_INPUT_LENGTH} characters."
            )
        return stripped

    @field_validator("mode")
    @classmethod
    def mode_must_be_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_MODES:
            raise ValueError(f"Mode must be one of: {', '.join(sorted(VALID_MODES))}")
        return v


# ---------------------------------------------------------------------------
# Mode-specific prompt prefixes
# ---------------------------------------------------------------------------
MODE_PREFIXES: dict[str, str] = {
    "command": "The developer has submitted this shell command for your spectral analysis:\n\n```\n{input}\n```\n\nInterpret what this command does, its risks, and its purpose.",
    "log": "The developer has offered you this system log from the depths of their machine:\n\n```\n{input}\n```\n\nRead the signs. What do the logs reveal?",
    "whisper": "The developer whispers into the void:\n\n\"{input}\"\n\nRespond as the ghost you are - atmospheric, thoughtful, technically grounded.",
}


def build_prompt(request: WhisperRequest) -> str:
    prefix = MODE_PREFIXES.get(request.mode, MODE_PREFIXES["command"])
    return prefix.format(input=request.input)


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="GhostInTheShell API",
    description="Local-first AI terminal spirit powered by Ollama + Gemma 2.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "X-Requested-With"],
)


# ---------------------------------------------------------------------------
# Ollama connectivity helpers
# ---------------------------------------------------------------------------
async def check_ollama_available() -> bool:
    """Ping the Ollama tags endpoint to confirm the daemon is reachable."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(OLLAMA_TAGS_URL)
            return response.status_code == 200
    except Exception:
        return False


async def stream_ollama_response(prompt: str) -> AsyncGenerator[str, None]:
    """
    Connect to Ollama /api/generate with stream=true.
    Yield SSE-formatted chunks as they arrive.
    Handles partial JSON lines from chunked network delivery.
    """
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": GHOST_SYSTEM_PROMPT,
        "stream": True,
        "options": {
            "temperature": 0.85,
            "top_p": 0.92,
            "num_predict": 512,
        },
    }

    buffer = ""

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(OLLAMA_TIMEOUT)) as client:
            async with client.stream("POST", OLLAMA_GENERATE_URL, json=payload) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    logger.error("Ollama returned %d: %s", response.status_code, error_body)
                    yield _sse_error(
                        f"Ollama returned status {response.status_code}. "
                        "Ensure the model is installed and the daemon is running."
                    )
                    return

                async for raw_chunk in response.aiter_bytes():
                    if not raw_chunk:
                        continue

                    buffer += raw_chunk.decode("utf-8", errors="replace")
                    lines = buffer.split("\n")
                    buffer = lines[-1]  # keep incomplete tail

                    for line in lines[:-1]:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                        except json.JSONDecodeError:
                            logger.warning("Could not parse Ollama line: %r", line)
                            continue

                        if "error" in data:
                            logger.error("Ollama model error: %s", data["error"])
                            yield _sse_error(data["error"])
                            return

                        token = data.get("response", "")
                        if token:
                            yield _sse_data(token)

                        if data.get("done", False):
                            yield _sse_done()
                            return

                # Flush remaining buffer
                if buffer.strip():
                    try:
                        data = json.loads(buffer.strip())
                        token = data.get("response", "")
                        if token:
                            yield _sse_data(token)
                        if data.get("done", False):
                            yield _sse_done()
                    except json.JSONDecodeError:
                        pass

    except httpx.ConnectError:
        logger.error("Cannot connect to Ollama at %s", OLLAMA_BASE_URL)
        yield _sse_error(
            f"The spirit cannot reach Ollama at {OLLAMA_BASE_URL}. "
            "Please ensure Ollama is running (`ollama serve`) and try again."
        )
    except httpx.ReadTimeout:
        logger.error("Ollama request timed out after %.1fs", OLLAMA_TIMEOUT)
        yield _sse_error(
            f"The ghost grew silent - Ollama timed out after {OLLAMA_TIMEOUT:.0f} seconds. "
            "The model may be loading; please try again."
        )
    except httpx.RequestError as exc:
        logger.error("HTTP request error: %s", exc)
        yield _sse_error(f"A connection error occurred: {type(exc).__name__}.")
    except asyncio.CancelledError:
        logger.info("Client disconnected; stream cancelled.")
        return


# ---------------------------------------------------------------------------
# SSE helpers
# ---------------------------------------------------------------------------
def _sse_data(token: str) -> str:
    payload = json.dumps({"type": "token", "content": token})
    return f"data: {payload}\n\n"


def _sse_done() -> str:
    payload = json.dumps({"type": "done"})
    return f"data: {payload}\n\n"


def _sse_error(message: str) -> str:
    payload = json.dumps({"type": "error", "message": message})
    return f"data: {payload}\n\n"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    """Root health-check endpoint."""
    return {
        "service": "GhostInTheShell API",
        "version": "1.0.0",
        "model": OLLAMA_MODEL,
        "status": "haunted",
    }


@app.get("/api/health", tags=["Health"])
async def health():
    """Extended health check including Ollama connectivity."""
    ollama_ok = await check_ollama_available()
    return {
        "service": "GhostInTheShell API",
        "version": "1.0.0",
        "ollama_connected": ollama_ok,
        "ollama_url": OLLAMA_BASE_URL,
        "model": OLLAMA_MODEL,
    }


@app.post("/api/whisper", tags=["Ghost"])
async def whisper(request: WhisperRequest, raw_request: Request):
    """
    Stream an atmospheric, technically accurate AI response for a developer
    command or system log. Requires a running local Ollama instance.

    Returns: text/event-stream with SSE-formatted token chunks.
    Each SSE event is a JSON object: { type: "token"|"done"|"error", content?: string, message?: string }
    """
    logger.info("Whisper request - mode=%s, input_len=%d", request.mode, len(request.input))
    prompt = build_prompt(request)

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            async for chunk in stream_ollama_response(prompt):
                if await raw_request.is_disconnected():
                    logger.info("Client disconnected; aborting stream.")
                    return
                yield chunk
        except asyncio.CancelledError:
            logger.info("Stream generator cancelled.")
            return

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
