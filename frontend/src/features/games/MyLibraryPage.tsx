import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LibraryActionsBar, type LibrarySortBy } from "@/features/games/LibraryActionsBar";
import { LibraryGameCard } from "@/features/games/LibraryGameCard";
import { LibraryListRow } from "@/features/games/LibraryListRow";
import { useLibrary } from "@/hooks/useLibrary";
import { useLibraryTransfer } from "@/hooks/useLibraryTransfer";
import {
  openGameDetails,
  openStatusDialog,
  setCurrentView,
  setLibraryFilter,
  setViewMode,
} from "@/store/slices/appSlice";
import type { AppDispatch, RootState } from "@/store/store";
import type { LibraryEntry, PlayStatus } from "@/types";

export function MyLibraryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const libraryFilter = useSelector((state: RootState) => state.app.libraryFilter);
  const viewMode = useSelector((state: RootState) => state.app.viewMode);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<LibrarySortBy>("updated_desc");
  const [pendingRemoveEntry, setPendingRemoveEntry] = useState<LibraryEntry | null>(null);

  const activeStatus =
    libraryFilter === "all" || libraryFilter === "favorites"
      ? undefined
      : (libraryFilter as PlayStatus);
  const {
    entries,
    stats,
    isLoading,
    isError,
    updateEntry,
    removeEntry,
    isMutating,
    refetchLibrary,
  } = useLibrary(activeStatus);

  const {
    feedbackMessage,
    errorMessage,
    isExporting,
    isImporting,
    handleExportJson,
    handleExportCsv,
    handleImportFile,
  } = useLibraryTransfer();

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = entries.filter((entry) => {
      if (libraryFilter === "favorites" && !entry.is_favorite) return false;
      if (!q) return true;
      const title = entry.game?.title.toLowerCase() ?? "";
      const dev = entry.game?.developer.toLowerCase() ?? "";
      const notes = (entry.notes ?? "").toLowerCase();
      return title.includes(q) || dev.includes(q) || notes.includes(q);
    });

    return [...list].sort((a, b) => {
      if (sortBy === "rating_desc") return (b.rating ?? -1) - (a.rating ?? -1);
      if (sortBy === "title_asc") return (a.game?.title ?? "").localeCompare(b.game?.title ?? "");
      return b.updated_at.localeCompare(a.updated_at);
    });
  }, [entries, libraryFilter, search, sortBy]);

  const tabs = [
    { id: "all", label: "All Games", count: stats?.total_games ?? 0 },
    { id: "favorites", label: "Favorites", count: stats?.favorites_count ?? 0 },
    { id: "want_to_play", label: "Want to Play", count: stats?.want_to_play_count ?? 0 },
    { id: "playing", label: "Playing", count: stats?.playing_count ?? 0 },
    { id: "completed", label: "Completed", count: stats?.completed_count ?? 0 },
  ] as const;

  const handleToggleFavorite = async (item: LibraryEntry) => {
    await updateEntry(item.id, { is_favorite: !item.is_favorite });
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-8 space-y-6">
      <header className="border-b border-border pb-5 space-y-1.5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          Personal Collection
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          My Game Library
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your backlog, active playthroughs, ratings, favorites, and journal notes.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-1 border-b border-border pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => dispatch(setLibraryFilter(tab.id))}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              libraryFilter === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-sm px-1.5 py-0.2 font-mono tabular-nums text-[10px] font-bold ${
                libraryFilter === tab.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <LibraryActionsBar
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={(mode) => dispatch(setViewMode(mode))}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
        isExporting={isExporting}
        onImportFile={handleImportFile}
        isImporting={isImporting}
        feedbackMessage={feedbackMessage}
        errorMessage={errorMessage}
      />

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-72 rounded-lg bg-muted/50 animate-pulse border border-border"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive space-y-3">
          <p className="font-bold text-base">Failed to load your personal library.</p>
          <Button type="button" variant="outline" size="sm" onClick={refetchLibrary}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && filteredEntries.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-4 max-w-md mx-auto my-8">
          <Sparkles className="mx-auto h-9 w-9 text-muted-foreground" />
          <h3 className="font-serif text-xl font-bold">No games in this section</h3>
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? "No library games match your current search filter."
              : libraryFilter === "all"
                ? "Your library is empty. Browse the catalog and log games you'd like to play."
                : `You don't have any games in "${libraryFilter.replace(/_/g, " ")}".`}
          </p>
          <Button onClick={() => dispatch(setCurrentView("catalog"))}>Browse Catalog</Button>
        </div>
      )}

      {!isLoading && !isError && filteredEntries.length > 0 && (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredEntries.map((entry) => (
                <LibraryGameCard
                  key={entry.id}
                  entry={entry}
                  isMutating={isMutating}
                  onOpenDetails={(gameId) => dispatch(openGameDetails(gameId))}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={(item) => dispatch(openStatusDialog(item))}
                  onRequestRemove={setPendingRemoveEntry}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
              {filteredEntries.map((entry) => (
                <LibraryListRow
                  key={entry.id}
                  entry={entry}
                  isMutating={isMutating}
                  onOpenDetails={(gameId) => dispatch(openGameDetails(gameId))}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={(item) => dispatch(openStatusDialog(item))}
                  onRequestRemove={setPendingRemoveEntry}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={pendingRemoveEntry !== null}
        onOpenChange={(open) => !open && setPendingRemoveEntry(null)}
        title="Remove from library?"
        description={`Remove "${pendingRemoveEntry?.game?.title ?? "this game"}" from your personal library?`}
        confirmLabel="Remove Game"
        isLoading={isMutating}
        onConfirm={async () => {
          if (pendingRemoveEntry) {
            await removeEntry(pendingRemoveEntry.id);
          }
        }}
      />
    </div>
  );
}
