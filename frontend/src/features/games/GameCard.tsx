import type * as React from "react";
import { Check, Heart, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Game, LibraryEntry } from "@/types";

interface GameCardProps {
  game: Game;
  inLibrary: boolean;
  entry?: LibraryEntry;
  onCardClick: (gameId: string) => void;
  onLibraryAction: (e: React.MouseEvent, game: Game) => void;
}

function shortPlatform(platform: string): string {
  if (platform === "PlayStation") return "PS";
  if (platform === "Nintendo Switch") return "Switch";
  if (platform === "Web Browser") return "Web";
  return platform;
}

export function GameCard({ game, inLibrary, entry, onCardClick, onLibraryAction }: GameCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCardClick(game.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View details for ${game.title}`}
      onClick={() => onCardClick(game.id)}
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

        {inLibrary && entry?.is_favorite && (
          <div
            className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-md bg-rose-600/95 text-white shadow-xs"
            title="Favorite game"
          >
            <Heart className="h-3 w-3 fill-current" />
          </div>
        )}

        {inLibrary && entry && (
          <div className="absolute top-2 right-2">
            <Badge
              variant={entry.status}
              className="rounded-md bg-background/90 backdrop-blur-xs shadow-xs font-semibold"
            >
              <Check className="mr-1 h-3 w-3" />
              {entry.status.replace(/_/g, " ")}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-3.5 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="truncate font-medium">
              <span className="font-mono tabular-nums font-semibold text-foreground/80">
                {game.release_year}
              </span>
              <span className="mx-1.5">·</span>
              {game.developer}
            </span>
            <div className="flex gap-1 shrink-0">
              {game.platforms.slice(0, 2).map((plat) => (
                <span
                  key={plat}
                  className="rounded-sm border border-border bg-muted/60 px-1 py-0.2 font-mono text-[9px] font-medium text-muted-foreground"
                >
                  {shortPlatform(plat)}
                </span>
              ))}
            </div>
          </div>

          <h3 className="font-bold text-[15px] leading-snug tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {game.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        </div>

        <div className="pt-2.5 border-t border-border/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate text-[11px] font-medium text-muted-foreground">
              {game.genres.slice(0, 2).join(" / ")}
            </span>
            {inLibrary && entry?.rating !== null && entry?.rating !== undefined && (
              <span className="inline-flex items-center gap-0.5 shrink-0 font-mono tabular-nums text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                {entry.rating}
              </span>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            variant={inLibrary ? "secondary" : "default"}
            aria-label={
              inLibrary ? `Edit ${game.title} in library` : `Add ${game.title} to library`
            }
            className="h-7 px-2.5 text-xs rounded-md shrink-0 font-semibold"
            onClick={(e) => onLibraryAction(e, game)}
          >
            {inLibrary ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Saved
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                Log
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
