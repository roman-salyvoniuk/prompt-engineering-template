from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.game import GameResponse
from app.types.library import PlayStatus


class AddLibraryEntryRequest(BaseModel):
    game_id: str
    status: PlayStatus = PlayStatus.WANT_TO_PLAY


class UpdateLibraryEntryRequest(BaseModel):
    status: PlayStatus | None = None
    rating: int | None = Field(None, ge=1, le=10)
    notes: str | None = Field(default=None, max_length=1000)
    is_favorite: bool | None = None


class LibraryEntryInDb(BaseModel):
    id: str
    user_id: str
    game_id: str
    status: PlayStatus = PlayStatus.WANT_TO_PLAY
    rating: int | None = None
    notes: str = Field(default="", max_length=1000)
    is_favorite: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class LibraryEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    game_id: str
    status: PlayStatus
    rating: int | None = None
    notes: str = ""
    is_favorite: bool = False
    created_at: datetime
    updated_at: datetime
    game: GameResponse | None = None


class GenreStatItem(BaseModel):
    genre: str
    count: int


class UserStatsResponse(BaseModel):
    total_games: int
    want_to_play_count: int
    playing_count: int
    completed_count: int
    average_rating: float | None = None
    favorites_count: int = 0
    rated_count: int = 0
    completion_rate: float = 0.0
    top_genres: list[GenreStatItem] = Field(default_factory=list)


class LibraryExportItem(BaseModel):
    game_id: str
    title: str
    status: PlayStatus
    rating: int | None = None
    notes: str = ""
    is_favorite: bool = False
    updated_at: datetime


class LibraryExportResponse(BaseModel):
    exported_at: datetime
    total_entries: int
    entries: list[LibraryExportItem]


class LibraryImportItem(BaseModel):
    game_id: str
    status: PlayStatus = PlayStatus.WANT_TO_PLAY
    rating: int | None = Field(default=None, ge=1, le=10)
    notes: str = Field(default="", max_length=1000)
    is_favorite: bool = False


class LibraryImportRequest(BaseModel):
    entries: list[LibraryImportItem]
    merge_strategy: Literal["skip_existing", "overwrite"] = "skip_existing"


class LibraryImportResultResponse(BaseModel):
    imported_count: int
    updated_count: int
    skipped_count: int
