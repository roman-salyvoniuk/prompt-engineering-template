import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogFilterBar } from "@/features/games/CatalogFilterBar";
import { CatalogHero } from "@/features/games/CatalogHero";
import { GameCard } from "@/features/games/GameCard";
import { GameListRow } from "@/features/games/GameListRow";
import { useCatalogFilters } from "@/hooks/useCatalogFilters";
import { useLibrary } from "@/hooks/useLibrary";
import { useGetPaginatedGamesQuery, useLazyGetRandomGameQuery } from "@/store/api/gamesApi";
import { openGameDetails, openStatusDialog, setViewMode } from "@/store/slices/appSlice";
import type { AppDispatch, RootState } from "@/store/store";
import type { Game } from "@/types";

export function CatalogPage() {
  const dispatch = useDispatch<AppDispatch>();
  const viewMode = useSelector((state: RootState) => state.app.viewMode);
  const {
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
    genres,
    platforms,
  } = useCatalogFilters();

  const { data, isLoading, isFetching, isError, refetch } = useGetPaginatedGamesQuery(queryParams);
  const [fetchRandomGame, { isFetching: isRandomLoading }] = useLazyGetRandomGameQuery();
  const { isInLibrary, getEntryForGame, addToLibrary } = useLibrary();
  const [randomNotice, setRandomNotice] = useState<string | null>(null);

  const games = data?.items ?? [];
  const totalGames = data?.total ?? 0;
  const totalPages = Math.max(1, data?.total_pages ?? 1);

  const handleCardClick = (gameId: string) => {
    dispatch(openGameDetails(gameId));
  };

  const handleLibraryAction = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    const entry = getEntryForGame(game.id);
    if (entry) {
      dispatch(openStatusDialog(entry));
    } else {
      addToLibrary(game.id);
    }
  };

  const handleSurpriseMe = async () => {
    setRandomNotice(null);
    try {
      const randomGame = await fetchRandomGame({
        genre: genre !== "All" ? genre : undefined,
        platform: platform !== "All" ? platform : undefined,
      }).unwrap();
      dispatch(openGameDetails(randomGame.id));
    } catch {
      setRandomNotice("No games matched the active genre/platform combination for random pick.");
    }
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-8 space-y-6">
      <CatalogHero gamesCount={totalGames} isLoading={isLoading} isError={isError} />

      <CatalogFilterBar
        search={search}
        onSearchChange={setSearch}
        genre={genre}
        onGenreChange={setGenre}
        platform={platform}
        onPlatformChange={setPlatform}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={(mode) => dispatch(setViewMode(mode))}
        genres={genres}
        platforms={platforms}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        onSurpriseMe={handleSurpriseMe}
        isRandomLoading={isRandomLoading}
      />

      {randomNotice && (
        <div
          role="status"
          className="rounded-lg border border-border bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground"
        >
          {randomNotice}
        </div>
      )}

      {isLoading && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-76 rounded-lg bg-muted/50 animate-pulse border border-border"
            />
          ))}
        </div>
      )}

      {isLoading && viewMode === "list" && (
        <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-20 bg-muted/30 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive space-y-3">
          <p className="font-bold text-base">Failed to load games catalog.</p>
          <p className="text-xs text-muted-foreground">
            Please verify the backend server is running on port 8001.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && games.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-4 max-w-md mx-auto my-8">
          <Sparkles className="mx-auto h-9 w-9 text-muted-foreground" />
          <h3 className="font-serif text-lg font-bold">No matching games found</h3>
          <p className="text-sm text-muted-foreground">
            No titles match your current search and filter combination.
          </p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Reset Filters
          </Button>
        </div>
      )}

      {!isLoading && !isError && games.length > 0 && (
        <>
          {viewMode === "grid" ? (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-opacity duration-150 ${
                isFetching ? "opacity-70" : "opacity-100"
              }`}
            >
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  inLibrary={isInLibrary(game.id)}
                  entry={getEntryForGame(game.id)}
                  onCardClick={handleCardClick}
                  onLibraryAction={handleLibraryAction}
                />
              ))}
            </div>
          ) : (
            <div
              className={`rounded-lg border border-border bg-card divide-y divide-border overflow-hidden transition-opacity duration-150 ${
                isFetching ? "opacity-70" : "opacity-100"
              }`}
            >
              {games.map((game) => (
                <GameListRow
                  key={game.id}
                  game={game}
                  inLibrary={isInLibrary(game.id)}
                  entry={getEntryForGame(game.id)}
                  onCardClick={handleCardClick}
                  onLibraryAction={handleLibraryAction}
                />
              ))}
            </div>
          )}

          <nav
            aria-label="Catalog pagination"
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-border"
          >
            <p className="font-mono tabular-nums text-xs text-muted-foreground">
              Page <span className="font-bold text-foreground">{page}</span> of{" "}
              <span className="font-bold text-foreground">{totalPages}</span> ·{" "}
              {totalGames.toLocaleString("en-US")} titles
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => handlePageChange(page - 1)}
                aria-label="Previous catalog page"
                className="rounded-md"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => handlePageChange(page + 1)}
                aria-label="Next catalog page"
                className="rounded-md"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
