"""Automated Smoke Test Suite for GameLibrary Backend.

Runs inside an isolated temporary GAMELIBRARY_DATA_DIR with a copy of games.json
so live backend/data/users.json and backend/data/libraries.json are never polluted.
"""

import os
import shutil
import tempfile
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

from fastapi.testclient import TestClient

from app.dependencies import (
    get_game_repository,
    get_library_repository,
    get_user_repository,
)
from app.main import app
from app.services.auth_service import AuthService


@contextmanager
def isolated_test_client() -> Iterator[TestClient]:
    """Provides a FastAPI TestClient backed by an isolated temporary data directory."""
    source_games = Path(__file__).resolve().parent.parent / "data" / "games.json"
    prev_data_dir = os.environ.get("GAMELIBRARY_DATA_DIR")

    with tempfile.TemporaryDirectory(prefix="gamelibrary_test_") as tmp_dir:
        tmp_path = Path(tmp_dir)
        shutil.copy2(source_games, tmp_path / "games.json")
        (tmp_path / "users.json").write_text("[]", encoding="utf-8")
        (tmp_path / "libraries.json").write_text("[]", encoding="utf-8")

        os.environ["GAMELIBRARY_DATA_DIR"] = tmp_dir
        for fn in (get_user_repository, get_game_repository, get_library_repository):
            fn.cache_clear()
        try:
            yield TestClient(app)
        finally:
            if prev_data_dir is None:
                os.environ.pop("GAMELIBRARY_DATA_DIR", None)
            else:
                os.environ["GAMELIBRARY_DATA_DIR"] = prev_data_dir
            for fn in (get_user_repository, get_game_repository, get_library_repository):
                fn.cache_clear()


def _test_auth(client: TestClient, run_id: str) -> tuple[dict[str, str], str]:
    user1_email = f"gamer_{run_id}@example.com"
    user1_username = f"Gamer_{run_id}"
    reg_res = client.post(
        "/api/auth/register",
        json={"username": user1_username, "email": user1_email, "password": "Password123!"},
    )
    assert reg_res.status_code == 201, reg_res.text
    auth_data = reg_res.json()
    token1 = auth_data["token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    print(f"PASS: TC-AUTH-01 (Registered user {auth_data['user']['id']})")

    dup_res = client.post(
        "/api/auth/register",
        json={
            "username": user1_username,
            "email": "different@example.com",
            "password": "Password123!",
        },
    )
    assert dup_res.status_code == 409, dup_res.text
    print("PASS: TC-AUTH-02 (Duplicate username blocked with 409)")

    login_res = client.post(
        "/api/auth/login",
        json={"email": user1_email, "password": "Password123!"},
    )
    assert login_res.status_code == 200, login_res.text
    print("PASS: TC-AUTH-03 (Login succeeded)")

    bad_login = client.post(
        "/api/auth/login",
        json={"email": user1_email, "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401, bad_login.text
    print("PASS: TC-AUTH-04 (Invalid password blocked with 401)")

    me_res = client.get("/api/auth/me", headers=headers1)
    assert me_res.status_code == 200 and me_res.json()["username"] == user1_username
    assert client.get("/api/auth/me").status_code == 401
    print("PASS: TC-AUTH-05 (Protected routes correctly guard without token)")

    fresh_auth = AuthService(get_user_repository())
    verified = fresh_auth.get_user_by_token(token1)
    assert verified is not None and verified.username == user1_username
    assert fresh_auth.get_user_by_token(f"{token1}tampered") is None
    print("PASS: TC-AUTH-06 (Stateless HMAC token verified across fresh AuthService)")
    return headers1, token1


def _test_catalog(client: TestClient) -> tuple[str, str]:
    games_res = client.get("/api/games")
    assert games_res.status_code == 200, games_res.text
    games = games_res.json()
    assert len(games) >= 5
    print(f"PASS: TC-CAT-01 (Loaded {len(games)} catalog games)")

    search_res = client.get("/api/games?search=Witcher")
    assert search_res.status_code == 200
    assert any("Witcher" in g["title"] for g in search_res.json())
    print("PASS: TC-CAT-02 (Title search passed)")

    no_match_res = client.get("/api/games?search=xyzNonExistent999")
    assert no_match_res.status_code == 200 and len(no_match_res.json()) == 0
    print("PASS: TC-CAT-03 (Empty search returned empty list)")

    rpg_res = client.get("/api/games?genre=RPG")
    assert rpg_res.status_code == 200 and all("RPG" in g["genres"] for g in rpg_res.json())
    print(f"PASS: TC-CAT-04 (Genre filter returned {len(rpg_res.json())} RPG games)")

    switch_res = client.get("/api/games?platform=Nintendo%20Switch")
    assert switch_res.status_code == 200
    assert all("Nintendo Switch" in g["platforms"] for g in switch_res.json())
    print(f"PASS: TC-CAT-05 (Platform filter returned {len(switch_res.json())} Switch games)")

    paged_res = client.get("/api/games/paginated?page=1&page_size=10&sort_by=title")
    assert paged_res.status_code == 200, paged_res.text
    paged = paged_res.json()
    assert paged["page"] == 1 and paged["page_size"] == 10 and len(paged["items"]) == 10
    titles = [g["title"].lower() for g in paged["items"]]
    assert titles == sorted(titles), "Paginated titles must be sorted alphabetically"

    dev_search = client.get("/api/games/paginated?search=CD%20Projekt")
    assert dev_search.status_code == 200 and dev_search.json()["total"] >= 1

    rnd_res = client.get("/api/games/random?genre=RPG")
    assert rnd_res.status_code == 200 and "RPG" in rnd_res.json()["genres"]
    assert client.get("/api/games/random?genre=NoSuchGenre999").status_code == 404
    print("PASS: TC-CAT-07 (Paginated sorting, developer search, and random game passed)")
    return games[0]["id"], games[1]["id"]


def _test_library_and_stats(
    client: TestClient, run_id: str, headers1: dict[str, str], game1_id: str, game2_id: str
) -> None:
    detail_res = client.get(f"/api/games/{game1_id}")
    assert detail_res.status_code == 200 and detail_res.json()["id"] == game1_id
    print("PASS: TC-DET-01 (Single game details fetched)")

    add_res = client.post("/api/library", json={"game_id": game1_id}, headers=headers1)
    assert add_res.status_code == 201, add_res.text
    entry1 = add_res.json()
    entry1_id = entry1["id"]
    assert entry1["status"] == "want_to_play" and entry1["game"]["id"] == game1_id
    print("PASS: TC-DET-02 & TC-LIB-01 (Added game with status 'want_to_play')")

    dup_add = client.post("/api/library", json={"game_id": game1_id}, headers=headers1)
    assert dup_add.status_code == 400
    print("PASS: TC-DET-03 (Duplicate library addition blocked)")

    patch_res = client.patch(
        f"/api/library/{entry1_id}", json={"status": "playing"}, headers=headers1
    )
    assert patch_res.status_code == 200 and patch_res.json()["status"] == "playing"
    print("PASS: TC-LIB-03 (Updated status to 'playing')")

    rate_res = client.patch(f"/api/library/{entry1_id}", json={"rating": 9}, headers=headers1)
    assert rate_res.status_code == 200 and rate_res.json()["rating"] == 9
    assert (
        client.patch(f"/api/library/{entry1_id}", json={"rating": 15}, headers=headers1).status_code
        == 422
    )
    print("PASS: TC-LIB-04 & TC-LIB-05 (Rating set and invalid rating rejected)")

    clear_rate = client.patch(f"/api/library/{entry1_id}", json={"rating": None}, headers=headers1)
    assert clear_rate.status_code == 200 and clear_rate.json()["rating"] is None
    assert (
        client.patch(f"/api/library/{entry1_id}", json={"rating": 9}, headers=headers1).json()[
            "rating"
        ]
        == 9
    )
    print("PASS: TC-LIB-07 (Explicit rating clear with null succeeded)")

    meta_res = client.patch(
        f"/api/library/{entry1_id}",
        json={"notes": "Great replay value", "is_favorite": True},
        headers=headers1,
    )
    assert meta_res.status_code == 200
    assert (
        meta_res.json()["notes"] == "Great replay value" and meta_res.json()["is_favorite"] is True
    )
    print("PASS: TC-LIB-08 (Personal notes and favorite toggle saved)")

    add2 = client.post("/api/library", json={"game_id": game2_id}, headers=headers1)
    entry2_id = add2.json()["id"]
    client.patch(
        f"/api/library/{entry2_id}",
        json={"status": "completed", "rating": 7},
        headers=headers1,
    )

    stats = client.get("/api/users/me/stats", headers=headers1).json()
    assert stats["total_games"] == 2 and stats["playing_count"] == 1
    assert stats["completed_count"] == 1 and stats["average_rating"] == 8.0
    print(
        f"PASS: TC-PROF-01 to 03 (Stats: {stats['total_games']} games, avg {stats['average_rating']})"
    )

    assert stats["favorites_count"] == 1 and stats["rated_count"] == 2
    assert stats["completion_rate"] == 50.0 and len(stats["top_genres"]) >= 1
    print("PASS: TC-PROF-04 (Favorites, rated_count, completion_rate, and top_genres verified)")

    reg2 = client.post(
        "/api/auth/register",
        json={
            "username": f"UserTwo_{run_id}",
            "email": f"user2_{run_id}@example.com",
            "password": "Password123!",
        },
    )
    headers2 = {"Authorization": f"Bearer {reg2.json()['token']}"}
    assert len(client.get("/api/library", headers=headers2).json()) == 0
    assert client.delete(f"/api/library/{entry1_id}", headers=headers2).status_code == 404
    print("PASS: TC-INT-01 (Tenant isolation validated)")

    exp_json = client.get("/api/library/export?format=json", headers=headers1)
    assert exp_json.status_code == 200 and exp_json.json()["total_entries"] == 2
    exp_csv = client.get("/api/library/export?format=csv", headers=headers1)
    assert exp_csv.status_code == 200 and "text/csv" in exp_csv.headers["content-type"]
    assert "game_id,title,status,rating,is_favorite,notes,updated_at" in exp_csv.text

    imp_payload = {
        "entries": [
            {
                "game_id": game1_id,
                "status": "completed",
                "rating": 10,
                "notes": "Imported",
                "is_favorite": True,
            },
            {"game_id": "non-existent-id", "status": "playing"},
        ],
        "merge_strategy": "skip_existing",
    }
    imp1 = client.post("/api/library/import", json=imp_payload, headers=headers2)
    assert imp1.status_code == 200 and imp1.json() == {
        "imported_count": 1,
        "updated_count": 0,
        "skipped_count": 1,
    }
    imp2 = client.post(
        "/api/library/import",
        json={**imp_payload, "merge_strategy": "overwrite"},
        headers=headers2,
    )
    assert imp2.status_code == 200 and imp2.json() == {
        "imported_count": 0,
        "updated_count": 1,
        "skipped_count": 1,
    }
    print("PASS: TC-LIB-09 (Export JSON/CSV and Import skip_existing/overwrite validated)")

    assert client.delete(f"/api/library/{entry1_id}", headers=headers1).status_code == 204
    assert len(client.get("/api/library", headers=headers1).json()) == 1
    assert client.get(f"/api/games/{game1_id}").status_code == 200
    print("PASS: TC-LIB-06 (Game removed from library, global catalog preserved)")


def run_tests() -> None:
    print("=== STARTING GAMELIBRARY ISOLATED BACKEND TESTS ===")
    run_id = uuid.uuid4().hex[:6]
    with isolated_test_client() as client:
        res = client.get("/health")
        assert res.status_code == 200 and res.json() == {"status": "ok"}
        print("PASS: Health Check")

        headers1, _ = _test_auth(client, run_id)
        game1_id, game2_id = _test_catalog(client)
        _test_library_and_stats(client, run_id, headers1, game1_id, game2_id)

    print("\nALL BACKEND TEST CASES PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_tests()
