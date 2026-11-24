"""Reusable Linter, Formatter, and Type Checker runner for Agent & Git Hooks.

Provides:
- Single-file post-edit checks (Ruff, Mypy, Oxlint, Prettier) for PostToolUse hooks.
- Full-repository Quality Gate checks (Backend + Frontend) for Stop & Git pre-commit hooks.
"""

import py_compile
import shutil
import subprocess
import sys
from collections.abc import Callable
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
AGENTS_DIR = SCRIPT_DIR.parent
WORKSPACE_DIR = AGENTS_DIR.parent
BACKEND_DIR = WORKSPACE_DIR / "backend"
FRONTEND_DIR = WORKSPACE_DIR / "frontend"

IS_WIN = sys.platform == "win32"
UV_BIN = shutil.which("uv") or "uv"
NPM_BIN = shutil.which("npm") or ("npm.cmd" if IS_WIN else "npm")


def _run_cmd(cmd: list[str], cwd: Path, timeout: int = 20) -> tuple[bool, str]:
    """Executes a subprocess command and returns (passed, output_tail)."""
    try:
        result = subprocess.run(
            cmd,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
        )
        combined = f"{result.stdout}\n{result.stderr}".strip()
        return result.returncode == 0, combined[-500:] if combined else ""
    except Exception as exc:
        return False, f"Command execution error ({cmd[0]}): {exc}"


def validate_modified_file(path: Path, log_fn: Callable[[str, str], None]) -> None:
    """Runs fast per-file syntax, lint, format, and type checks after file edits."""
    if not path.exists():
        return

    norm_path = str(path.resolve()).replace("\\", "/")

    # 1. Python files (AST syntax + Ruff linter/formatter + Mypy)
    if path.suffix == ".py":
        try:
            py_compile.compile(str(path), doraise=True)
            log_fn("PY_SYNTAX", f"Syntax validation passed: {path.name}")
        except py_compile.PyCompileError as pe:
            log_fn("PY_ERROR", f"Syntax error in {path.name}: {pe}")
            return

        if "/backend/" in norm_path and BACKEND_DIR.exists():
            ok_lint, out_lint = _run_cmd(
                [UV_BIN, "run", "ruff", "check", str(path)],
                cwd=BACKEND_DIR,
                timeout=10,
            )
            log_fn(
                "RUFF_LINT_OK" if ok_lint else "RUFF_LINT_WARN",
                f"Ruff check on {path.name}: {'passed' if ok_lint else out_lint}",
            )

            ok_fmt, _ = _run_cmd(
                [UV_BIN, "run", "ruff", "format", "--check", str(path)],
                cwd=BACKEND_DIR,
                timeout=10,
            )
            log_fn(
                "RUFF_FMT_OK" if ok_fmt else "RUFF_FMT_WARN",
                f"Ruff format check on {path.name}: {'formatted' if ok_fmt else 'needs formatting'}",
            )

            if "/backend/app/" in norm_path:
                ok_mypy, out_mypy = _run_cmd(
                    [UV_BIN, "run", "mypy", str(path)],
                    cwd=BACKEND_DIR,
                    timeout=15,
                )
                log_fn(
                    "MYPY_OK" if ok_mypy else "MYPY_WARN",
                    f"Mypy check on {path.name}: {'passed' if ok_mypy else out_mypy}",
                )

    # 2. Frontend files (Oxlint + Prettier)
    elif "/frontend/" in norm_path and path.suffix in (
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".css",
        ".json",
    ):
        oxlint_bin = FRONTEND_DIR / "node_modules" / ".bin" / ("oxlint.cmd" if IS_WIN else "oxlint")
        prettier_bin = (
            FRONTEND_DIR / "node_modules" / ".bin" / ("prettier.cmd" if IS_WIN else "prettier")
        )

        if path.suffix in (".ts", ".tsx", ".js", ".jsx") and oxlint_bin.exists():
            ok_ox, out_ox = _run_cmd([str(oxlint_bin), str(path)], cwd=FRONTEND_DIR, timeout=10)
            log_fn(
                "OXLINT_OK" if ok_ox else "OXLINT_WARN",
                f"Oxlint on {path.name}: {'passed' if ok_ox else out_ox}",
            )

        if prettier_bin.exists():
            ok_pr, _ = _run_cmd(
                [str(prettier_bin), "--check", str(path)], cwd=FRONTEND_DIR, timeout=10
            )
            log_fn(
                "PRETTIER_OK" if ok_pr else "PRETTIER_WARN",
                f"Prettier check on {path.name}: {'formatted' if ok_pr else 'needs formatting'}",
            )


def run_full_quality_gate() -> tuple[bool, str]:
    """Runs all 6 static analysis checks across backend and frontend.

    Returns:
        (passed, failure_reason)
    """
    checks: list[tuple[str, list[str], Path]] = [
        (
            "Backend Linter (Ruff)",
            [UV_BIN, "run", "ruff", "check", "app", "../.agents/scripts"],
            BACKEND_DIR,
        ),
        (
            "Backend Formatter (Ruff Format)",
            [UV_BIN, "run", "ruff", "format", "--check", "app", "../.agents/scripts"],
            BACKEND_DIR,
        ),
        (
            "Backend Type Checker (Mypy)",
            [UV_BIN, "run", "mypy", "app"],
            BACKEND_DIR,
        ),
        (
            "Frontend Linter (Oxlint)",
            [NPM_BIN, "run", "lint"],
            FRONTEND_DIR,
        ),
        (
            "Frontend Formatter (Prettier)",
            [NPM_BIN, "run", "format:check"],
            FRONTEND_DIR,
        ),
        (
            "Frontend Type Checker (TypeScript)",
            [NPM_BIN, "run", "type-check"],
            FRONTEND_DIR,
        ),
    ]

    for label, cmd, cwd in checks:
        if not cwd.exists():
            continue
        passed, output = _run_cmd(cmd, cwd=cwd, timeout=20)
        if not passed:
            return (
                False,
                f"Quality Gate: {label} failed. Please fix before finishing:\n{output}",
            )

    return True, "All linters, formatters, and type checkers passed."


if __name__ == "__main__":
    ok, msg = run_full_quality_gate()
    print(msg)
    sys.exit(0 if ok else 1)
