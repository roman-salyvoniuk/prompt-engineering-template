# Project agents guide

This repository is a full-stack boilerplate: **FastAPI** backend and **React 19 (TypeScript)** frontend.

## Layout

- `backend/` — API with layered architecture (`types`, `models`, `repositories`, `services`, `routers`, `utils`). Data is stored in JSON files under `backend/data/` (`games.json`, `libraries.json`, `users.json`), overridable via `GAMELIBRARY_DATA_DIR`. Uses **uv**, **Pydantic v2**, stateless HMAC-SHA256 bearer tokens, `mtime_ns` catalog caching, and FastAPI dependency injection. Includes an isolated automated smoke test suite in `backend/scripts/test_api.py`.
- `frontend/` — **React 19 + TypeScript**, **Vite**, **Tailwind CSS v4**, **shadcn/ui** (including `ConfirmDialog`), **Redux Toolkit** (RTK Query for API, slices for UI state). Features authentication modal, guest route guard, debounced search, server-side pagination, sorting, random game discovery, library notes/favorites/export/import, profile analytics, and Dark/Light theme switching.
- `docs/` — Feature documentation organized by feature (`docs/<feature>/` containing business requirements, architecture, test cases).
- `.agents/` — AI Assistant configuration:
  - `rules/` — Modular scoped rules (`backend-architecture.md`, `frontend-architecture.md`, `coding-style.md`, `security-and-data.md`, `testing-and-contracts.md`, `documentation-standards.md`, `ui-ux-accessibility.md`, `communication-style.md`).
  - `hooks.json` & `scripts/` (`hook_handler.py`, `hook_guards.py`, `quality_checks.py`) — Lifecycle hooks (`SessionStart`, `PreToolUse`, `PostToolUse`, `Stop` dirty-gated quality & test gate).
  - `plugins/gamelibrary-atlassian/` (`plugin.json`, `mcp_config.json`) — Workspace MCP plugin for Atlassian Jira/Confluence (paired with `.mcp.json`).
  - `skills/` — Reusable domain procedures (`api-testing`, `run-app`, `quality-gate`, `stop-app`, `add-feature`, `data-management`, `catalog-sync`, `jira-tasks`).

## Current scope

Domain feature: **GameLibrary** (`games`):
- Rich catalog of **2,279 games** with titles, cover artwork, descriptions, genres, platforms, release years, and developers.
- Debounced title/developer search, multi-criteria genre/platform filtering, sorting (`release_year_desc`, `release_year_asc`, `title`), server-side pagination (`/api/games/paginated`), and random discovery (`/api/games/random`).
- Personal library management: play status ("Want to Play", "Playing", "Completed"), optional 1–10 ratings (with explicit clear support), personal notes, favorite flags, JSON/CSV export, JSON import (`skip_existing` / `overwrite`), and accessible confirmation dialogs.
- User profile with real-time statistics (`total_games`, per-status counts, `favorites_count`, `rated_count`, `completion_rate`, `average_rating`, `top_genres`) and multi-user tenant isolation.
- Dark and Light theme toggle.

## Modular Rules (`.agents/rules/`)

1. **`backend-architecture.md`**: Strict layering (`Routers -> Services -> Repositories -> Data Stores`). Routers never call repositories directly. Dependency injection via `Depends()`.
2. **`frontend-architecture.md`**: RTK Query for server state cache, Redux slices for global UI state, custom hooks under `src/hooks/`, headless UI primitives under `src/components/ui/`.
3. **`coding-style.md`**: Zero tolerance for linter/type errors (`ruff`, `mypy`, `oxlint`, `tsc`). Python files under 300 lines, React components under 250 lines, Pydantic v2 schemas for all payloads.
4. **`security-and-data.md`**: Salted PBKDF2 password hashing, stateless HMAC-SHA256 tokens, strict tenant isolation on user libraries, atomic JSON file writes, `GAMELIBRARY_DATA_DIR` override support, catalog immutability.
5. **`testing-and-contracts.md`**: Isolated automated smoke test parity in `backend/scripts/test_api.py`, standardized HTTP status codes (`200`, `201`, `204`, `401`, `404`, `409`, `422`), end-to-end type parity.
6. **`documentation-standards.md`**: Every feature must have `business-requirements.md`, `architecture.md`, and `test-cases.md` under `docs/<feature>/`.
7. **`ui-ux-accessibility.md`**: Semantic Tailwind tokens for dark/light themes, accessible modal/confirm dialogs & buttons, full coverage of 4 UI states (loading, error, empty, success).
8. **`communication-style.md`**: Standard professional engineering communication style for this workspace.

## Available Skills (`.agents/skills/`)

- **`run-app`**: Launch backend (FastAPI, port 8001) and frontend (Vite, port 5174) dev servers.
- **`stop-app`**: Cleanly terminate servers and free ports 8001 and 5174 on Windows.
- **`quality-gate`**: Run all linters, formatters, and type checkers across the entire repository.
- **`api-testing`**: Run isolated automated smoke verification tests against the FastAPI backend endpoints.
- **`add-feature`**: End-to-end guide for implementing full-stack features following layering and contracts.
- **`data-management`**: Safe inspection, backup, and validation of JSON data stores in `backend/data/`.
- **`catalog-sync`**: Ingest and synchronize games from external APIs (SteamSpy, FreeToGame) via `backend/scripts/import_games.py`.
- **`jira-tasks`**: Manage GameLibrary tasks, backlog, and workflow transitions in Jira via the Atlassian MCP server.

## Working conventions

- Add new features under the same layer folders on the backend and under `src/features/` on the frontend.
- Document each feature under `docs/<feature>/` (e.g. `docs/games/`).
- Follow strict architectural boundaries defined in `.agents/rules/`.
- Never wipe or truncate `backend/data/games.json`.
- Keep AI assistant entry points minimal: this file is the source of truth; `Claude.md` points here.

## Local development & Tooling

- One-click launch: run `start.bat` from project root (starts backend on `8001`, frontend on `5174`, opens browser).
- One-click stop: run `stop.bat` to cleanly terminate background dev servers.
- One-click quality gate (lint, format, types): run `check.bat`.
- Automated smoke testing: run `test.bat` (or `cd backend && uv run python -m scripts.test_api`).
- Note: `run.bat` is an alias that forwards directly to `start.bat`.
- Interactive API Docs: `http://localhost:8001/docs` (Swagger UI).
- Manual start:
  1. Backend: from `backend/`, run `uv sync` then `uv run dev`.
  2. Frontend: from `frontend/`, run `npm install` then `npm run dev`.
