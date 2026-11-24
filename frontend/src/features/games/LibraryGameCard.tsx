import type * as React from "react";
import { Edit3, Heart, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LibraryEntry } from "@/types";

interface LibraryGameCardProps {
  entry: LibraryEntry;
  isMutating: boolean;
  onOpenDetails: (gameId: string) => void;
  onToggleFavorite: (entry: LibraryEntry) => Promise<void>;
  onEdit: (entry: LibraryEntry) => void;
  onRequestRemove: (entry: LibraryEntry) => void;
}

export function LibraryGameCard({
  entry,
  isMutating,
  onOpenDetails,
  onToggleFavorite,
  onEdit,
  onRequestRemove,
}: LibraryGameCardProps) {
  const game = entry.game;
  if (!game) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenDetails(game.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${game.title} details`}
      onClick={() => onOpenDetails(game.id)}
      onKeyDown={handleKeyDown}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-[border-color,box-shadow] duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted relative cover-frame">
        <img
          src={game.cover_image}
          alt={game.title}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80";
          }}
        />
        <button
          type="button"
          aria-pressed={entry.is_favorite}
          aria-label={entry.is_favorite ? `Unfavorite ${game.title}` : `Favorite ${game.title}`}
          disabled={isMutating}
          onClick={async (e) => {
            e.stopPropagation();
            await onToggleFavorite(entry);
          }}
          className={`absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-md backdrop-blur-xs shadow-xs transition-colors cursor-pointer ${
            entry.is_favorite
              ? "bg-rose-600 text-white"
              : "bg-black/55 text-white/85 hover:bg-rose-600 hover:text-white"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${entry.is_favorite ? "fill-current" : ""}`} />
        </button>
        <div className="absolute top-2 right-2">
          <Badge
            variant={entry.status}
            className="rounded-md bg-background/90 backdrop-blur-xs shadow-xs"
          >
            {entry.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-3.5 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="truncate max-w-[165px] font-medium">{game.developer}</span>
            <span className="font-mono tabular-nums font-semibold">{game.release_year}</span>
          </div>
          <h3 className="font-bold text-[15px] leading-snug tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {game.title}
          </h3>
          {entry.notes && (
            <p className="font-serif italic text-xs text-muted-foreground line-clamp-2">
              "{entry.notes}"
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-border/70 text-xs">
          {entry.rating !== null ? (
            <span className="flex items-center gap-1 font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
              {entry.rating}/10
            </span>
          ) : (
            <span className="text-muted-foreground italic text-[11px]">Unrated</span>
          )}

          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={`Edit ${game.title}`}
              title="Edit status, rating or notes"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
              }}
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label={`Remove ${game.title}`}
              title="Remove from library"
              disabled={isMutating}
              onClick={(e) => {
                e.stopPropagation();
                onRequestRemove(entry);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
