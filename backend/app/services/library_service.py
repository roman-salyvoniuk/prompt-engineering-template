import csv
import io
import uuid
from collections import Counter
from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.models.game import GameInDb, GameResponse
from app.models.library import (
    GenreStatItem,
    LibraryEntryInDb,
    LibraryEntryResponse,
    LibraryExportItem,
    LibraryExportResponse,
    LibraryImportRequest,
    LibraryImportResultResponse,
    UpdateLibraryEntryRequest,
    UserStatsResponse,
)
from app.repositories.game_repository import GameRepository
from app.repositories.library_repository import LibraryRepository
from app.types.library import PlayStatus


class LibraryService:
    def __init__(self, library_repo: LibraryRepository, game_repo: GameRepository) -> None:
        self._library_repo = library_repo
        self._game_repo = game_repo

    def _to_response(
        self, entry: LibraryEntryInDb, game: GameInDb | None = None
    ) -> LibraryEntryResponse:
        resolved_game = game if game is not None else self._game_repo.get_by_id(entry.game_id)
        game_resp = GameResponse.model_validate(resolved_game) if resolved_game else None
        return LibraryEntryResponse(
            id=entry.id,
            user_id=entry.user_id,
            game_id=entry.game_id,
            status=entry.status,
            rating=entry.rating,
            notes=entry.notes,
            is_favorite=entry.is_favorite,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
            game=game_resp,
        )

    def list_user_library(
        self, user_id: str, status_filter: PlayStatus | None = None
    ) -> list[LibraryEntryResponse]:
        entries = self._library_repo.list_by_user(user_id, status=status_filter)
        return [self._to_response(entry) for entry in entries]

    def add_to_library(
        self,
        user_id: str,
        game_id: str,
        initial_status: PlayStatus = PlayStatus.WANT_TO_PLAY,
    ) -> LibraryEntryResponse:
        game = self._game_repo.get_by_id(game_id)
        if not game:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Game with id {game_id} not found",
            )

        existing = self._library_repo.get_by_user_and_game(user_id, game_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Game is already in your library",
            )

        now = datetime.now(UTC)
        entry = LibraryEntryInDb(
            id=str(uuid.uuid4()),
            user_id=user_id,
            game_id=game_id,
            status=initial_status,
            rating=None,
            notes="",
            is_favorite=False,
            created_at=now,
            updated_at=now,
        )
        self._library_repo.create(entry)
        return self._to_response(entry, game=game)

    def update_entry(
        self,
        entry_id: str,
        user_id: str,
        req: UpdateLibraryEntryRequest,
    ) -> LibraryEntryResponse:
        entry = self._library_repo.get_by_id(entry_id)
        if not entry or entry.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Library entry {entry_id} not found",
            )

        if "status" in req.model_fields_set and req.status is not None:
            entry.status = req.status

        if "rating" in req.model_fields_set:
            if req.rating is not None and (req.rating < 1 or req.rating > 10):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Rating must be an integer between 1 and 10",
                )
            entry.rating = req.rating

        if "notes" in req.model_fields_set and req.notes is not None:
            entry.notes = req.notes.strip()

        if "is_favorite" in req.model_fields_set and req.is_favorite is not None:
            entry.is_favorite = req.is_favorite

        entry.updated_at = datetime.now(UTC)
        self._library_repo.update(entry)
        return self._to_response(entry)

    def remove_entry(self, entry_id: str, user_id: str) -> None:
        deleted = self._library_repo.delete(entry_id, user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Library entry {entry_id} not found",
            )

    def export_library(self, user_id: str) -> LibraryExportResponse:
        entries = self._library_repo.list_by_user(user_id)
        export_items: list[LibraryExportItem] = []
        for entry in entries:
            game = self._game_repo.get_by_id(entry.game_id)
            export_items.append(
                LibraryExportItem(
                    game_id=entry.game_id,
                    title=game.title if game else "Unknown Game",
                    status=entry.status,
                    rating=entry.rating,
                    notes=entry.notes,
                    is_favorite=entry.is_favorite,
                    updated_at=entry.updated_at,
                )
            )
        return LibraryExportResponse(
            exported_at=datetime.now(UTC),
            total_entries=len(export_items),
            entries=export_items,
        )

    def export_library_csv(self, user_id: str) -> str:
        export_data = self.export_library(user_id)
        buf = io.StringIO()
        writer = csv.writer(buf, lineterminator="\n")
        writer.writerow(
            ["game_id", "title", "status", "rating", "is_favorite", "notes", "updated_at"]
        )
        for item in export_data.entries:
            writer.writerow(
                [
                    item.game_id,
                    item.title,
                    item.status.value,
                    "" if item.rating is None else str(item.rating),
                    str(item.is_favorite).lower(),
                    item.notes,
                    item.updated_at.isoformat(),
                ]
            )
        return buf.getvalue()

    def import_library(
        self, user_id: str, req: LibraryImportRequest
    ) -> LibraryImportResultResponse:
        existing_by_game = {e.game_id: e for e in self._library_repo.list_by_user(user_id)}
        imported_count = 0
        updated_count = 0
        skipped_count = 0
        now = datetime.now(UTC)

        for item in req.entries:
            game = self._game_repo.get_by_id(item.game_id)
            if not game:
                skipped_count += 1
                continue

            existing = existing_by_game.get(item.game_id)
            if existing is not None:
                if req.merge_strategy == "skip_existing":
                    skipped_count += 1
                    continue
                existing.status = item.status
                existing.rating = item.rating
                existing.notes = item.notes.strip()
                existing.is_favorite = item.is_favorite
                existing.updated_at = now
                self._library_repo.update(existing)
                updated_count += 1
            else:
                new_entry = LibraryEntryInDb(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    game_id=item.game_id,
                    status=item.status,
                    rating=item.rating,
                    notes=item.notes.strip(),
                    is_favorite=item.is_favorite,
                    created_at=now,
                    updated_at=now,
                )
                self._library_repo.create(new_entry)
                existing_by_game[item.game_id] = new_entry
                imported_count += 1

        return LibraryImportResultResponse(
            imported_count=imported_count,
            updated_count=updated_count,
            skipped_count=skipped_count,
        )

    def get_user_stats(self, user_id: str) -> UserStatsResponse:
        entries = self._library_repo.list_by_user(user_id)
        total = len(entries)
        want_to_play = sum(1 for e in entries if e.status == PlayStatus.WANT_TO_PLAY)
        playing = sum(1 for e in entries if e.status == PlayStatus.PLAYING)
        completed = sum(1 for e in entries if e.status == PlayStatus.COMPLETED)
        favorites = sum(1 for e in entries if e.is_favorite)

        rated_entries = [e.rating for e in entries if e.rating is not None]
        rated_count = len(rated_entries)
        avg_rating = round(sum(rated_entries) / rated_count, 1) if rated_count else None
        completion_rate = round((completed / total) * 100, 1) if total > 0 else 0.0

        genre_counts: Counter[str] = Counter()
        for entry in entries:
            game = self._game_repo.get_by_id(entry.game_id)
            if game:
                for genre in game.genres:
                    genre_counts[genre] += 1

        top_genres = [
            GenreStatItem(genre=genre, count=count)
            for genre, count in sorted(
                genre_counts.items(), key=lambda kv: (-kv[1], kv[0].lower())
            )[:5]
        ]

        return UserStatsResponse(
            total_games=total,
            want_to_play_count=want_to_play,
            playing_count=playing,
            completed_count=completed,
            average_rating=avg_rating,
            favorites_count=favorites,
            rated_count=rated_count,
            completion_rate=completion_rate,
            top_genres=top_genres,
        )
