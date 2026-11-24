---
name: api-testing
description: >-
  Use this skill to run automated smoke verification tests against the GameLibrary FastAPI backend endpoints.
---

# API Testing Skill

Run automated smoke tests against the GameLibrary API following the test cases in `docs/games/test-cases.md`.

## Isolation Guarantee
`backend/scripts/test_api.py` automatically runs inside a temporary `GAMELIBRARY_DATA_DIR` with a copy of `games.json`, so live `backend/data/users.json` and `backend/data/libraries.json` are never modified.

## Execution
Run the verification test script using Python:
```bash
cd backend
uv run python -m scripts.test_api
```
Or from the repository root:
```cmd
test.bat
```

## Coverage
- **Auth (`TC-AUTH-01..06`)**: Registration, duplicate rejection, login, token protection, and stateless HMAC verification.
- **Catalog (`TC-CAT-01..05, 07`)**: Game listing, title & developer search, genre/platform filtering, paginated sorting (`/api/games/paginated`), and random selection (`/api/games/random`).
- **Library (`TC-LIB-01..09`)**: Default `"want_to_play"` addition, duplicate prevention, status updates, rating set/validation/null-clear, notes & favorites, JSON/CSV export, JSON import, and deletion.
- **Stats & Isolation (`TC-PROF-01..04`, `TC-INT-01`)**: Totals, averages, `favorites_count`, `rated_count`, `completion_rate`, `top_genres`, and multi-user tenant isolation.
