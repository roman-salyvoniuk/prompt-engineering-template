import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Info, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GameHeroBanner } from "@/features/games/GameHeroBanner";
import { GameTrackingCard } from "@/features/games/GameTrackingCard";
import { useAuth } from "@/hooks/useAuth";
import { useLibrary } from "@/hooks/useLibrary";
import { useGetGameQuery } from "@/store/api/gamesApi";
import { setCurrentView } from "@/store/slices/appSlice";
import type { AppDispatch, RootState } from "@/store/store";
import type { PlayStatus } from "@/types";

export function GameDetailsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const selectedGameId = useSelector((state: RootState) => state.app.selectedGameId);
  const { isAuthenticated, openLoginModal } = useAuth();
  const { isInLibrary, getEntryForGame, addToLibrary, updateEntry, removeEntry, isMutating } =
    useLibrary();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    data: game,
    isLoading,
    isError,
  } = useGetGameQuery(selectedGameId || "", {
    skip: !selectedGameId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-8 max-w-6xl animate-pulse space-y-6">
        <div className="h-9 w-32 bg-muted rounded-md" />
        <div className="h-96 bg-muted rounded-xl" />
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md space-y-4">
        <h2 className="font-serif text-2xl font-bold">Game Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested game could not be retrieved from the catalog.
        </p>
        <Button onClick={() => dispatch(setCurrentView("catalog"))} className="rounded-md">
          Back to Catalog
        </Button>
      </div>
    );
  }

  const inLibrary = isInLibrary(game.id);
  const entry = getEntryForGame(game.id);

  const handleStatusChange = async (newStatus: PlayStatus) => {
    if (entry) {
      await updateEntry(entry.id, { status: newStatus });
    }
  };

  const handleRatingChange = async (newRating: number | null) => {
    if (entry) {
      await updateEntry(entry.id, { rating: newRating });
    }
  };

  const handleFavoriteToggle = async () => {
    if (entry) {
      await updateEntry(entry.id, { is_favorite: !entry.is_favorite });
    }
  };

  const handleNotesSave = async (notes: string) => {
    if (entry) {
      await updateEntry(entry.id, { notes });
    }
  };

  const handleConfirmedRemove = async () => {
    if (entry) {
      await removeEntry(entry.id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-8 max-w-6xl space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch(setCurrentView("catalog"))}
          className="text-muted-foreground hover:text-foreground -ml-2 rounded-md"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Catalog
        </Button>
      </div>

      <GameHeroBanner
        game={game}
        inLibrary={inLibrary}
        entry={entry}
        isAuthenticated={isAuthenticated}
        isMutating={isMutating}
        onLoginClick={openLoginModal}
        onAddToLibrary={addToLibrary}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-7 space-y-3 shadow-2xs">
            <h2 className="font-serif text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
              <Info className="h-5 w-5 text-primary" />
              About the Game
            </h2>
            <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground whitespace-pre-line">
              {game.description}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-7 space-y-4 shadow-2xs">
            <h2 className="font-serif text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
              <Layers className="h-5 w-5 text-primary" />
              Game Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="rounded-lg border border-border bg-muted/35 p-3.5 space-y-1">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Developer / Publisher
                </span>
                <p className="font-semibold text-sm text-foreground">{game.developer}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/35 p-3.5 space-y-1">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Release Year
                </span>
                <p className="font-mono tabular-nums font-semibold text-sm text-foreground">
                  {game.release_year}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/35 p-3.5 space-y-1">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Primary Genres
                </span>
                <p className="font-semibold text-sm text-foreground">{game.genres.join(", ")}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/35 p-3.5 space-y-1">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Supported Platforms
                </span>
                <p className="font-semibold text-sm text-foreground">{game.platforms.join(", ")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <GameTrackingCard
            isAuthenticated={isAuthenticated}
            inLibrary={inLibrary}
            entry={entry}
            isMutating={isMutating}
            onStatusChange={handleStatusChange}
            onRatingChange={handleRatingChange}
            onFavoriteToggle={handleFavoriteToggle}
            onNotesSave={handleNotesSave}
            onRequestRemove={() => setConfirmOpen(true)}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove from library?"
        description={`Remove "${game.title}" from your personal library? It will remain in the global catalog.`}
        confirmLabel="Remove Game"
        isLoading={isMutating}
        onConfirm={handleConfirmedRemove}
      />
    </div>
  );
}
