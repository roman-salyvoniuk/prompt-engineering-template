from enum import StrEnum
from typing import NewType

GameId = NewType("GameId", str)


class CatalogSortBy(StrEnum):
    RELEASE_YEAR_DESC = "release_year_desc"
    RELEASE_YEAR_ASC = "release_year_asc"
    TITLE = "title"
