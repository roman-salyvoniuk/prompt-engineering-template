from typing import Literal

from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import JSONResponse

from app.dependencies import get_current_user, get_library_service
from app.models.library import (
    AddLibraryEntryRequest,
    LibraryEntryResponse,
    LibraryImportRequest,
    LibraryImportResultResponse,
    UpdateLibraryEntryRequest,
)
from app.models.user import UserResponse
from app.services.library_service import LibraryService
from app.types.library import PlayStatus

router = APIRouter(prefix="/library", tags=["library"])


@router.get("", response_model=list[LibraryEntryResponse])
def get_user_library(
    status: PlayStatus | None = None,
    current_user: UserResponse = Depends(get_current_user),
    library_service: LibraryService = Depends(get_library_service),
) -> list[LibraryEntryResponse]:
    return library_service.list_user_library(user_id=current_user.id, status_filter=status)


@router.post(
    "",
    response_model=LibraryEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_to_library(
    req: AddLibraryEntryRequest,
    current_user: UserResponse = Depends(get_current_user),
    library_service: LibraryService = Depends(get_library_service),
) -> LibraryEntryResponse:
    return library_service.add_to_library(
        user_id=current_user.id,
        game_id=req.game_id,
        initial_status=req.status,
    )


@router.get("/export", response_model=None)
def export_library(
    format: Literal["json", "csv"] = "json",
    current_user: UserResponse = Depends(get_current_user),
    library_service: LibraryService = Depends(get_library_service),
) -> Response:
    if format == "csv":
        csv_content = library_service.export_library_csv(user_id=current_user.id)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="gamelibrary-export.csv"'},
        )
    export_data = library_service.export_library(user_id=current_user.id)
    return JSONResponse(
        content=export_data.model_dump(mode="json"),
        headers={"Content-Disposition": 'attachment; filename="gamelibrary-export.json"'},
    )


@router.post("/import", response_model=LibraryImportResultResponse)
def import_library(
    req: LibraryImportRequest,
    current_user: UserResponse = Depends(get_current_user),
    library_service: LibraryService = Depends(get_library_service),
) -> LibraryImportResultResponse:
    return library_service.import_library(user_id=current_user.id, req=req)


@router.patch("/{entry_id}", response_model=LibraryEntryResponse)
def update_library_entry(
    entry_id: str,
    req: UpdateLibraryEntryRequest,
    current_user: UserResponse = Depends(get_current_user),
    library_service: LibraryService = Depends(get_library_service),
) -> LibraryEntryResponse:
    return library_service.update_entry(
        entry_id=entry_id,
        user_id=current_user.id,
        req=req,
    )


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_library(
    entry_id: str,
    current_user: UserResponse = Depends(get_current_user),
    library_service: LibraryService = Depends(get_library_service),
) -> Response:
    library_service.remove_entry(entry_id=entry_id, user_id=current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
