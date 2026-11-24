import { Calendar, Check, Code2, Gamepad2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Game, LibraryEntry } from "@/types";

interface GameHeroBannerProps {
  game: Game;
  inLibrary: boolean;
  entry?: LibraryEntry;
  isAuthenticated: boolean;
  isMutating: boolean;
  onLoginClick: () => void;
  onAddToLibrary: (gameId: string) => void;
}

export function GameHeroBanner({
  game,
  inLibrary,
  entry,
  isAuthenticated,
  isMutating,
  onLoginClick,
  onAddToLibrary,
}: GameHeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 dark:opacity-20 blur-2xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${game.cover_image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-card/55" />

      <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-center lg:items-start gap-7">
        <div className="w-full lg:w-[440px] shrink-0">
          <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted shadow-md cover-frame relative group">
            <img
              src={game.cover_image}
              alt={game.title}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80";
              }}
            />

            <div className="absolute bottom-2.5 left-2.5">
              <span className="rounded-md bg-black/75 backdrop-blur-xs px-2 py-0.5 font-mono tabular-nums text-xs font-bold text-white border border-white/15">
                {game.release_year}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 text-center lg:text-left w-full">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5">
            {game.genres.map((g) => (
              <Badge key={g} variant="secondary" className="px-2.5 py-0.5 font-semibold rounded-md">
                {g}
              </Badge>
            ))}
            {inLibrary && entry && (
              <Badge variant={entry.status} className="px-2.5 py-0.5 font-semibold rounded-md">
                <Check className="mr-1 h-3 w-3" />
                {entry.status.replace(/_/g, " ")}
              </Badge>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-foreground">
            {game.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground/85">
              <Code2 className="h-4 w-4 text-primary" />
              <span>{game.developer}</span>
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5 font-mono tabular-nums font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{game.release_year}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 pt-1">
            {game.platforms.map((plat) => (
              <span
                key={plat}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground/90"
              >
                <Gamepad2 className="h-3.5 w-3.5 text-primary" />
                {plat}
              </span>
            ))}
          </div>

          <div className="pt-2 flex justify-center lg:justify-start">
            {!isAuthenticated ? (
              <Button className="h-10 px-5 rounded-md font-semibold" onClick={onLoginClick}>
                Log In to Log Game
              </Button>
            ) : !inLibrary ? (
              <Button
                className="h-10 px-5 rounded-md font-semibold"
                onClick={() => onAddToLibrary(game.id)}
                disabled={isMutating}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add to My Library
              </Button>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2 rounded-md">
                <Check className="h-4 w-4" />
                In Your Personal Library
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
