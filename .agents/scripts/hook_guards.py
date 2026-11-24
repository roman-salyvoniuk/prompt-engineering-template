"""Security and data integrity guard helpers for Antigravity lifecycle hooks."""

import json
import re
from pathlib import Path
from typing import Any

FILE_MUTATION_TOOLS = (
    "write_file",
    "edit_file",
    "write_to_file",
    "replace_file_content",
    "multi_replace_file_content",
)

HARD_BLOCKED_COMMANDS = (
    "rmdir /s /q c:\\",
    "del /f /s /q c:\\",
    "format c:",
    "diskpart",
    "drop database",
)

RISKY_GIT_COMMANDS = ("git reset --hard", "git push --force", "git push -f")

PROTECTED_PATH_SEGMENTS = ("/.git/", "/.env", "/.venv/")

SECRET_PATTERNS = (
    (r"-----BEGIN (?:RSA )?PRIVATE KEY-----", "Private cryptographic key"),
    (r"ghp_[a-zA-Z0-9]{36}", "GitHub Personal Access Token"),
    (r"github_pat_[a-zA-Z0-9_]{82}", "Fine-grained GitHub Token"),
    (r"AKIA[0-9A-Z]{16}", "AWS Access Key ID"),
    (r"sk-[a-zA-Z0-9]{32,}", "OpenAI API secret key"),
)


def extract_file_mutation(tool_name: str, args: dict[str, Any]) -> tuple[str, str]:
    """Extracts (target_path, payload_text) across Antigravity 2.x and legacy tools."""
    if tool_name == "write_file":
        return str(args.get("Path", "")), str(args.get("Content", ""))
    if tool_name == "edit_file":
        return str(args.get("Path", "")), str(args.get("Replacement", ""))
    if tool_name == "write_to_file":
        return str(args.get("TargetFile", "")), str(args.get("CodeContent", ""))
    if tool_name == "replace_file_content":
        return str(args.get("TargetFile", "")), str(args.get("ReplacementContent", ""))
    if tool_name == "multi_replace_file_content":
        chunks = args.get("ReplacementChunks", [])
        text = "\n".join(
            str(chunk.get("ReplacementContent", "")) for chunk in chunks if isinstance(chunk, dict)
        )
        return str(args.get("TargetFile", "")), text
    return "", ""


def check_for_secrets(text: str) -> str | None:
    """Detects leaked API keys, tokens, or private certificates."""
    for pattern, name in SECRET_PATTERNS:
        if re.search(pattern, text):
            return name
    return None


def evaluate_command_guard(raw_cmd: str) -> tuple[str, str | None]:
    """Evaluates shell command safety. Returns (decision, reason)."""
    cmd = raw_cmd.strip().lower()
    for blocked in HARD_BLOCKED_COMMANDS:
        if blocked in cmd:
            return "deny", f"Security Gate: Prohibited destructive command: '{blocked}'"

    if re.search(r"(remove-item|del|rm|clear-content|set-content|out-file)\b", cmd):
        norm_cmd = cmd.replace("\\", "/")
        if "backend/data/games.json" in norm_cmd or ".env" in norm_cmd:
            return (
                "deny",
                "Security Gate: Modifying or deleting games.json / .env via shell is blocked.",
            )

    for risky in RISKY_GIT_COMMANDS:
        if risky in cmd:
            return (
                "ask",
                f"Safety Gate: Command performs irreversible git mutation ('{risky}'). Confirm?",
            )

    return "allow", None


def evaluate_file_guard(tool_name: str, target_raw: str, content: str) -> tuple[str, str | None]:
    """Evaluates file write/edit safety against protected paths and catalog integrity."""
    target_file = target_raw.replace("\\", "/")
    for pat in PROTECTED_PATH_SEGMENTS:
        if pat in target_file:
            return (
                "deny",
                f"Safety Gate: Direct modification of protected path '{pat}' is prohibited.",
            )

    if target_file.endswith("backend/data/games.json") and tool_name in (
        "write_file",
        "write_to_file",
    ):
        try:
            parsed = json.loads(content)
        except Exception:
            return "deny", "Safety Gate: games.json must be valid JSON."
        if not isinstance(parsed, list) or len(parsed) < 500:
            return (
                "deny",
                "Safety Gate: Cannot overwrite games catalog with truncated array (< 500 items).",
            )

    return "allow", None


def verify_games_catalog(data_dir: Path) -> str | None:
    """Returns error message if games.json is damaged/truncated, else None."""
    games_file = data_dir / "games.json"
    if not games_file.exists():
        return None
    try:
        games = json.loads(games_file.read_text(encoding="utf-8"))
    except Exception as exc:
        return f"Quality Gate: backend/data/games.json failed JSON parse check ({exc})."
    if not isinstance(games, list) or len(games) < 500:
        return "Quality Gate: backend/data/games.json appears damaged or truncated (< 500 games)."
    return None
