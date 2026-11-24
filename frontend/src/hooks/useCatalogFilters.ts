import { useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { CatalogSortBy, GameFilterParams } from "@/types";

export const AVAILABLE_GENRES = [
  "All",
  "RPG",
  "Action",
  "Adventure",
  "Shooter",
  "MMORPG",
  "Strategy",
  "Battle Royale",
  "MOBA",
  "Fighting",
  "Card Game",
  "Sports",
  "Racing",
  "Roguelike",
  "Metroidvania",
  "Indie",
  "Simulation",
] as const;

export const AVAILABLE_PLATFORMS = [
  "All",
  "PC",
  "PlayStation",
  "Xbox",
  "Nintendo Switch",
  "Web Browser",
] as const;

export const CATALOG_PAGE_SIZE = 24;

export function useCatalogFilters() {
  const [search, setSearchState] = useState("");
  const [genre, setGenreState] = useState<string>("All");
  const [platform, setPlatformState] = useState<string>("All");
  const [sortBy, setSortByState] = useState<CatalogSortBy>("release_year_desc");
  const [page, setPage] = useState<number>(1);

  const debouncedSearch = useDebouncedValue(search, 250);

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(1);
  };

  const setGenre = (value: string) => {
    setGenreState(value);
    setPage(1);
  };

  const setPlatform = (value: string) => {
    setPlatformState(value);
    setPage(1);
  };

  const setSortBy = (value: CatalogSortBy) => {
    setSortByState(value);
    setPage(1);
  };

  const queryParams: GameFilterParams = {
    search: debouncedSearch.trim() || undefined,
    genre: genre !== "All" ? genre : undefined,
    platform: platform !== "All" ? platform : undefined,
    sort_by: sortBy,
    page,
    page_size: CATALOG_PAGE_SIZE,
  };

  const clearFilters = () => {
    setSearchState("");
    setGenreState("All");
    setPlatformState("All");
    setSortByState("release_year_desc");
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" || genre !== "All" || platform !== "All" || sortBy !== "release_year_desc";

  return {
    search,
    setSearch,
    genre,
    setGenre,
    platform,
    setPlatform,
    sortBy,
    setSortBy,
    page,
    setPage,
    clearFilters,
    hasActiveFilters,
    queryParams,
    genres: AVAILABLE_GENRES,
    platforms: AVAILABLE_PLATFORMS,
  };
}
