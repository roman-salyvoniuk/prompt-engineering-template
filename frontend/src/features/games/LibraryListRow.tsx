import type * as React from "react";
import { Edit3, Heart, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LibraryEntry } from "@/types";

interface LibraryListRowProps {
  entry: LibraryEntry;
  isMutating: boolean;
  onOpenDetails: (gameId: string) => void;
  onToggleFavorite: (entry: LibraryEntry) => Promise<void>;
  onEdit: (entry: LibraryEntry) => void;
  onRequestRemove: (entry: LibraryEntry) => void;
}

export function LibraryListRow({
  entry,
  isMutating,
  onOpenDetails,
  onToggleFavorite,
  onEdit,
  onRequestRemove,
}: LibraryListRowProps) {
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
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-3 bg-card hover:bg-muted/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <div className="w-24 sm:w-28 aspect-[16/10] rounded-md overflow-hidden bg-muted cover-frame shrink-0">
          <img
            src={game.cover_image}
            alt={game.title}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80";
            }}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
              {game.title}
            </h3>
            <Badge variant={entry.status} className="rounded-md px-2 py-0 text-[10px]">
              {entry.status.replace(/_/g, " ")}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground truncate">
            <span>{game.developer}</span>
            <span className="mx-1.5">·</span>
            <span className="font-mono tabular-nums">{game.release_year}</span>
          </p>

          {entry.notes && (
            <p className="font-serif italic text-xs text-muted-foreground line-clamp-1">
              "{entry.notes}"
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-0 sm:pl-2">
        <div className="w-16 text-left sm:text-right">
          {entry.rating !== null ? (
            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-xs font-bold text-amber-600 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
              {entry.rating}/10
            </span>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">—</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-pressed={entry.is_favorite}
            aria-label={entry.is_favorite ? `Unfavorite ${game.title}` : `Favorite ${game.title}`}
            disabled={isMutating}
            onClick={async (e) => {
              e.stopPropagation();
              await onToggleFavorite(entry);
            }}
            className={`h-8 w-8 ${
              entry.is_favorite
                ? "text-rose-500 hover:text-rose-600"
                : "text-muted-foreground hover:text-rose-500"
            }`}
          >
            <Heart className={`h-4 w-4 ${entry.is_favorite ? "fill-current" : ""}`} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label={`Edit ${game.title}`}
            title="Edit status, rating or notes"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(entry);
            }}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label={`Remove ${game.title}`}
            title="Remove from library"
            disabled={isMutating}
            onClick={(e) => {
              e.stopPropagation();
              onRequestRemove(entry);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
