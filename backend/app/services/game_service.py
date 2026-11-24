import secrets

from fastapi import HTTPException, status

from app.models.game import GameResponse, PaginatedGamesResponse
from app.repositories.game_repository import GameRepository
from app.types.game import CatalogSortBy


class GameService:
    def __init__(self, game_repo: GameRepository) -> None:
        self._game_repo = game_repo

    def list_games(
        self,
        search: str | None = None,
        genre: str | None = None,
        platform: str | None = None,
        sort_by: CatalogSortBy = CatalogSortBy.RELEASE_YEAR_DESC,
    ) -> list[GameResponse]:
        games = self._game_repo.list_all(
            search=search,
            genre=genre,
            platform=platform,
            sort_by=sort_by,
        )
        return [GameResponse.model_validate(g) for g in games]

    def list_games_paginated(
        self,
        search: str | None = None,
        genre: str | None = None,
        platform: str | None = None,
        sort_by: CatalogSortBy = CatalogSortBy.RELEASE_YEAR_DESC,
        page: int = 1,
        page_size: int = 24,
    ) -> PaginatedGamesResponse:
        games = self._game_repo.list_all(
            search=search,
            genre=genre,
            platform=platform,
            sort_by=sort_by,
        )
        total = len(games)
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        start = (page - 1) * page_size
        page_items = games[start : start + page_size]

        return PaginatedGamesResponse(
            items=[GameResponse.model_validate(g) for g in page_items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_random_game(
        self,
        genre: str | None = None,
        platform: str | None = None,
    ) -> GameResponse:
        games = self._game_repo.list_all(genre=genre, platform=platform)
        if not games:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No games found matching the selected filters",
            )
        chosen = secrets.choice(games)
        return GameResponse.model_validate(chosen)

    def get_game(self, game_id: str) -> GameResponse:
        game = self._game_repo.get_by_id(game_id)
        if not game:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Game with id {game_id} not found",
            )
        return GameResponse.model_validate(game)
