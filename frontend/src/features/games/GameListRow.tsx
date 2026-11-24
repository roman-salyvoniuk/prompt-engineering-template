import type * as React from "react";
import { Check, Heart, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Game, LibraryEntry } from "@/types";

interface GameListRowProps {
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

export function GameListRow({
  game,
  inLibrary,
  entry,
  onCardClick,
  onLibraryAction,
}: GameListRowProps) {
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
      className="group flex items-center justify-between gap-3 sm:gap-4 px-3.5 py-2.5 bg-card hover:bg-muted/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
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

        <div className="min-w-0 space-y-1 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
              {game.title}
            </h3>
            {inLibrary && entry?.is_favorite && (
              <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 shrink-0" />
            )}
            {inLibrary && entry && (
              <Badge variant={entry.status} className="rounded-md px-2 py-0 text-[10px]">
                {entry.status.replace(/_/g, " ")}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground truncate">
            <span className="font-medium text-foreground/80">{game.developer}</span>
            {game.genres.length > 0 && (
              <>
                <span className="mx-1.5">·</span>
                <span>{game.genres.slice(0, 3).join(", ")}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-1">
          {game.platforms.slice(0, 3).map((plat) => (
            <span
              key={plat}
              className="rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground"
            >
              {shortPlatform(plat)}
            </span>
          ))}
        </div>

        <span className="hidden sm:inline-block w-12 text-right font-mono tabular-nums text-xs font-semibold text-muted-foreground">
          {game.release_year}
        </span>

        {inLibrary && entry?.rating !== null && entry?.rating !== undefined && (
          <span className="hidden sm:inline-flex items-center gap-1 font-mono tabular-nums text-xs font-bold text-amber-600 dark:text-amber-400">
            <Star className="h-3 w-3 fill-current" />
            {entry.rating}
          </span>
        )}

        <Button
          type="button"
          size="sm"
          variant={inLibrary ? "secondary" : "default"}
          aria-label={inLibrary ? `Edit ${game.title} in library` : `Add ${game.title} to library`}
          className="h-8 px-3 text-xs rounded-md font-semibold"
          onClick={(e) => onLibraryAction(e, game)}
        >
          {inLibrary ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1" />
              Saved
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Log
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
