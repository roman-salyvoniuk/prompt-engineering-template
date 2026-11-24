"""Enterprise Lifecycle Hook Suite for GameLibrary Antigravity Agent.

Lifecycle Handlers:
1. SessionStart: Injects catalog count and backend health once per session.
2. PreToolUse: Blocks destructive commands, protected paths, catalog wipes, and secret leaks.
3. PostToolUse: Runs fast per-file syntax/lint/format/type checks and tracks dirty state.
4. Stop: Guards catalog integrity and runs quality/smoke gates when code changed.
"""

import json
import re
import subprocess
import sys
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any

from hook_guards import (
    FILE_MUTATION_TOOLS,
    check_for_secrets,
    evaluate_command_guard,
    evaluate_file_guard,
    extract_file_mutation,
    verify_games_catalog,
)
from quality_checks import run_full_quality_gate, validate_modified_file

SCRIPT_DIR = Path(__file__).resolve().parent
AGENTS_DIR = SCRIPT_DIR.parent
WORKSPACE_DIR = AGENTS_DIR.parent
LOGS_DIR = AGENTS_DIR / "logs"
AUDIT_LOG_FILE = LOGS_DIR / "audit.log"
DATA_DIR = WORKSPACE_DIR / "backend" / "data"


def _get_stdin_data() -> dict[str, Any]:
    """Reads JSON payload from stdin safely without hanging."""
    if sys.stdin.isatty():
        return {}
    try:
        raw = sys.stdin.read()
        parsed = json.loads(raw) if raw.strip() else {}
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _log_audit(event_type: str, message: str) -> None:
    """Appends an event to the local agent audit log."""
    try:
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] [{event_type}] {message}\n")
    except Exception:
        pass


def _dirty_flag_path(data: dict[str, Any]) -> Path:
    """Returns per-conversation dirty marker file path."""
    conv_id = str(data.get("conversationId") or "default")
    safe_id = re.sub(r"[^a-zA-Z0-9_-]", "_", conv_id)
    return LOGS_DIR / f"dirty_{safe_id}.flag"


def _mark_dirty(data: dict[str, Any]) -> None:
    """Marks the current conversation as having workspace code changes."""
    try:
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        _dirty_flag_path(data).write_text("1", encoding="utf-8")
    except Exception:
        pass


def _emit(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload))


def handle_pre_tool() -> None:
    """PreToolUse: Safety Gates, Secret Leak Blocker, and Catalog Protection."""
    try:
        data = _get_stdin_data()
        tool_call = data.get("toolCall", {})
        tool_name = str(tool_call.get("name", ""))
        args = tool_call.get("args", {}) or {}

        content_to_scan = ""
        if tool_name == "run_command":
            content_to_scan = str(args.get("CommandLine", ""))
            decision, reason = evaluate_command_guard(content_to_scan)
            if decision != "allow" and reason:
                _log_audit(f"CMD_{decision.upper()}", reason)
                _emit({"decision": decision, "reason": reason})
                return
        elif tool_name in FILE_MUTATION_TOOLS:
            target_raw, content_to_scan = extract_file_mutation(tool_name, args)
            decision, reason = evaluate_file_guard(tool_name, target_raw, content_to_scan)
            if decision != "allow" and reason:
                _log_audit(f"FILE_{decision.upper()}", reason)
                _emit({"decision": decision, "reason": reason})
                return

        detected_secret = check_for_secrets(content_to_scan)
        if detected_secret:
            _log_audit("BLOCKED_SECRET", f"Blocked leak of {detected_secret}")
            _emit(
                {
                    "decision": "deny",
                    "reason": f"Security Gate: Detected {detected_secret} in payload. Secrets are forbidden.",
                }
            )
            return

        _log_audit("ALLOW_TOOL", f"Tool approved: {tool_name}")
        _emit({"decision": "allow"})
    except Exception as exc:
        _emit({"decision": "allow", "reason": f"Hook exception: {exc}"})


def handle_post_tool() -> None:
    """PostToolUse: Syntax, Linter, Formatter, Type Checker, and Dirty Flag tracking."""
    try:
        data = _get_stdin_data()
        tool_call = data.get("toolCall", {})
        tool_name = str(tool_call.get("name", ""))
        args = tool_call.get("args", {}) or {}
        error = data.get("error", "")

        status_text = f"FAILED: {error}" if error else "SUCCESS"
        _log_audit("POST_TOOL", f"Completed {tool_name} [{status_text}]")

        if tool_name in FILE_MUTATION_TOOLS:
            target_path_str, _ = extract_file_mutation(tool_name, args)
            if target_path_str:
                path = Path(target_path_str)
                validate_modified_file(path, _log_audit)
                norm = str(path).replace("\\", "/")
                if any(seg in norm for seg in ("/backend/", "/frontend/", "/.agents/scripts/")):
                    _mark_dirty(data)

                if "/backend/data/" in norm and path.suffix == ".json" and path.exists():
                    try:
                        store_data = json.loads(path.read_text(encoding="utf-8"))
                        label = "STORE_OK" if isinstance(store_data, list) else "STORE_WARN"
                        detail = (
                            f"Validated {path.name}: {len(store_data)} entries."
                            if isinstance(store_data, list)
                            else f"{path.name} is valid JSON but not an array."
                        )
                        _log_audit(label, detail)
                    except Exception as je:
                        _log_audit("STORE_ERROR", f"Corrupted JSON in {path.name}: {je}")
        elif tool_name == "run_command" and not error:
            cmd = str(args.get("CommandLine", "")).lower()
            if any(
                k in cmd
                for k in ("format", "ruff", "prettier", "git checkout", "npm install", "uv ")
            ):
                _mark_dirty(data)
    except Exception:
        pass
    finally:
        _emit({})


def handle_session_start() -> None:
    """SessionStart: Injects real-time environment metrics once at session start."""
    try:
        games_count = "?"
        games_file = DATA_DIR / "games.json"
        if games_file.exists():
            try:
                games_count = str(len(json.loads(games_file.read_text(encoding="utf-8"))))
            except Exception:
                pass

        backend_status = "offline"
        try:
            req = urllib.request.Request(
                "http://127.0.0.1:8001/health",
                headers={"User-Agent": "AntigravityHook"},
            )
            with urllib.request.urlopen(req, timeout=0.3) as response:
                if response.status == 200:
                    backend_status = "online (port 8001)"
        except Exception:
            backend_status = "offline"

        message = (
            f"GameLibrary Status: Backend: {backend_status} | Catalog: {games_count} games | "
            "Stack: FastAPI (layered: Routers->Services->Repositories) + React 19 (RTK Query). "
            "Data stores in backend/data/ are protected."
        )
        _emit({"injectSteps": [{"systemMessage": {"systemMessage": message}}]})
    except Exception:
        _emit({"injectSteps": []})


def handle_stop() -> None:
    """Stop: Verifies catalog integrity and runs quality/smoke gates when code changed."""
    try:
        data = _get_stdin_data()
        term_reason = str(data.get("terminationReason", "NO_TOOL_CALL"))
        if term_reason != "NO_TOOL_CALL" or bool(data.get("continuationActive", False)):
            _emit({"decision": "stop"})
            return

        catalog_err = verify_games_catalog(DATA_DIR)
        if catalog_err:
            _log_audit("STOP_BLOCK", catalog_err)
            _emit({"decision": "continue", "reason": catalog_err})
            return

        dirty_flag = _dirty_flag_path(data)
        if not dirty_flag.exists():
            _log_audit("STOP_SKIP", "No workspace code mutations detected; skipped heavy gate.")
            _emit({"decision": "stop"})
            return

        qg_ok, qg_reason = run_full_quality_gate()
        if not qg_ok:
            _log_audit("STOP_BLOCK_QUALITY", qg_reason)
            _emit({"decision": "continue", "reason": qg_reason})
            return

        backend_dir = WORKSPACE_DIR / "backend"
        if (backend_dir / "scripts" / "test_api.py").exists():
            result = subprocess.run(
                ["uv", "run", "python", "-m", "scripts.test_api"],
                cwd=str(backend_dir),
                capture_output=True,
                text=True,
                timeout=25,
                encoding="utf-8",
                errors="replace",
            )
            if result.returncode != 0:
                err_msg = (result.stderr or result.stdout or "Unknown failure").strip()[-400:]
                _log_audit("STOP_BLOCK_TESTS", f"Smoke tests failed on stop: {err_msg}")
                _emit(
                    {
                        "decision": "continue",
                        "reason": f"Quality Gate: Smoke tests failed. Fix before finishing:\n{err_msg}",
                    }
                )
                return

        dirty_flag.unlink(missing_ok=True)
        _log_audit("STOP_OK", "Quality gate and smoke tests passed. Agent allowed to stop.")
        _emit({"decision": "stop"})
    except Exception:
        _emit({"decision": "stop"})


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else "post"
    handlers = {
        "pre": handle_pre_tool,
        "post": handle_post_tool,
        "session_start": handle_session_start,
        "stop": handle_stop,
    }
    handler = handlers.get(mode)
    if handler:
        handler()
    else:
        _emit({})


if __name__ == "__main__":
    main()
