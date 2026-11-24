from fastapi import APIRouter, Depends, Query

from app.dependencies import get_game_service
from app.models.game import GameResponse, PaginatedGamesResponse
from app.services.game_service import GameService
from app.types.game import CatalogSortBy

router = APIRouter(prefix="/games", tags=["games"])


@router.get("", response_model=list[GameResponse])
def list_games(
    search: str | None = None,
    genre: str | None = None,
    platform: str | None = None,
    sort_by: CatalogSortBy = CatalogSortBy.RELEASE_YEAR_DESC,
    game_service: GameService = Depends(get_game_service),
) -> list[GameResponse]:
    return game_service.list_games(
        search=search,
        genre=genre,
        platform=platform,
        sort_by=sort_by,
    )


@router.get("/paginated", response_model=PaginatedGamesResponse)
def list_games_paginated(
    search: str | None = None,
    genre: str | None = None,
    platform: str | None = None,
    sort_by: CatalogSortBy = CatalogSortBy.RELEASE_YEAR_DESC,
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    game_service: GameService = Depends(get_game_service),
) -> PaginatedGamesResponse:
    return game_service.list_games_paginated(
        search=search,
        genre=genre,
        platform=platform,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )


@router.get("/random", response_model=GameResponse)
def get_random_game(
    genre: str | None = None,
    platform: str | None = None,
    game_service: GameService = Depends(get_game_service),
) -> GameResponse:
    return game_service.get_random_game(genre=genre, platform=platform)


@router.get("/{game_id}", response_model=GameResponse)
def get_game(
    game_id: str,
    game_service: GameService = Depends(get_game_service),
) -> GameResponse:
    return game_service.get_game(game_id)
