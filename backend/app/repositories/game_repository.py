from pathlib import Path

from app.models.game import GameInDb
from app.types.game import CatalogSortBy
from app.utils.json_store import read_list_file, write_list_file


class GameRepository:
    def __init__(self, storage_path: Path) -> None:
        self._path = storage_path
        self._cache_signature: tuple[int, int] | None = None
        self._cached_games: list[GameInDb] = []
        self._cached_by_id: dict[str, GameInDb] = {}

    def _load_cached(self) -> tuple[list[GameInDb], dict[str, GameInDb]]:
        if not self._path.exists():
            games = read_list_file(self._path, GameInDb)
            stat = self._path.stat()
            self._cache_signature = (stat.st_mtime_ns, stat.st_size)
            self._cached_games = games
            self._cached_by_id = {g.id: g for g in games}
            return self._cached_games, self._cached_by_id

        stat = self._path.stat()
        signature = (stat.st_mtime_ns, stat.st_size)
        if self._cache_signature != signature:
            games = read_list_file(self._path, GameInDb)
            self._cache_signature = signature
            self._cached_games = games
            self._cached_by_id = {g.id: g for g in games}

        return self._cached_games, self._cached_by_id

    @staticmethod
    def _sort_games(games: list[GameInDb], sort_by: CatalogSortBy) -> list[GameInDb]:
        if sort_by == CatalogSortBy.RELEASE_YEAR_ASC:
            return sorted(games, key=lambda g: (g.release_year, g.title.lower()))
        if sort_by == CatalogSortBy.TITLE:
            return sorted(games, key=lambda g: g.title.lower())
        return sorted(games, key=lambda g: (-g.release_year, g.title.lower()))

    def list_all(
        self,
        search: str | None = None,
        genre: str | None = None,
        platform: str | None = None,
        sort_by: CatalogSortBy = CatalogSortBy.RELEASE_YEAR_DESC,
    ) -> list[GameInDb]:
        cached_games, _ = self._load_cached()
        games = list(cached_games)

        if search:
            query = search.strip().lower()
            games = [g for g in games if query in g.title.lower() or query in g.developer.lower()]

        if genre:
            target_genre = genre.strip().lower()
            games = [g for g in games if any(target_genre == gen.lower() for gen in g.genres)]

        if platform:
            target_platform = platform.strip().lower()
            games = [
                g for g in games if any(target_platform == plat.lower() for plat in g.platforms)
            ]

        return self._sort_games(games, sort_by)

    def get_by_id(self, game_id: str) -> GameInDb | None:
        _, by_id = self._load_cached()
        return by_id.get(game_id)

    def create(self, game: GameInDb) -> GameInDb:
        cached_games, _ = self._load_cached()
        updated = [*cached_games, game]
        write_list_file(self._path, updated)
        self._cache_signature = None
        return game
